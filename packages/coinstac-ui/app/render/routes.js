/**
 * Use React Router to implement application routing.
 *
 * @{@link  http://rackt.github.io/react-router/}
 * @{@link  https://github.com/rackt/react-router}
 */
import App from './components/app';
import Dashboard from './components/dashboard';
import DashboardHome from './components/dashboard-home';
import DashboardConsortia from './components/dashboard-consortia';
import Login from './components/form-login-controller';
import Signup from './components/form-signup-controller';
import ConsortiumSingleController from './components/consortium-single-controller';
import DashboardProjects from './components/projects/dashboard-projects';
import ProjectsList from './components/projects/projects-list';
import PageProjectController from './components/projects/page-project-controller';
import FormAddConsortiumController from './components/form-add-consortium-controller';
import FormAddProjectController from './components/projects/form-add-project-controller';
import FormEditProjectController from './components/projects/form-edit-project-controller';
import { Route, IndexRoute } from 'react-router';
import React from 'react';

export default (
  <Route component={App}>
    <Route path="login" component={Login} />
    <Route path="signup" component={Signup} />
    <Route path="/" component={Dashboard} >
      <IndexRoute component={DashboardHome} />
      <Route path="/consortia" component={DashboardConsortia} />
      <Route path="/consortia/new" component={FormAddConsortiumController} />
      <Route path="/consortia/:_id" component={ConsortiumSingleController} />
      <Route path="/projects" component={DashboardProjects}>
        <IndexRoute component={ProjectsList} />
        <Route
          path="edit/:projectId"
          component={FormEditProjectController}
        />
        <Route
          path="new"
          component={FormAddProjectController}
        />
        <Route
          path=":projectId"
          component={PageProjectController}
        />
      </Route>
    </Route>
  </Route>
);