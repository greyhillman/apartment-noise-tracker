/// <reference lib="WebWorker" />

import { Temporal } from "@js-temporal/polyfill";
import { insertNoise, Noise, openDatabase, selectNoises } from "./db";
import { createObjectCsvStringifier } from "csv-writer";
import { CsvStringifier } from "csv-writer/src/lib/csv-stringifiers/abstract";

export type { };
declare const self: DedicatedWorkerGlobalScope;

export interface NoiseWorker extends Omit<Worker, 'postMessage'> {
    postMessage(message: IncomingMessage): void;
}

interface NoiseMessage {
    type: "noise";
    datetime: string;
    listener: string;
    source: string;
    noise: string;
    severity: string;
}

interface GetNoiseMessage {
    type: "noise-get";
    page: number;
    count: number;
}

interface NoisePageMessage {
    type: "noise-page";
    page: number;
    total: number;
    values: Noise[];
}

interface GetDatalistMessage {
    type: "datalist-get";
    name: "noise" | "listener" | "source" | "severity";
}

interface DataListMessage {
    type: "datalist";
    name: "noise" | "listener" | "source" | "severity";
    values: string[];
}

interface HistoryFilter {
    from: string | null;
    to: string | null;

    noise: string;
    location: string;
    source: string;
    severity: string;
}

interface SearchHistoryMessage {
    type: "history-search";
    filter: HistoryFilter;
}

interface HistoryMessage {
    type: "history";
    chart: {
        [day: number]: {
            [hour: number]: number;
        };
    };
    logs: Noise[];
}

interface GetCsvHistoryMessage {
    type: "csv";
    filter: HistoryFilter;
}

interface CsvHistoryMessage {
    type: "csv";
    value: string;
}

interface ErrorMessage {
    type: "error";
    message: IncomingMessage;
    error: any;
}

export function isIncomingMessage(event: MessageEvent<any>): event is MessageEvent<IncomingMessage> {
    return typeof event.data === "object" && "type" in event.data;
}

export function isOutgoingMessage(event: MessageEvent<any>): event is MessageEvent<OutgoingMessage> {
    return typeof event.data === "object" && "type" in event.data;
}

export type IncomingMessage
    = NoiseMessage
    | GetNoiseMessage
    | GetDatalistMessage
    | SearchHistoryMessage
    | GetCsvHistoryMessage
    ;

export type OutgoingMessage
    = NoisePageMessage
    | NoiseMessage
    | HistoryMessage
    | DataListMessage
    | CsvHistoryMessage
    | ErrorMessage
    ;

function postMessage(message: OutgoingMessage) {
    self.postMessage(message);
}

self.addEventListener("message", message => {
    if (!isIncomingMessage(message)) {
        return;
    }

    const errorHandler = (err: any) => {
        postMessage({
            type: "error",
            message: message.data,
            error: err,
        });
    }

    try {
        handleMessage(message).catch(errorHandler)
    } catch (err) {
        errorHandler(err);
    }
});

async function handleMessage(message: MessageEvent<IncomingMessage>) {
    const data = message.data;

    if (data.type === "noise") {
        await addNoise(data)

        self.postMessage(data);
    } else if (data.type === "noise-get") {
        const noises = await getNoise(data)

        postMessage({
            type: "noise-page",
            page: noises.page,
            total: noises.total,
            values: noises.values,
        });
    } else if (data.type === "datalist-get") {
        const db = await openDatabase();

        const transaction = db.transaction("noises");

        let cursor = await transaction.store.openCursor(null, "next");
        let results = new Set<string>();
        while (cursor) {
            switch (data.name) {
                case "listener":
                    results.add(cursor.value.listener);
                    break;
                case "noise":
                    results.add(cursor.value.noise);
                    break;
                case "severity":
                    results.add(cursor.value.severity);
                    break;
                case "source":
                    results.add(cursor.value.source);
                    break;
            }

            cursor = await cursor.continue();
        }

        postMessage({
            type: "datalist",
            name: data.name,
            values: results.values().toArray(),
        })
    } else if (data.type === "history-search") {
        const db = await openDatabase();

        const transaction = db.transaction("noises");

        const filter = data.filter;

        let dateRange: IDBKeyRange | null = null;
        if (filter.from && filter.to) {
            dateRange = IDBKeyRange.bound(filter.from, filter.to);
        } else if (filter.from) {
            dateRange = IDBKeyRange.lowerBound(filter.from);
        } else if (filter.to) {
            dateRange = IDBKeyRange.upperBound(filter.to);
        }

        let logs: Noise[] = [];
        let chart: { [day: number]: { [hour: number]: number } } = {};
        let cursor = await transaction.store.openCursor(dateRange, "prev");
        while (cursor) {
            const noise = cursor.value;

            const matchesLocation = !filter.location || noise.listener.includes(filter.location);
            const matchesSource = !filter.source || noise.source.includes(filter.source);
            const matchesSeverity = !filter.severity || noise.severity.includes(filter.severity);
            const matchesNoise = !filter.noise || noise.noise.includes(filter.noise);

            if (matchesLocation && matchesSource && matchesSeverity && matchesNoise) {
                logs.push(noise);

                const date = Temporal.PlainDateTime.from(noise.datetime);
                if (!(date.dayOfWeek in chart)) {
                    chart[date.dayOfWeek] = {};
                }

                if (!(date.hour in chart[date.dayOfWeek])) {
                    chart[date.dayOfWeek][date.hour] = 0;
                }

                chart[date.dayOfWeek][date.hour] += 1;
            }

            cursor = await cursor.continue();
        }

        postMessage({
            type: "history",
            chart: chart,
            logs: logs,
        })
    } else if (data.type === "csv") {
        const logs = await search(data.filter);

        const csvWriter = createObjectCsvStringifier({
            header: [
                { id: "datetime", title: "Date/Time" },
                { id: "listener", title: "Where I was" },
                { id: "source", title: "Where noise came from" },
                { id: "noise", title: "Noise" },
                { id: "severity", title: "How loud it was" },
            ],
        });

        let content = "";
        content += csvWriter.getHeaderString();
        content += csvWriter.stringifyRecords(logs);

        postMessage({
            type: "csv",
            value: content,
        });
    }
}

async function search(filter: HistoryFilter) {
    const db = await openDatabase();

    const transaction = db.transaction("noises");

    let dateRange: IDBKeyRange | null = null;
    if (filter.from && filter.to) {
        dateRange = IDBKeyRange.bound(filter.from, filter.to);
    } else if (filter.from) {
        dateRange = IDBKeyRange.lowerBound(filter.from);
    } else if (filter.to) {
        dateRange = IDBKeyRange.upperBound(filter.to);
    }

    let logs: Noise[] = [];
    let cursor = await transaction.store.openCursor(dateRange, "prev");
    while (cursor) {
        const noise = cursor.value;

        const matchesLocation = !filter.location || noise.listener.includes(filter.location);
        const matchesSource = !filter.source || noise.source.includes(filter.source);
        const matchesSeverity = !filter.severity || noise.severity.includes(filter.severity);
        const matchesNoise = !filter.noise || noise.noise.includes(filter.noise);

        if (matchesLocation && matchesSource && matchesSeverity && matchesNoise) {
            logs.push(noise);
        }

        cursor = await cursor.continue();
    }

    return logs;
}

async function addNoise(message: NoiseMessage) {
    await insertNoise({
        datetime: message.datetime,
        listener: message.listener,
        source: message.source,
        noise: message.noise,
        severity: message.severity,
    });
}

async function getNoise(message: GetNoiseMessage) {
    return await selectNoises(message.page, message.count);
}