import type { Component } from 'solid-js';
import { Route, Router } from '@solidjs/router';
import { RootLayout } from './RootLayout';
import { NoiseForm } from './NoiseForm';
import { History } from './History';
import { NotFound } from './NotFound';

const App: Component = () => {
  return (
    <Router root={RootLayout}>
      <Route path="/" component={NoiseForm} />
      <Route path="/history" component={History} />
      <Route path="*" component={NotFound} />
    </Router>
  );
};

export default App;
