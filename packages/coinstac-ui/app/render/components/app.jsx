import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Notify from './notification';

class App extends Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { children, loading: { isLoading, wip } } = this.props;

    return (
      <div className="app">
        <ul id="spinner" className={isLoading ? 'is-loading' : ''}>
          <li />
          <li />
          <li />
          <li />
        </ul>

        {children}

        <ul id="loading_list">
          {Object.keys(wip).map(loadingKey =>
            (<li key={loadingKey}>{loadingKey}</li>)
          )}
        </ul>

        <Notify />
      </div>
    );
  }
}

App.displayName = 'App';

App.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.object,
};

App.defaultProps = {
  children: null,
  loading: null,
};

function select(state) {
  return {
    loading: state.loading,
  };
}

export default connect(select)(App);