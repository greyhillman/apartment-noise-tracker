import { Component, createContext, ParentProps } from "solid-js";
import { NoiseWorker } from "./worker";

export const WorkerContext = createContext<NoiseWorker>();

interface Props {
    value: NoiseWorker;
}

export const WorkerProvider: Component<ParentProps<Props>> = props => {
    return (
        <WorkerContext.Provider value={props.value}>
            {props.children}
        </WorkerContext.Provider>
    )
}
