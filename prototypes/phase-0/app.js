const maximum = 4;
const lanes = [...document.querySelectorAll("[data-lane]")];

function values() {
  return lanes.map((lane) => Number(lane.querySelector("output").value));
}

function render(next) {
  lanes.forEach((lane, index) => { lane.querySelector("output").value = String(next[index]); });
  const total = next.reduce((sum, value) => sum + value, 0);
  document.querySelector("#assigned-total").textContent = String(total);
  lanes.forEach((lane, index) => {
    lane.querySelector('[data-change="-1"]').disabled = next[index] === 0;
    lane.querySelector('[data-change="1"]').disabled = total >= maximum;
  });
}

for (const lane of lanes) {
  lane.addEventListener("click", (event) => {
    const button = event.target.closest("[data-change]");
    if (!button) return;
    const next = values();
    const index = lanes.indexOf(lane);
    const change = Number(button.dataset.change);
    const total = next.reduce((sum, value) => sum + value, 0);
    if (change > 0 && total >= maximum) return;
    next[index] = Math.max(0, next[index] + change);
    render(next);
  });
}

const presets = { balanced: [2, 2], precision: [3, 1], intuition: [1, 3] };
document.querySelector(".presets").addEventListener("click", (event) => {
  const button = event.target.closest("[data-preset]");
  if (button) {
    render(presets[button.dataset.preset]);
    document.querySelectorAll("[data-preset]").forEach((preset) => {
      preset.setAttribute("aria-pressed", String(preset === button));
    });
  }
});

render(values());
