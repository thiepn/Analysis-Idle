import { render } from "preact";
import { App } from "./app/App";
import { createAppStore } from "./app/store";
import { registerPersistenceCheckpoints } from "./platform/persistence";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Application root not found");
const store = createAppStore();
registerPersistenceCheckpoints(document, () => {
  void store.save();
});
render(<App store={store} />, root);
