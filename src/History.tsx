import { Component, createEffect, createResource, createSignal, For, Match, onCleanup, sharedConfig, Suspense, Switch, useContext } from "solid-js";
import { WorkerContext } from "./WorkerProvider";
import { isOutgoingMessage } from "./worker";
import { HistoryTable } from "./HistoryTable";
import { SolidApexCharts } from "solid-apexcharts";
import { Temporal } from "@js-temporal/polyfill";
import { action } from "@solidjs/router";
import { DateInput } from "./DateInput";
import { Noise } from "./db";

export const History: Component<{}> = props => {
    const worker = useContext(WorkerContext);

    const [noise, setNoise] = createSignal("");
    const [location, setLocation] = createSignal("");
    const [source, setSource] = createSignal("");
    const [severity, setSeverity] = createSignal("");

    const [fromDate, setFromDate] = createSignal<Temporal.PlainDate | null>(null);
    const [toDate, setToDate] = createSignal<Temporal.PlainDate | null>(null);

    const [noises, setNoises] = createSignal<string[]>([]);
    const [locations, setLocations] = createSignal<string[]>([]);
    const [sources, setSources] = createSignal<string[]>([]);
    const [severities, setSeverities] = createSignal<string[]>([]);

    const [chart, setChart] = createSignal<{ [day: number]: { [hour: number]: number } }>({});
    const [logs, setLogs] = createSignal<Noise[]>([]);

    const [searching, setSearching] = createSignal(false);

    const [selectedPage, setSelectedPage] = createSignal(1);

    const onMessage = (message: MessageEvent<any>) => {
        if (!isOutgoingMessage(message)) {
            return;
        }

        if (message.data.type === "datalist") {
            switch (message.data.name) {
                case "listener":
                    setLocations(message.data.values);
                    break;
                case "noise":
                    setNoises(message.data.values);
                    break;
                case "severity":
                    setSeverities(message.data.values);
                    break;
                case "source":
                    setSources(message.data.values);
                    break;
            }
        } else if (message.data.type === "history") {
            setChart(message.data.chart);
            setLogs(message.data.logs);
            setSearching(false);
        }
    }

    worker.addEventListener("message", onMessage);
    onCleanup(() => {
        worker.removeEventListener("message", onMessage);
    });

    worker.postMessage({
        type: "datalist-get",
        name: "source",
    });
    worker.postMessage({
        type: "datalist-get",
        name: "severity",
    });
    worker.postMessage({
        type: "datalist-get",
        name: "noise",
    });
    worker.postMessage({
        type: "datalist-get",
        name: "listener",
    });

    const [options] = createSignal<ApexCharts.ApexOptions>({
        chart: {
            animations: {
                enabled: false,
            },
            zoom: {
                enabled: false,
            },
            brush: {
                enabled: false,
            },
            selection: {
                enabled: false,
            },
            toolbar: {
                show: false,
            },
        },
        xaxis: {
            type: "numeric",
            title: {
                text: "Day & time of the week"
            },
            // Doesn't automatically line up ticks with datapoints
            tickAmount: 'dataPoints',
            labels: {
                formatter(value, timestamp, opts) {
                    const time = new Temporal.PlainTime((+value - 1) % 24, 0, 0);

                    return time.toLocaleString("en-US", {
                        timeStyle: "short",
                    });
                },
            }
        },
    });

    const series: () => ApexAxisChartSeries = () => {
        const days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];

        const data = chart();

        return days.map((day, index) => {
            return {
                name: day,
                data: Array(24).keys()
                    .map(index => index + 1)
                    .map(hour => {
                        if (index in data && hour in data[index]) {
                            return data[index][hour];
                        }

                        return 0;
                    }).toArray(),
            };
        });
    };

    const search = () => {
        worker.postMessage({
            type: "history-search",
            from: fromDate()?.toString(),
            to: toDate()?.toString(),
            location: location(),
            noise: noise(),
            severity: severity(),
            source: source(),
        });

        setSearching(true);
        setSelectedPage(1);
    };

    createEffect(search);
    search();

    return (
        <article>
            <header>History</header>
            <form class="history" action={null} onSubmit={search}>
                <fieldset>
                    <legend>Date Range</legend>
                    <label>
                        <span class="label">Start</span>
                        <DateInput value={fromDate()} onChange={date => { setFromDate(date) }} />
                    </label>

                    <label>
                        <span class="label">End</span>
                        <DateInput value={toDate()} onChange={date => { setToDate(date) }} />
                    </label>
                </fieldset>

                <label>
                    <span class="label">Noise</span>
                    <input
                        type="text"
                        list="noise"
                        value={noise()}
                        onChange={event => setNoise(event.target.value)}
                    />
                    <datalist id="noise">
                        <For each={noises()}>
                            {noise => <option value={noise}>{noise}</option>}
                        </For>
                    </datalist>
                </label>

                <label>
                    <span class="label">Location</span>
                    <input
                        type="text"
                        list="location"
                        value={location()}
                        onChange={event => setLocation(event.target.value)}
                    />
                    <datalist id="location">
                        <For each={locations()}>
                            {location => <option value={location}>{location}</option>}
                        </For>
                    </datalist>
                </label>

                <label>
                    <span class="label">Source</span>
                    <input
                        type="text"
                        list="source"
                        value={source()}
                        onChange={event => setSource(event.target.value)}
                    />
                    <datalist id="source">
                        <For each={sources()}>
                            {source => <option value={source}>{source}</option>}
                        </For>
                    </datalist>
                </label>

                <label>
                    <span class="label">Severity</span>
                    <input
                        type="text"
                        list="severity"
                        value={severity()}
                        onChange={event => setSeverity(event.target.value)}
                    />
                    <datalist id="severity">
                        <For each={severities()}>
                            {severity => <option value={severity}>{severity}</option>}
                        </For>
                    </datalist>
                </label>

                <button type="submit">Search</button>
            </form>
            <section>
                <header>Chart</header>
                <figure>
                    <SolidApexCharts height="500px" width="100%" type="line" options={options()} series={series()} />
                    <figcaption>Day of the week</figcaption>
                </figure>
                <figure>

                </figure>
            </section>
            <section>
                <header>Logs</header>
                <HistoryTable value={logs()} loading={searching()} selectedPage={selectedPage()} setSelectedPage={setSelectedPage} />
            </section>
        </article>
    );
}