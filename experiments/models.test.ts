import { describe, expect, it } from "vitest";
import { allocationOutput, bestAllocation, integerAllocations, simulateOffline } from "./models.js";

describe("Attention model", () => {
  it("enumerates zero allocation deterministically", () => {
    expect(integerAllocations(0, 3)).toEqual([[0, 0, 0]]);
  });

  it("supports full allocation and returns a stable policy", () => {
    expect(bestAllocation(4, 1, [2, 1, 1]).allocation).toEqual([4, 0, 0]);
    expect(bestAllocation(4, 0.8, [1, 1, 1])).toEqual(bestAllocation(4, 0.8, [1, 1, 1]));
  });

  it("rejects invalid and negative parameters", () => {
    expect(() => integerAllocations(-1, 3)).toThrow();
    expect(() => allocationOutput([1, -1], 0.8, [1, 1])).toThrow();
    expect(() => allocationOutput([1], 0.8, [1, 1])).toThrow();
  });

  it("always produces finite output", () => {
    for (const allocation of integerAllocations(8, 2)) {
      expect(Number.isFinite(allocationOutput(allocation, 0.7, [1.35, 0.85]))).toBe(true);
    }
  });

  it("canonicalizes report-only floating-point tails", () => {
    expect(allocationOutput([1, 2], 0.75, [1, 1])).toBe(2.681792830507);
    expect(allocationOutput([2, 1], 0.75, [1.35, 0.85])).toBe(3.120420321185);
  });
});

describe("Offline model", () => {
  it("stops consistently at an unresolved decision", () => {
    const events = [{ at: 2, type: "projectComplete" as const, configured: false }];
    expect(simulateOffline(8, events, false).simulatedHours).toBe(2);
    expect(simulateOffline(8, events, false)).toEqual(simulateOffline(8, events, false));
  });

  it("uses a configured safe policy", () => {
    expect(simulateOffline(8, [{ at: 2, type: "projectComplete", configured: false }], true).simulatedHours).toBe(8);
  });

  it("rejects negative time and impossible event state", () => {
    expect(() => simulateOffline(-1, [], false)).toThrow();
    expect(() => simulateOffline(1, [{ at: 2, type: "resourceCap", configured: false }], false)).toThrow();
  });
});
