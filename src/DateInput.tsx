import { Component, JSX } from "solid-js";
import { Temporal } from "@js-temporal/polyfill";

interface Props {
    name?: string;

    value: Temporal.PlainDate;
    onChange: (value: Temporal.PlainDate) => void | Promise<void>;
}

export const DateInput: Component<Props> = props => {
    const onChange = async (value: string) => {
        const date = Temporal.PlainDate.from(value);

        await props.onChange(date);
    }

    const value = () => {
        return props.value?.toString();
    };

    return (
        <input
            type="date"
            name={props.name || ""}
            onChange={async event => onChange(event.target.value)}
            value={value()}
        />
    )
}