import { render } from "preact";
import { App } from "./app/App";
import { createAppStore } from "./app/store";
import {
  registerPersistenceCheckpoints,
  SAVE_PASSIVE_CHECKPOINT_MS,
} from "./platform/persistence";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Application root not found");
const store = createAppStore();
void store.initialize();
registerPersistenceCheckpoints(document, () => {
  void store.save();
});
window.setInterval(() => void store.save(), SAVE_PASSIVE_CHECKPOINT_MS);
render(<App store={store} />, root);
