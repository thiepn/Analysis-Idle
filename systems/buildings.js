import { BUILDING_DEFINITIONS } from "../data/buildings.js";
import { UPGRADE_DEFINITIONS } from "../data/upgrades.js";
import { recalculateStats } from "./economy.js";
import { isBuildingUnlocked } from "./unlocks.js";

export function getBuildingCost(state, buildingId) {
  const building = state.buildings[buildingId];
  const buildingDefinition = BUILDING_DEFINITIONS[buildingId];

  if (!building || !buildingDefinition) {
    return Infinity;
  }

  return Math.floor(
    buildingDefinition.baseCost *
      buildingDefinition.costMultiplier ** building.owned *
      getBuildingCostMultiplier(state, buildingId),
  );
}

export function buyBuilding(state, buildingId) {
  const cost = getBuildingCost(state, buildingId);

  if (
    !state.buildings[buildingId] ||
    !isBuildingUnlocked(state, buildingId) ||
    state.resources.understanding < cost
  ) {
    return false;
  }

  state.resources.understanding -= cost;
  state.buildings[buildingId].owned += 1;
  recalculateStats(state);
  return true;
}

function getBuildingCostMultiplier(state, buildingId) {
  return Object.entries(UPGRADE_DEFINITIONS).reduce((multiplier, [upgradeId, upgradeDefinition]) => {
    if (!state.upgrades[upgradeId]?.purchased) {
      return multiplier;
    }

    return upgradeDefinition.effects.reduce((effectMultiplier, effect) => {
      if (effect.type === "buildingCostMultiplier" && effect.target === buildingId) {
        return effectMultiplier * effect.value;
      }

      return effectMultiplier;
    }, multiplier);
  }, 1);
}
