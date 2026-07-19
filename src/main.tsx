import { render } from "preact";
import { App } from "./app/App";
import { createAppStore } from "./app/store";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Application root not found");
render(<App store={createAppStore()} />, root);
