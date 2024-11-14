import { Component, createEffect, createSignal, For, JSX, onCleanup, useContext } from "solid-js";
import { DateInput } from "./DateInput";
import { Temporal } from "@js-temporal/polyfill";
import { TimeInput } from "./TimeInput";
import { action, useAction, useSubmission } from "@solidjs/router";
import { template } from "solid-js/web";
import { createStore } from "solid-js/store";
import { AddNoiseRequest } from "./api";
import { WorkerContext } from "./WorkerProvider";
import { isOutgoingMessage, OutgoingMessage } from "./worker";

interface Data {
    date: Temporal.PlainDate;
    time: Temporal.PlainTime;

    listener: string;
    source: string;
    noise: string;
    severity: string;
}

export const NoiseForm: Component<{}> = props => {
    const now = Temporal.Now.plainDateTimeISO();

    const worker = useContext(WorkerContext);

    const [locations, setLocations] = createSignal<string[]>([]);
    const [sources, setSources] = createSignal<string[]>([]);
    const [noises, setNoises] = createSignal<string[]>([]);
    const [severities, setSeverities] = createSignal<string[]>([]);

    const [data, setData] = createStore<Data>({
        date: now.toPlainDate(),
        time: now.toPlainTime(),
        listener: "",
        source: "",
        noise: "",
        severity: "",
    });

    const [isSubmitting, setSubmitting] = createSignal<boolean>(false);

    const setTimeToNow = () => {
        const now = Temporal.Now.plainDateTimeISO();

        setData({
            date: now.toPlainDate(),
            time: now.toPlainTime(),
        });
    }

    const onMessage = (message: MessageEvent<OutgoingMessage>) => {
        if (!isOutgoingMessage(message)) {
            return;
        }

        if (message.data.type === "noise") {
            reset();
            setSubmitting(false);
        } else if (message.data.type === "datalist") {
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
        }
    };

    worker.addEventListener("message", onMessage);
    onCleanup(() => {
        worker.removeEventListener("message", onMessage);
    });

    createEffect(oldSubmitting => {
        // When we finish submitting the data, reload the datalists
        if (oldSubmitting && isSubmitting()) {
            return;
        }

        worker.postMessage({
            type: "datalist-get",
            name: "noise",
        });
        worker.postMessage({
            type: "datalist-get",
            name: "listener",
        });
        worker.postMessage({
            type: "datalist-get",
            name: "severity",
        });
        worker.postMessage({
            type: "datalist-get",
            name: "source",
        });

        return isSubmitting();
    });

    const submit = action(async () => {
        worker.postMessage({
            type: "noise",
            datetime: data.date.toPlainDateTime(data.time).toString(),
            listener: data.listener,
            source: data.source,
            noise: data.noise,
            severity: data.severity,
        });

        setSubmitting(true);
    });

    const reset = () => {
        const now = Temporal.Now.plainDateTimeISO();

        setData({
            date: now.toPlainDate(),
            time: now.toPlainTime(),
            listener: "",
            source: "",
            noise: "",
            severity: "",
        });
    }

    const onReset: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
        event.preventDefault();
        event.stopPropagation();

        reset();
    }

    return (
        <form class="noise" method="post" action={submit} onReset={onReset}>
            <fieldset disabled={isSubmitting()}>
                <legend>When did it happen?</legend>

                <label>
                    <span class="label">Date</span>
                    <DateInput name="time-date" onChange={value => setData("date", value)} value={data.date} />
                </label>

                <label>
                    <span class="label">Time</span>
                    <TimeInput name="time-time" onChange={value => setData("time", value)} value={data.time} />
                </label>

                <button type="button" onClick={setTimeToNow}>Set to now</button>
            </fieldset>

            <label>
                <span class="label">Where were you in your apartment?</span>
                <input
                    name="listener"
                    type="text"
                    required
                    disabled={isSubmitting()}
                    list="listener"
                    value={data.listener}
                    onChange={event => setData("listener", event.target.value)}
                />
                <datalist id="listener">
                    <For each={locations()}>
                        {location => <option value={location}>{location}</option>}
                    </For>
                </datalist>
            </label>

            <label>
                <span class="label">Where did the noise come from?</span>
                <input
                    name="source"
                    type="text"
                    required
                    list="source"
                    onChange={event => setData("source", event.target.value)}
                    value={data.source}
                    disabled={isSubmitting()}
                />
                <datalist id="source">
                    <For each={sources()}>
                        {source => <option value={source}>{source}</option>}
                    </For>
                </datalist>
            </label>

            <label>
                <span class="label">What was the noise?</span>
                <input
                    name="noise"
                    type="text"
                    required
                    list="noise"
                    onChange={event => setData("noise", event.target.value)}
                    value={data.noise}
                    disabled={isSubmitting()}
                />
                <datalist id="noise">
                    <For each={noises()}>
                        {noise => <option value={noise}>{noise}</option>}
                    </For>
                </datalist>
            </label>

            <label>
                <span class="label">How loud was the noise?</span>
                <input
                    type="text"
                    name="severity"
                    required
                    list="severity"
                    onChange={event => setData("severity", event.target.value)}
                    value={data.severity}
                    disabled={isSubmitting()}
                />

                <datalist id="severity">
                    <For each={severities()}>
                        {severity => <option value={severity}>{severity}</option>}
                    </For>
                </datalist>
            </label>

            <button type="submit" disabled={isSubmitting()}>
                Submit
            </button>
            <button type="reset" disabled={isSubmitting()} onClick={reset}>
                Reset
            </button>
        </form>
    );
}
