import { Temporal } from "@js-temporal/polyfill";
import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface NoiseSchema extends DBSchema {
    noises: {
        key: string;
        value: Noise;
    }
}

export interface Noise {
    datetime: string;
    listener: string;
    source: string;
    noise: string;
    severity: string;
}

export async function openDatabase(): Promise<IDBPDatabase<NoiseSchema>> {
    return await openDB<NoiseSchema>("noises", 1, {
        upgrade(db) {
            db.createObjectStore("noises", {
                keyPath: "datetime",
            });
        }
    });
}

export async function insertNoise(noise: Noise): Promise<void> {
    const db = await openDatabase();

    await db.add("noises", noise);
}

interface PagedResult<T> {
    total: number;
    page: number;
    values: T[];
}

export async function selectNoises(page: number, number: number): Promise<PagedResult<Noise>> {
    const db = await openDatabase();

    const transaction = await db.transaction("noises");
    let cursor = await transaction.store.openCursor(null, "prev");

    const current = (page - 1) * number;
    if (current > 0) {
        await cursor.advance(current);
    }

    const result: Noise[] = [];
    while (cursor && current <= page * number && result.length <= number) {
        result.push(cursor.value);
        cursor = await cursor.continue();
    }

    const total = await transaction.store.count();

    return {
        total: total,
        page: page,
        values: result,
    }
}
