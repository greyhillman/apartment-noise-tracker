import { action, useSubmission } from "@solidjs/router";
import { Component, createEffect, createResource, createSignal, For, Match, onCleanup, Suspense, Switch, useContext } from "solid-js";
import { Noise } from "./db";
import { WorkerContext } from "./WorkerProvider";
import { LocalDateTime } from "./LocalDateTime";
import { Temporal } from "@js-temporal/polyfill";
import { PageSelector } from "./PageSelector";

interface Props {
    value: Noise[];
    loading: boolean;

    selectedPage: number;
    setSelectedPage: (page: number) => any | Promise<any>;
}

export const HistoryTable: Component<Props> = props => {
    const [count, setCount] = createSignal(10);

    const totalPages = () => {
        return Math.max(1, Math.ceil((props.value?.length ?? 0) / count()));
    }

    const noises = () => {
        const onPage = (index: number) => {
            return index >= (props.selectedPage - 1) * count() && index < props.selectedPage * count();
        }
        return props.value
            .filter((_, index) => onPage(index));
    }

    const onChangeCount = (count: number) => {
        setCount(count);
        props.setSelectedPage(1);
    }

    return (
        <figure>
            <label>
                <span class="label">Count per page</span>
                <select value={count()} onChange={event => onChangeCount(+event.target.value)}>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                </select>
            </label>
            <table>
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Noise</th>
                        <th>Location</th>
                        <th>Source</th>
                        <th>Severity</th>
                    </tr>
                </thead>
                <tbody>
                    <Switch>
                        <Match when={props.loading}>
                            <tr>
                                <td colSpan={5}>Loading data...</td>
                            </tr>
                        </Match>
                        <Match when={() => !props.loading}>
                            <For each={noises()}>
                                {noise => <tr>
                                    <td>
                                        <LocalDateTime value={noise.datetime}>
                                            {Temporal.PlainDateTime.from(noise.datetime).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                                        </LocalDateTime>
                                    </td>
                                    <td>{noise.noise}</td>
                                    <td>{noise.listener}</td>
                                    <td>{noise.source}</td>
                                    <td>{noise.severity}</td>
                                </tr>}
                            </For>
                        </Match>
                    </Switch>
                </tbody>
            </table>
            <PageSelector borderPages={1} pages={totalPages()} selected={props.selectedPage} onChange={page => props.setSelectedPage(page)} />
            <figcaption>
                Log of all recorded noises.
            </figcaption>
        </figure>
    );
}