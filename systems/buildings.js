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

  return getBuildingCostAtOwned(state, buildingId, building.owned);
}

export function getBuildingCostForQuantity(state, buildingId, quantity) {
  const affordable = getAffordableBuildingPurchase(state, buildingId, quantity);
  return affordable.totalCost;
}

export function getAffordableBuildingPurchase(state, buildingId, requestedQuantity) {
  if (
    !state.buildings[buildingId] ||
    !BUILDING_DEFINITIONS[buildingId] ||
    !isBuildingUnlocked(state, buildingId)
  ) {
    return {
      quantity: 0,
      totalCost: 0,
    };
  }

  const maxQuantity = requestedQuantity === "max" ? Infinity : requestedQuantity;
  const owned = state.buildings[buildingId].owned;
  let quantity = 0;
  let totalCost = 0;

  while (quantity < maxQuantity && quantity < 10000) {
    const nextCost = getBuildingCostAtOwned(state, buildingId, owned + quantity);

    if (totalCost + nextCost > state.resources.understanding) {
      break;
    }

    totalCost += nextCost;
    quantity += 1;
  }

  return {
    quantity,
    totalCost,
  };
}

export function buyBuilding(state, buildingId, requestedQuantity = 1) {
  const purchase = getAffordableBuildingPurchase(state, buildingId, requestedQuantity);

  if (purchase.quantity <= 0) {
    return false;
  }

  state.resources.understanding -= purchase.totalCost;
  state.buildings[buildingId].owned += purchase.quantity;
  recalculateStats(state);
  return {
    success: true,
    quantity: purchase.quantity,
    totalCost: purchase.totalCost,
  };
}

function getBuildingCostAtOwned(state, buildingId, owned) {
  const buildingDefinition = BUILDING_DEFINITIONS[buildingId];

  return Math.floor(
    buildingDefinition.baseCost *
      buildingDefinition.costMultiplier ** owned *
      getBuildingCostMultiplier(state, buildingId),
  );
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
