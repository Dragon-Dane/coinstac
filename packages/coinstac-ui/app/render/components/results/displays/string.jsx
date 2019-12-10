import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import _ from 'lodash';
import kebabcase from 'lodash';
import { remote } from 'electron';
import { notifySuccess, notifyError, writeLog } from '../../../state/ducks/notifyAndLog';

// Get Base App Dir
const dir = remote.getGlobal('config').get('coinstacHome');

class String extends Component {
  constructor(props) {
    super(props);
  }

  /**
   * humanize
   * Converts underscored lowercase string to human readable Title
   * Also converts 'Beta' to symbol β
   * @param  {string} str Input String to Convert
   * @return {string}     Converted String to Title
   */

  // ignore weird class-methods-use-this lint error
  // eslint-disable-next-line
    componentDidMount = () => {
      setTimeout(this.renderCanvas, 1000);
    }

    render() {
      const { plotData } = this.props;
      return (
        <div>
          <div>
            <p>{plotData.message}</p>
            <p><img src={`data:image/png;base64, ${plotData.display}`} /></p>
            <Button
              variant="contained"
              color="primary"
              href={`${dir}/${plotData.download_outputs}`}
            >
              Download
            </Button>
          </div>
        </div>
      );
    }
}

String.propTypes = {
  notifyError: PropTypes.func.isRequired,
  writeLog: PropTypes.func.isRequired,
};

String.defaultProps = {
  plotData: null,
};

const mapStateToProps = ({ auth: { user } }) => {
  return {
    user,
  };
};

const connectedComponent = connect(mapStateToProps, {
  notifyError,
  writeLog,
})(String);

export default connectedComponent;
