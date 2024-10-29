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


self.addEventListener("message", message => {
    console.log(`Main: message received: ${message}`);
});

self.addEventListener("messageerror", error => {
    console.log(`Main: message error: ${error}`);
});

navigator.serviceWorker.addEventListener("message", message => {
    console.log(`Main: service worker message received: start`);
    console.log(message);
    console.log(`Main: service worker message received: end`);
});
