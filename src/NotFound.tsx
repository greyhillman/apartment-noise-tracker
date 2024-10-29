import { Component } from "solid-js";

export const NotFound: Component<{}> = props => {
    return (
        <>
            <header>Page Not Found</header>
            <p>The page you were looking for does not exist.</p>
        </>
    )
}