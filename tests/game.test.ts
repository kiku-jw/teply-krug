import { describe, expect, it } from "vitest";

import { builtInCards } from "../src/content/cards";
import { createPlayers, dealAbilities, drawCard, markAbilityUsed, stageForRound } from "../src/game";

describe("game model", () => {
  it("deals replace plus two distinct optional abilities", () => {
    const abilities = dealAbilities(() => 0.42);
    expect(abilities).toHaveLength(3);
    expect(abilities[0]).toBe("replace");
    expect(new Set(abilities).size).toBe(3);
  });

  it("creates ordered players with unused abilities", () => {
    const players = createPlayers(["Аня", "Борис", "Вера"], () => 0.2);
    expect(players.map((player) => player.name)).toEqual(["Аня", "Борис", "Вера"]);
    expect(players.every((player) => player.usedAbilities.length === 0)).toBe(true);
  });

  it("does not repeat a seen card while alternatives remain", () => {
    const first = drawCard(builtInCards, "spark", [], () => 0);
    expect(first.card).not.toBeNull();
    const second = drawCard(builtInCards, "spark", first.seenCardIds, () => 0);
    expect(second.card?.id).not.toBe(first.card?.id);
    expect(second.recycled).toBe(false);
  });

  it("recycles only an exhausted eligible category", () => {
    const personal = builtInCards.filter((card) => card.stage === "spark" && card.category === "personal");
    const result = drawCard(builtInCards, "spark", personal.map((card) => card.id), () => 0, "personal");
    expect(result.recycled).toBe(true);
    expect(result.card?.category).toBe("personal");
    expect(result.seenCardIds).toHaveLength(1);
  });

  it("advances internal pacing without a host-facing stage choice", () => {
    expect(stageForRound(1)).toBe("spark");
    expect(stageForRound(2)).toBe("closer");
    expect(stageForRound(3)).toBe("together");
    expect(stageForRound(8)).toBe("together");
  });

  it("spends an ability once", () => {
    const player = createPlayers(["Нина"], () => 0.3)[0];
    expect(player).toBeDefined();
    if (player === undefined) {
      return;
    }
    const spent = markAbilityUsed(player, "replace");
    const spentAgain = markAbilityUsed(spent, "replace");
    expect(spent.usedAbilities).toEqual(["replace"]);
    expect(spentAgain.usedAbilities).toEqual(["replace"]);
  });
});
