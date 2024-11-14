import { A } from "@solidjs/router";
import { Component, ErrorBoundary, ParentProps } from "solid-js";

export const RootLayout: Component<ParentProps> = props => {
    const onError = (err: any, reset: () => void) => {
        return (
            <p>Error occurred: <button onClick={reset}>Reset</button></p>
        );
    }
    return (
        <ErrorBoundary fallback={onError}>
            <header>
                <nav>
                    <ol>
                        <li>
                            <A href="/">
                                Home
                            </A>
                        </li>
                        <li>
                            <A href="/history">
                                History
                            </A>
                        </li>
                    </ol>
                </nav>
            </header>
            <main>
                {props.children}
            </main>
            <footer>Apartment Noise Tracker &copy; 2024</footer>
        </ErrorBoundary>
    )
}