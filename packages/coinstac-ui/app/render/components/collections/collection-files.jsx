import React, { Component } from 'react';
import { connect } from 'react-redux';
import naturalSort from 'javascript-natural-sort';
import {
  Accordion,
  Alert,
  Button,
  Form,
  FormGroup,
  Panel,
  Radio,
} from 'react-bootstrap';
import PropTypes from 'prop-types';
import ipcPromise from 'ipc-promise';
import shortid from 'shortid';
import electronFs from 'fs';
import { unmapAssociatedConsortia } from '../../state/ducks/collections';

const styles = {
  fileLabelRow: { margin: 0 },
};

class CollectionFiles extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filesError: null,
      newFile: {
        open: false,
        org: '',
      },
      showFiles: {},
    };

    this.addBids = this.addBids.bind(this);
    this.addSingle = this.addSingle.bind(this);
    this.addFileGroup = this.addFileGroup.bind(this);
    this.addFilesToGroup = this.addFilesToGroup.bind(this);
    this.removeFileGroup = this.removeFileGroup.bind(this);
    this.removeFileInGroup = this.removeFileInGroup.bind(this);
  }

  addBids() {
    this.setState({ newFile: { ...this.state.newFile, org: 'bids' } });
    ipcPromise.send('open-dialog', 'bids')
    .then((obj) => {
      let filePath;

      const fileGroupId = shortid.generate();

      if (obj.error) {
        this.setState({ filesError: obj.error });
      } else {
        const name = `Bids Folder`;

        let path = obj[0]

        // Might want to grab the contents of the Dir someday...
        // let files = [];
        // electronFs.readdir(path, (err, items) => {
        //   for (var i=0; i<items.length; i++) {
        //       var file = path + '/' + items[i];
        //       files.push(file);
        //   }
        // });

        console.log(path);

        filePath = {
          name,
          id: fileGroupId,
          files: path,
          date: new Date().getTime(),
          org: this.state.newFile.org,
        };

        console.log(filePath);

        this.setState({ showFiles: { [filePath.date]: false } });

        this.setState({ filesError: null });
        this.props.updateCollection(
          {
            fileGroups: {
              ...this.props.collection.fileGroups,
              [fileGroupId]: filePath,
            },
          },
          this.props.saveCollection
        );
      }
    })
    .catch(console.log);
  }

  addSingle() {
    this.setState({ newFile: { ...this.state.newFile, org: 'single' } });
    ipcPromise.send('open-dialog', 'single')
    .then((obj) => {
      let newFile;

      const fileGroupId = shortid.generate();

      if (obj.error) {
        this.setState({ filesError: obj.error });
      } else {
        const name = `Single File to Collection`;

        newFile = {
          name,
          id: fileGroupId,
          files: obj[0],
          date: new Date().getTime(),
          org: this.state.newFile.org,
        };

        console.log(newFile);

        this.setState({ showFiles: { [newFile.date]: false } });

        this.setState({ filesError: null });
        this.props.updateCollection(
          {
            fileGroups: {
              ...this.props.collection.fileGroups,
              [fileGroupId]: newFile,
            },
          },
          this.props.saveCollection
        );
      }
    })
    .catch(console.log);
  }

  addFileGroup() {
    this.setState({ newFile: { ...this.state.newFile, org: 'metafile' } });
    ipcPromise.send('open-dialog', 'metafile')
    .then((obj) => {
      let newFiles;

      const fileGroupId = shortid.generate();

      if (obj.error) {
        this.setState({ filesError: obj.error });
      } else {
        const name = `Group ${Object.keys(this.props.collection.fileGroups).length + 1} (${obj.extension.toUpperCase()})`;
        if (this.state.newFile.org === 'metafile') {
          newFiles = {
            ...obj,
            name,
            id: fileGroupId,
            date: new Date().getTime(),
            firstRow: obj.metaFile[0].join(', '),
            org: this.state.newFile.org,
          };
        } else {
          newFiles = {
            name,
            id: fileGroupId,
            extension: obj.extension,
            files: [...obj.paths.sort(naturalSort)],
            date: new Date().getTime(),
            org: this.state.newFile.org,
          };

          this.setState({ showFiles: { [newFiles.date]: false } });
        }

        this.setState({ filesError: null });
        this.props.updateCollection(
          {
            fileGroups: {
              ...this.props.collection.fileGroups,
              [fileGroupId]: newFiles,
            },
          },
          this.props.saveCollection
        );
      }
    })
    .catch(console.log);
  }

  addFilesToGroup(groupId, extension) {
    this.setState({ newFile: { ...this.state.newFile, org: 'manual' } });
    return () => {
      ipcPromise.send('open-dialog', this.state.newFile.org)
      .then((obj) => {
        if (obj.error || (obj.extension && obj.extension !== extension)) {
          let filesError;
          if (obj.error) {
            filesError = obj.error;
          } else {
            filesError = `New files don't match group extension - ${extension} & ${obj.extension}.`;
          }
          this.setState({ filesError });
        } else {
          const groups = { ...this.props.collection.fileGroups };
          groups[groupId].files = groups[groupId].files.concat(obj.paths);
          groups[groupId].files.sort(naturalSort);

          this.props.updateCollection(
            {
              fileGroups: {
                ...groups,
              },
            },
            this.props.saveCollection
          );
        }
      })
      .catch(console.log);
    };
  }

  removeFileInGroup(groupId, fileIndex) {
    return () => {
      const groups = { ...this.props.collection.fileGroups };
      groups[groupId].files.splice(fileIndex, 1);

      this.props.updateCollection(
        {
          fileGroups: {
            ...groups,
          },
        },
        this.props.saveCollection
      );
    };
  }

  removeFileGroup(groupId) {
    return () => {
      const groups = { ...this.props.collection.fileGroups };
      delete groups[groupId];

      // Props delete assocCons featuring groupId
      this.props.unmapAssociatedConsortia(this.props.collection.associatedConsortia)
      .then(() => {
        this.props.updateCollection(
          {
            fileGroups: { ...groups },
            associatedConsortia: [],
          },
          this.props.saveCollection
        );
      });
    };
  }

  render() {
    const {
      collection,
      saveCollection,
    } = this.props;

    return (
      <div>
        <Form onSubmit={saveCollection}>
          <h3>Collection Files</h3>

          <Panel>
            <Button
              block
              bsStyle="primary"
              onClick={this.addSingle}
            >
              Add Single File to Collection
            </Button>
            <Button
              block
              bsStyle="primary"
              onClick={this.addBids}
            >
              Add BIDS File Directory
            </Button>
            <Button
              block
              bsStyle="primary"
              onClick={this.addFileGroup}
            >
              Add Files Group
            </Button>
          </Panel>

          {this.state.filesError &&
            <Alert bsStyle="danger" style={{ ...styles.topMargin, textAlign: 'left', bottomMargin: 20 }}>
              <h4 style={{ fontStyle: 'normal' }}>File Error</h4>
              {this.state.filesError}
            </Alert>
          }

          {Object.values(collection.fileGroups).map(group => (
            <Panel key={`${group.date}-${group.extension}-${group.firstRow}`}>
              {group.org === 'bids' && group.files &&
                <div>
                  <Button
                    bsStyle="danger"
                    className="pull-right"
                    onClick={this.removeFileGroup(group.id)}
                  >
                    <span aria-hidden="true" className="glyphicon glyphicon-trash" />
                    {' '}
                    Remove Folder
                  </Button>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Name:</span> {group.name}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Date:</span> {new Date(group.date).toUTCString()}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">File Path:</span> {group.files}
                  </p>
                </div>
              }
              {group.org === 'single' && group.files[0].length > 0 &&
                <div>
                  {console.log(group.files)}
                  <Button
                    bsStyle="danger"
                    className="pull-right"
                    onClick={this.removeFileGroup(group.id)}
                  >
                    <span aria-hidden="true" className="glyphicon glyphicon-trash" />
                    {' '}
                    Remove File
                  </Button>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Name:</span> {group.name}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Date:</span> {new Date(group.date).toUTCString()}
                  </p>
                  <Accordion>
                    <Panel
                      header={`File (${group.files[0].length}):`}
                      style={{ marginTop: 10 }}
                    >
                    <div style={{ marginBottom: 5 }}>
                      {group.files}
                    </div>
                    </Panel>
                  </Accordion>
                </div>
              }
              {group.org === 'metafile' &&
                <div>
                  <Button
                    bsStyle="danger"
                    className="pull-right"
                    onClick={this.removeFileGroup(group.id)}
                  >
                    <span aria-hidden="true" className="glyphicon glyphicon-trash" />
                    {' '}
                    Remove File Group
                  </Button>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Name:</span> {group.name}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Date:</span> {new Date(group.date).toUTCString()}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Extension:</span> {group.extension}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Meta File Path:</span> {group.metaFilePath}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">First Row:</span> {group.firstRow}
                  </p>
                </div>
              }
              {group.org === 'manual' &&
                <div>
                  <Button
                    bsStyle="danger"
                    className="pull-right"
                    onClick={this.removeFileGroup(group.id)}
                  >
                    <span aria-hidden="true" className="glyphicon glyphicon-trash" />
                    {' '}
                    Remove File Group
                  </Button>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Name:</span> {group.name}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Date:</span> {new Date(group.date).toUTCString()}
                  </p>
                  <p style={styles.fileLabelRow}>
                    <span className="bold">Extension:</span> {group.extension}
                  </p>
                  <Accordion>
                    <Panel
                      header={`Files (${group.files.length}):`}
                      style={{ marginTop: 10 }}
                    >
                      <Button
                        bsStyle="success"
                        onClick={this.addFilesToGroup(group.id, group.extension)}
                        style={{ marginBottom: 10 }}
                      >
                        Add More Files to Group
                      </Button>
                      {group.files.map((file, fileIndex) =>
                        (<div key={file} style={{ marginBottom: 5 }}>
                          <button
                            aria-label="Delete"
                            style={{ border: 'none', background: 'none' }}
                            type="button"
                            onClick={this.removeFileInGroup(group.id, fileIndex)}
                          >
                            <span aria-hidden="true" className="glyphicon glyphicon-remove" style={{ color: 'red' }} />
                          </button>
                          {file}
                        </div>)
                      )}
                    </Panel>
                  </Accordion>
                </div>
              }
            </Panel>
          ))}
        </Form>
      </div>
    );
  }
}

CollectionFiles.propTypes = {
  collection: PropTypes.object,
  saveCollection: PropTypes.func.isRequired,
  unmapAssociatedConsortia: PropTypes.func.isRequired,
  updateCollection: PropTypes.func.isRequired,
};

CollectionFiles.defaultProps = {
  collection: null,
};

export default connect(null, { unmapAssociatedConsortia })(CollectionFiles);
