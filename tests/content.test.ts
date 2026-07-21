import { describe, expect, it } from "vitest";

import { builtInCards } from "../src/content/cards";
import { CATEGORIES, STAGES } from "../src/game";

describe("built-in deck", () => {
  it("contains exactly 360 unique cards", () => {
    expect(builtInCards).toHaveLength(360);
    expect(new Set(builtInCards.map((card) => card.id)).size).toBe(360);
    expect(new Set(builtInCards.map((card) => card.text.toLocaleLowerCase("ru-RU"))).size).toBe(360);
  });

  it("is balanced by stage and category", () => {
    for (const stage of STAGES) {
      expect(builtInCards.filter((card) => card.stage === stage)).toHaveLength(120);
    }
    for (const category of CATEGORIES) {
      expect(builtInCards.filter((card) => card.category === category)).toHaveLength(72);
    }
    for (const stage of STAGES) {
      for (const category of CATEGORIES) {
        expect(builtInCards.filter((card) => card.stage === stage && card.category === category)).toHaveLength(24);
      }
    }
  });

  it("keeps every prompt readable and free of design-tell dashes", () => {
    for (const card of builtInCards) {
      expect(card.text.length).toBeGreaterThanOrEqual(24);
      expect(card.text.length).toBeLessThanOrEqual(220);
      expect(card.text).not.toMatch(/[—–]/u);
      expect(card.text).toMatch(/[.?!][»”"]?$/u);
      expect(card.source).toBe("builtIn");
    }
  });

  it("does not contain the reported abstract or confusing prompts", () => {
    const deck = builtInCards.map((card) => card.text).join("\n");
    expect(deck).not.toContain("Что ты умеешь ценить только после небольшой паузы?");
    expect(deck).not.toContain("Какой твой выбор обычно удивляет людей, которые плохо тебя знают?");
    expect(deck).not.toContain("Изобрази Илию, который слышит тихий спокойный голос.");
    expect(deck).not.toContain("Придумай группе добрый вызов до следующей встречи.");
    expect(deck).not.toContain("Назови одно качество каждого из двух участников, которое пригодилось бы в совместном служении.");
  });
});
