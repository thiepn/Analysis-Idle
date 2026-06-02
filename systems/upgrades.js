import { UPGRADE_DEFINITIONS } from "../data/upgrades.js";
import { recalculateStats } from "./economy.js";
import { isUpgradeUnlocked } from "./unlocks.js";

export function buyUpgrade(state, upgradeId) {
  const upgrade = state.upgrades[upgradeId];
  const upgradeDefinition = UPGRADE_DEFINITIONS[upgradeId];

  if (
    !upgrade ||
    !upgradeDefinition ||
    !isUpgradeUnlocked(state, upgradeId) ||
    upgrade.purchased ||
    state.resources.understanding < upgradeDefinition.cost
  ) {
    return false;
  }

  state.resources.understanding -= upgradeDefinition.cost;
  upgrade.purchased = true;
  recalculateStats(state);
  return true;
}
