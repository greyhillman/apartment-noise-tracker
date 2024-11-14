import type { Component } from 'solid-js';
import { Route, Router } from '@solidjs/router';
import { RootLayout } from './RootLayout';
import { NoiseForm } from './NoiseForm';
import { History } from './History';
import { NotFound } from './NotFound';

const App: Component = () => {
  return (
    // When deployed to GitHub pages, the site will be under "greyhillman.github.io/apartment-noise-tracker".
    // This screws up SolidJS router as it expects to operate at "/" and not "/apartment-noise-tracker".
    <Router root={RootLayout} base={import.meta.env.BASE_URL}>
      <Route path="/" component={NoiseForm} />
      <Route path="/history" component={History} />
      <Route path="*" component={NotFound} />
    </Router>
  );
};

export default App;
