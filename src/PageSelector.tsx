import { Component, For, Show } from "solid-js"

interface Props {
    pages: number;
    borderPages: number;
    selected: number;

    onChange: (selected: number) => any | Promise<any>;
}

export const PageSelector: Component<Props> = props => {
    const onSelect = (page: number) => {
        return async () => {
            await props.onChange(page);
        }
    }

    const onPrev = async () => {
        await props.onChange(props.selected - 1);
    }

    const onNext = async () => {
        await props.onChange(props.selected + 1);
    }

    const onFirst = async () => {
        await props.onChange(1);
    }

    const onLast = async () => {
        await props.onChange(props.pages);
    }

    const pages = () => {
        const pages = new Set<number>();

        for (let page = props.selected - props.borderPages; page <= props.selected + props.borderPages; page++) {
            pages.add(page);
        }

        const result = pages.values()
            .filter(page => page >= 2 && page <= props.pages - 1)
            .toArray();
        // https://stackoverflow.com/a/1063027/2967392
        result.sort((a, b) => a - b);

        return result;
    }

    return (
        <ol class="page">
            <li>
                <button onClick={onPrev} disabled={props.selected === 1}>Prev</button>
            </li>
            <li>
                <button onClick={onFirst} disabled={props.selected === 1}>
                    {1}
                </button>
            </li>
            <Show when={props.selected > 1 + props.borderPages + 1}>
                <li>...</li>
            </Show>
            <For each={pages()}>
                {page => <li>
                    <button onClick={onSelect(page)} disabled={page === props.selected}>
                        {page}
                    </button>
                </li>}
            </For>
            <Show when={props.selected < props.pages - props.borderPages - 1}>
                <li>...</li>
            </Show>
            <Show when={props.pages > 1}>
                <li>
                    <button onClick={onLast} disabled={props.selected === props.pages}>
                        {props.pages}
                    </button>
                </li>
            </Show>
            <li>
                <button onClick={onNext} disabled={props.selected === props.pages}>Next</button>
            </li>
        </ol>
    )
}
