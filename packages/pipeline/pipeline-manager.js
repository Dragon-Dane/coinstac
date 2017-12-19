'use strict';

const Pipeline = require('./pipeline');
const http = require('http');
const socketIO = require('socket.io');
const socketIOClient = require('socket.io-client');
const _ = require('lodash');
const { promisify } = require('util');
const mkdirp = promisify(require('mkdirp'));

module.exports = {

  create({ mode, clientId, server, operatingDirectory = './' }) {
    const activePipelines = {};
    let io;
    let socket;
    let missedCache;
    let remoteClients = {};

    // if (server && mode === 'remote') {
    //   server.start();
    // }
    const waitingOn = (runId) => {
      const waiters = [];
      for (let [key, val] of Object.entries(remoteClients)) { // eslint-disable-line no-restricted-syntax, max-len, prefer-const
        if (val[runId] && !val[runId].currentOutput) {
          waiters.push(key);
        }
      }
      return waiters;
    };

    const aggregateRun = (runId) => {
      return _.reduce(remoteClients, (memo, client, id) => {
        if (client[runId]) {
          memo[id] = client[runId].currentOutput;
        }
        return memo;
      }, {});
    };

    // TODO: secure socket layer
    if (mode === 'remote') {
      const app = http.createServer();
      io = socketIO(app);

      app.listen(3000);
      io.on('connection', (socket) => {
        // TODO: not the way to do this, as runs would have to
        // always start before clients connected....
        // need proper auth
        // if (!remoteClients[socket.handshake.query.id]) {
        //   // bye 👋
        //   socket.disconnect();
        // }

        socket.emit('hello', { status: 'connected' });

        socket.on('register', (data) => {
          if (remoteClients[data.id]) {
            remoteClients[data.id].status = 'connected';
            remoteClients[data.id].socketId = socket.id;
          }
        });

        socket.on('run', (data) => {
          // TODO: probably put in a 'pre-run' route?
          socket.join(data.runId);
          remoteClients[data.id][data.runId].currentOutput = data.output.output;
          if (waitingOn(data.runId).length === 0) {
            activePipelines[data.runId].remote.resolve({ output: aggregateRun(data.runId) });
          }
        });

        socket.on('disconnect', (reason) => {
          const client = _.find(remoteClients, { socketId: socket.id });
          client.status = 'disconnected';
          client.error = reason;
        });
      });
    } else {
      // TODO: conffffiiiiigggg
      socket = socketIOClient(`http://localhost:3000?id=${clientId}`);
      socket.on('hello', () => {
        socket.emit('register', { id: clientId });
      });
      socket.on('run', (data) => {
        // TODO: step check?
        if (!data.error) {
          activePipelines[data.runId].remote.resolve(data.output);
        } else {
          activePipelines[data.runId].remote.reject(data.error);
        }
      });
    }


    return {
      activePipelines,
      clientId,
      io,
      mode,
      operatingDirectory,
      remoteClients,
      socket,
      startPipeline({ spec: { steps, inputMap }, clients = [], runId }) {
        activePipelines[runId] = {
          state: 'created',
          pipeline: Pipeline.create({ steps, inputMap, mode }, runId),
        };
        remoteClients = Object.assign(
          clients.reduce((memo, client) => {
            memo[client] = {
              status: 'unregistered',
              [runId]: {},
            };
            return memo;
          }, {}),
          remoteClients
        );

        const communicate = (pipeline, message) => {
          if (mode === 'remote') {
            io.of('/').to(pipeline.id).emit('run', { runId: pipeline.id, output: message });
            // hold the last step for clients who may drop, this only works for one step out
            missedCache[pipeline.id] = {
              pipelineStep: pipeline.step,
              controllerStep: pipeline.steps[pipeline.currentStep].controllerState.iteration,
              output: message,
            };
          } else {
            socket.emit('run', { id: clientId, runId: pipeline.id, output: message });
          }
        };

        const remoteHandler = (input, noop) => {
          let proxRes;
          let proxRej;

          const prom = new Promise((resolve, reject) => {
            proxRes = resolve;
            proxRej = reject;
          });
          activePipelines[runId].state = 'waiting for remote';
          activePipelines[runId].remote = {
            resolve: proxRes,
            error: proxRej,
          };
          if (!noop) {
            communicate(activePipelines[runId].pipeline, input);
          }
          return prom;
        };
        const pipelineProm = activePipelines[runId].pipeline.run(remoteHandler);
        activePipelines[runId].state = 'running';

        return Promise.all([
          mkdirp(`${operatingDirectory}/${runId}`),
          mkdirp(`${operatingDirectory}/${runId}/output`),
          mkdirp(`${operatingDirectory}/${runId}/cache`),
        ])
        .catch((err) => {
          throw new Error(`Unable to create pipeline directories: ${err}`);
        })
        .then(() => {
          pipelineProm
          .then((res) => {
            activePipelines[runId].state = 'finished';
            return res;
          });
        });
      },
      waitingOn,
    };
  },
};
