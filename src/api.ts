import { Temporal } from "@js-temporal/polyfill";
import { insertNoise, selectNoises } from "./db";

export interface AddNoiseRequest {
    datetime: string;
    listener: string;
    source: string;
    noise: string;
    severity: string;
}

export async function addNoise(request: Request): Promise<Response> {
    const data: Partial<AddNoiseRequest> = await request.json();

    if (!data.datetime || !data.listener || !data.source || !data.noise || !data.severity) {
        return new Response("Bad request", {
            status: 401,
            statusText: "Bad request",
        });
    }

    const datetime = Temporal.PlainDateTime.from(data.datetime);

    await insertNoise({
        datetime: datetime.toString(),
        listener: data.listener,
        source: data.source,
        noise: data.noise,
        severity: data.severity,
    });

    return new Response(null, {
        status: 204,
        statusText: "No Content",
    });
}

export async function getNoise(request: Request): Promise<Response> {
    const url = new URL(request.url);

    const page = +url.searchParams.get("page");
    const count = +url.searchParams.get("count");

    const data = await selectNoises(page, count);

    return new Response(JSON.stringify(data), {
        status: 200,
        statusText: "Ok",
    });
}
