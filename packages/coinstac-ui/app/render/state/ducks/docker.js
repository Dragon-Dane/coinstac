'use strict';

import ipcPromise from 'ipc-promise';
import { applyAsyncLoading } from './loading';
import { notifySuccess } from './notifyAndLog';

// Actions
export const CLEAR_DOCKER_OUTPUT = 'CLEAR_DOCKER_OUTPUT';
export const GET_LOCAL_IMAGES = 'GET_LOCAL_IMAGES';
export const PULL_COMPUTATIONS = 'PULL_COMPUTATIONS';
export const REMOVE_IMAGE = 'REMOVE_IMAGE';
export const UPDATE_DOCKER_OUTPUT = 'UPDATE_DOCKER_OUTPUT';

// Action Creators
export const getDockerImages = applyAsyncLoading(() =>
  dispatch =>
    ipcPromise.send('get-all-images')
      .then(res =>
        dispatch({ payload: res, type: GET_LOCAL_IMAGES })
      )
);

export const pullComputations = applyAsyncLoading(compsAndConsortiumId =>
  dispatch =>
    ipcPromise.send('download-comps', compsAndConsortiumId)
    .then((res) => {
      dispatch({ payload: true, type: PULL_COMPUTATIONS });
      return res;
    })
    .catch((err) => {
      dispatch({ payload: false, type: PULL_COMPUTATIONS });
      return err;
    })
);

export const removeImage = applyAsyncLoading((imgName, imgId) =>
  dispatch =>
    ipcPromise.send('remove-image', imgId)
    .then(() => {
      dispatch({ payload: imgName, type: REMOVE_IMAGE });
    })
);

export const updateDockerOutput = (output =>
  (dispatch) => {
    if (output.output[0].id && output.output[0].id.indexOf('-complete') > -1) {
      dispatch(notifySuccess({ message: `${output.compName} Download Complete` }));
      dispatch(getDockerImages());
    }

    dispatch({ payload: output, type: UPDATE_DOCKER_OUTPUT });
  }
);

const INITIAL_STATE = {
  dockerOut: {},
  dlComplete: false,
  localImages: {},
};

// Reducer
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case CLEAR_DOCKER_OUTPUT:
      return { ...state, dockerOut: {} };
    case GET_LOCAL_IMAGES: {
      const localImages = {};
      action.payload.forEach((image) => {
        const name = image.RepoTags[0].split(':')[0];
        localImages[name] = { id: image.Id, size: image.Size };
      });
      return { ...state, localImages };
    }
    case PULL_COMPUTATIONS:
      return { ...state, dlComplete: action.payload };
    case REMOVE_IMAGE: {
      const localImages = state.localImages;
      delete localImages[action.payload];
      return { ...state, localImages };
    }
    case UPDATE_DOCKER_OUTPUT: {
      const { compId, output } = action.payload;
      const { dockerOut } = state;
      let complete = false;
      let outputCopy = [];
      if (dockerOut[compId]) {
        outputCopy = [...dockerOut[compId]];
      }

      output.forEach((newOut) => {
        let elemIndex = -1;

        if (newOut.id && newOut.id !== 'latest') {
          elemIndex = outputCopy.findIndex(currentOut => newOut.id === currentOut.id);
        } else if (newOut.id && newOut.id === 'latest') {
          elemIndex = outputCopy.findIndex(currentOut =>
            newOut.id === currentOut.id && newOut.status === currentOut.status
          );
        }

        if (elemIndex === -1 && !newOut.id) {
          elemIndex = outputCopy
            .findIndex(currentOut => newOut.status === currentOut.status);
        }

        if (newOut.id && newOut.status && newOut.id.indexOf('-complete') > -1 && newOut.status === 'complete') {
          complete = true;
        } else if (elemIndex === -1) {
          outputCopy.push(newOut);
        } else {
          outputCopy[elemIndex] = newOut;
        }
      });

      if (complete) {
        outputCopy = null;
      }

      return { ...state, dockerOut: { ...state.dockerOut, [compId]: outputCopy } };
    }
    default:
      return state;
  }
}