import { Temporal } from "@js-temporal/polyfill";
import { Component } from "solid-js";

interface Props {
    name?: string;

    value: Temporal.PlainTime;
    onChange: (value: Temporal.PlainTime) => void | Promise<void>;
}

export const TimeInput: Component<Props> = props => {
    const value = () => {
        return props.value.toString({
            smallestUnit: "minutes",
        });
    }

    const onChange = async (value: string) => {
        const time = Temporal.PlainTime.from(value);

        await props.onChange(time);
    }

    return (
        <input
            name={props.name}
            type="time"
            value={value()}
            onChange={async event => await onChange(event.target.value)}
        />
    )
}