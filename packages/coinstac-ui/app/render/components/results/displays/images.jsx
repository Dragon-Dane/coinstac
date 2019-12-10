import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import RasterizeHTML from 'rasterizehtml';
import jsPDF from 'jspdf';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import _ from 'lodash';
import kebabcase from 'lodash';
import { notifySuccess, notifyError, writeLog } from '../../../state/ducks/notifyAndLog';

const styles = {
  print: { display: 'none', visibility: 'hidden' },
  container: { width: '100%' },
  column: { padding: '1rem' },
  spacer: { width: '1rem', color: '#fff !important' },
  image: { width: '100%', height: 'auto' },
  pdfButton: {
    position: 'absolute', top: '15.75rem', right: '1rem', zIndex: '9',
  },
  subItem: {
    position: 'relative', float: 'left', width: '95%', marginRight: '5%',
  },
  subpage: {
    position: 'relative', float: 'left', width: '100%', marginBottom: '2rem',
  },
};

class Images extends Component {
  constructor(props) {
    super(props);
    this.drawImageResults = this.drawImageResults.bind(this);
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
    humanize(str) {
    const frags = str.split('_');
    for (let i = 0; i < frags.length; i += 1) {
      frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    let string = frags.join(' ');
    string = string.replace('Beta', 'β ');
    return string;
  }

  /**
   * drawImageResults
   * Takes computation Result Object and displays list of Images
   * @param  {Object} obj Result Object
   * @return {Object}     JSX of Global and Local Results with Images
   */

  drawImageResults(obj) {
    const { classes } = this.props;
    const output = [];
    Object.entries(obj).forEach(([key, value]) => {
      const page = [];
      const subitem = [];
      const col1 = [];
      const col2 = [];
      let subcol1 = [];
      let subcol2 = [];
      if (key.includes('global')) {
        page.push(
          <span key={`span-global-${key}`}>
            <h2>{this.humanize(key)}</h2>
            <hr />
          </span>
        );
      }
      Object.entries(value).forEach(([k, v], i) => {
        const itemsLength = Object.entries(value).length;
        const item = [];
        if (key.includes('global')) {
          item.push(
            <h4 key={`image-${k}`}>{this.humanize(k).replace('.png', '')}</h4>
          );
        } else {
          item.push(
            <span key={`span-${k}`}>
              <h2 key={`image-${k}`}>
                Local Stats -
                {' '}
                {this.humanize(k).replace('.png', '')}
              </h2>
              <hr />
            </span>
          );
        }
        if (typeof v === 'string') {
          item.push(
            <img
              key={`${v}-img`}
              alt={`${v}-img`}
              src={`data:image/png;base64, ${v}`}
              className={classes.image}
            />
          );
        } else {
          Object.entries(v).forEach(([l, w], h) => {
            const subItemsLength = Object.entries(v).length;
            const subitem = [];
            subitem.push(
              <h4 key={`image-${k}-${l}`}>
                {this.humanize(l).replace('.png', '')}
              </h4>
            );
            if (typeof w === 'string') {
              subitem.push(
                <img
                  alt={`${w}-img`}
                  alt={`${w}-img`}
                  src={`data:image/png;base64, ${w}`}
                  className={classes.image}
                />
              );
            }
            if (h + 1 <= subItemsLength / 2 && subcol1.length < subItemsLength / 2) {
              subcol1.push(
                <div className={classNames('item', classes.imgItem)} key={`image-sub1-${key}-${k}-${l}`}>{subitem}</div>
              );
            }
            if (h + 1 > subItemsLength / 2 && subcol2.length < subItemsLength / 2) {
              subcol2.push(
                <div className={classNames('item', classes.imgItem)} key={`image-sub2-${key}-${k}-${l}`}>{subitem}</div>
              );
            }
          });
        }
        if (key.includes('global')) {
          if (i + 1 <= itemsLength / 2) {
            col1.push(
              <div className={classNames('item', classes.imgItem)} key={`page-${key}-${k}`}>{item}</div>
            );
          }
          if (i + 1 > itemsLength / 2) {
            col2.push(
              <div className={classNames('item', classes.imgItem)} key={`page-${key}-${k}`}>{item}</div>
            );
          }
        } else {
          page.push(
            <div className={classNames(`page-${k}`, classes.subpage)} ref={`page-${k}`} key={`page-${k}`}>
              {item}
              <table className={classes.container}>
                <tr className={classes.container}>
                  <td className={classes.column}>{subcol1}</td>
                  <td className={classes.spacer}>&nbsp; &nbsp; &nbsp;</td>
                  <td className={classes.column}>{subcol2}</td>
                </tr>
              </table>
            </div>
          );
          subcol1 = [];
          subcol2 = [];
        }
      });

      page.push(
        <table className={classes.container}>
          <tr className={classes.container}>
            <td className={classes.column}>{col1}</td>
            <td className={classes.spacer}>&nbsp; &nbsp; &nbsp;</td>
            <td className={classes.column}>{col2}</td>
          </tr>
        </table>
      );
      if (key.includes('global')) {
        output.push(
          <div key={`page-${key}`} className={classNames(`page-${key}`, classes.page)} ref="global_page">{page}</div>
        );
      } else {
        output.push(
          <div key={`page-${key}`} className={classNames('local_stats', classes.page)} ref={`local_page_${key}`}>{page}</div>
        );
      }
    });
    return output;
  }

  renderCanvas = () => {
    const { plotData } = this.props;
    const global_canvas = ReactDOM.findDOMNode(this.refs.global_canvas);
    const global_results = ReactDOM.findDOMNode(this.refs.global_page);
    RasterizeHTML.drawHTML(global_results.innerHTML, global_canvas);
    Object.entries(plotData.local_stats).forEach(([key, value]) => {
      const canvas = `${key}_canvas`;
      const page = `page-${key}`;
      const key_canvas = ReactDOM.findDOMNode(this.refs[canvas]);
      const key_results = ReactDOM.findDOMNode(this.refs[page]);
      RasterizeHTML.drawHTML(key_results.innerHTML, key_canvas);
    });
  }

  componentDidMount = () => {
    setTimeout(this.renderCanvas, 1000);
  }

  savePDF = () => {
    const { plotData } = this.props;
    const canvas = ReactDOM.findDOMNode(this.refs.global_canvas);
		 try {
      canvas.getContext('2d');
		  const doc = new jsPDF({ compress: true });
      const globalImg = canvas.toDataURL('image/jpg', 1.0);
      const global_items = Object.keys(plotData.global_stats).length;
      let height = 0;
      height = global_items * 20;
		  doc.addImage(globalImg, 'jpg', 5, 5, 200, height);
      Object.entries(plotData.local_stats).forEach(([key, value]) => {
        const canvas = `${key}_canvas`;
        const page = `page-${key}`;
        const key_canvas = ReactDOM.findDOMNode(this.refs[canvas]);
        const canvasImg = key_canvas.toDataURL('image/jpg', 1.0);
        doc.addPage();
    		  doc.addImage(canvasImg, 'jpg', 5, 5, 200, height);
      });
		  doc.save(`${kebabcase(this.props.title)}.pdf`);
    } catch (err) {
      this.props.writeLog({ type: 'error', message: err });
      this.props.notifyError({
        message: err,
      });
	 }
  }

  render() {
    const { plotData, classes } = this.props;
    const global_items = Object.keys(plotData.global_stats).length;
    const local_items = Object.keys(plotData.local_stats).length;
    let height = 0;
    height = global_items * 180;
    const local_canvas = [];
    Object.entries(plotData.local_stats).forEach(([key, value]) => {
      local_canvas.push(<canvas className="canvas" ref={`${key}_canvas`} width="1600" height={height} />);
    });
    return (
      <div>
        <Button
          variant="contained"
          color="primary"
          onClick={this.savePDF}
          className={classes.pdfButton}
        >
          Download as pdf
        </Button>
        <div id="images" ref="results">
          {plotData && this.drawImageResults(plotData)}
        </div>
        <div className={classes.print}>
          <canvas ref="global_canvas" width="1600" height={height} />
          {local_canvas}
        </div>
      </div>
    );
  }
}

Images.propTypes = {
  plotData: PropTypes.object,
  notifyError: PropTypes.func.isRequired,
  writeLog: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
};

Images.defaultProps = {
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
})(Images);

export default withStyles(styles)(connectedComponent);
