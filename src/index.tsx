/* @refresh reload */
import { render } from 'solid-js/web';

import App from './App';
import { WorkerProvider } from './WorkerProvider';

const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
    name: "worker",
});

const root = document.getElementById('root');
render(() => (
    <WorkerProvider value={worker}>
        <App />
    </WorkerProvider>
), root!);
