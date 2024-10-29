import { Temporal } from "@js-temporal/polyfill";
import { Component, ParentProps } from "solid-js";

interface Props {
    value: Temporal.PlainDateTime | string;
}

export const LocalDateTime: Component<ParentProps<Props>> = props => {
    const datetime = Temporal.PlainDateTime.from(props.value);
    const value = datetime.toString({
        smallestUnit: "minutes",
    });

    return (
        <time datetime={value}>
            {props.children}
        </time>
    )
}
