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

  it("does not contain the prompts reported after live play", () => {
    const deck = builtInCards.map((card) => card.text);
    const rejected = [
      "Покажи без слов, как ты ищешь место на переполненной парковке.",
      "Расскажи о поездке, которая пошла не по плану, но всё равно удалась.",
      "Какое время дня для служения тебе нравится больше всего?",
      "Как совместное служение помогло тебе лучше узнать друга?",
      "Какой совместный труд особенно сблизил тебя с кем-то?",
      "Какой пример напарника научил тебя говорить проще?",
      "Попроси всех за пять секунд найти в кадре предмет одного цвета.",
      "Начни медленную волну, которую повторит весь круг.",
      "Что делает перерыв после служения особенно приятным?",
      "Разыграйте втроём сцену, где все уступают друг другу место.",
    ];

    rejected.forEach((prompt) => expect(deck).not.toContain(prompt));
  });

  it("keeps group cards compatible with a two-person Zoom call", () => {
    const groupDeck = builtInCards
      .filter((card) => card.mode !== "answer")
      .map((card) => card.text.toLocaleLowerCase("ru-RU"))
      .join("\n");
    const roomOnlyFragments = [
      "человеку слева",
      "человеку справа",
      "втроём",
      "трем участникам",
      "трём участникам",
      "двух участников",
      "двум участникам",
      "уступают друг другу место",
      "медленную волну",
    ];

    roomOnlyFragments.forEach((fragment) => expect(groupDeck).not.toContain(fragment));
  });

  it("includes Ukraine as lived context without making every card about it", () => {
    const contextualCards = builtInCards.filter((card) => /украин|україн|киев|київ|львов|львів|одесс|одес|карпат/i.test(card.text));
    expect(contextualCards.length).toBeGreaterThanOrEqual(12);
    expect(contextualCards.length).toBeLessThanOrEqual(36);
  });
});
