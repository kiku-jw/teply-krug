import { describe, expect, it } from "vitest";

import { builtInCards } from "../src/content/cards";
import {
  createPlayers,
  drawCard,
  estimatedMinutesForTurns,
  isDeepCard,
  targetTurnsForMode,
} from "../src/game";
import type { Card } from "../src/types";

function card(
  id: string,
  stage: Card["stage"],
  category: Card["category"],
  mode: Card["mode"],
  text: string,
): Card {
  return { id, stage, category, mode, text, timerSeconds: 75, source: "builtIn" };
}

describe("game model", () => {
  it("creates ordered players without game currency", () => {
    const players = createPlayers(["Аня", "Борис", "Вера"]);
    expect(players.map((player) => player.name)).toEqual(["Аня", "Борис", "Вера"]);
    expect(Object.keys(players[0] ?? {})).toEqual(["id", "name"]);
  });

  it("does not repeat a seen card while alternatives remain", () => {
    const first = drawCard(builtInCards, 1, [], () => 0);
    expect(first.card).not.toBeNull();
    const second = drawCard(builtInCards, 1, first.seenCardIds, () => 0);
    expect(second.card?.id).not.toBe(first.card?.id);
    expect(second.recycled).toBe(false);
  });

  it("recycles only an exhausted eligible category", () => {
    const personal = builtInCards.filter((candidate) =>
      candidate.stage === "spark" && candidate.category === "personal"
    );
    const result = drawCard(builtInCards, 1, personal.map((candidate) => candidate.id), () => 0, "personal");
    expect(result.recycled).toBe(true);
    expect(result.card?.category).toBe("personal");
    expect(result.seenCardIds).toHaveLength(1);
  });

  it("expands the available stages instead of replacing the whole deck", () => {
    const pool: Card[] = [
      card("spark", "spark", "personal", "answer", "Вспомни любимую игру из детства."),
      card("closer", "closer", "stories", "answer", "Расскажи о дружбе, которая тебя удивила."),
      card("together", "together", "creative", "perform", "Покажи знакомый библейский жест."),
    ];
    expect(drawCard(pool, 1, [], () => 0.99).card?.id).toBe("spark");
    expect(drawCard(pool, 2, [], () => 0.99).card?.id).toBe("closer");
    expect(drawCard(pool, 3, [], () => 0.99).card?.id).toBe("together");
  });

  it("keeps direct-answer cards available in later rounds", () => {
    const pool: Card[] = [
      card("previous", "together", "creative", "perform", "Покажи без слов короткое приветствие."),
      card("active", "together", "bible", "perform", "Изобрази знакомого библейского персонажа."),
      card("answer", "closer", "personal", "answer", "Вспомни момент, когда рядом стало особенно спокойно."),
    ];
    const result = drawCard(pool, 5, ["previous"], () => 0, undefined, [], "previous");
    expect(result.card?.id).toBe("answer");
  });

  it("avoids consecutive category, active format, deep card, and opening when possible", () => {
    const previous = card("previous", "closer", "bible", "answer", "Расскажи, как библейский пример тебе помог.");
    const pool: Card[] = [
      previous,
      card("same-category", "closer", "bible", "answer", "Вспомни другой близкий библейский пример."),
      card("same-depth", "closer", "service", "answer", "Когда молитва помогла в служении?"),
      card("same-opening", "spark", "stories", "answer", "Расскажи о забавном школьном случае."),
      card("smooth", "spark", "personal", "answer", "Какой запах сразу напоминает о доме?"),
    ];
    const result = drawCard(pool, 3, ["previous"], () => 0, undefined, [], "previous");
    expect(result.card?.id).toBe("smooth");
    expect(isDeepCard(previous)).toBe(true);
  });

  it("avoids consecutive perform cards when an answer is available", () => {
    const previous = card("previous", "spark", "creative", "perform", "Покажи без слов знакомую ситуацию.");
    const pool: Card[] = [
      previous,
      card("perform", "together", "bible", "perform", "Изобрази библейского персонажа."),
      card("answer", "closer", "stories", "answer", "Когда дружеская помощь особенно запомнилась?"),
    ];
    const result = drawCard(pool, 3, ["previous"], () => 0, undefined, [], "previous");
    expect(result.card?.id).toBe("answer");
  });

  it("prefers a visual card only when the hidden cadence requests one", () => {
    const textCard = card("text", "spark", "personal", "answer", "Какой запах сразу напоминает тебе о доме?");
    const visualCard: Card = {
      ...card("visual", "spark", "stories", "answer", "Выбери знакомый кадр и расскажи, что вспомнилось."),
      visual: {
        src: "./media/visual-cards/example.webp",
        alt: "Несколько знакомых мирных сцен для выбора.",
      },
    };
    const pool = [visualCard, textCard];

    expect(drawCard(pool, 1, [], () => 0, undefined, [], null, false).card?.id).toBe("text");
    expect(drawCard(pool, 1, [], () => 0, undefined, [], null, true).card?.id).toBe("visual");
  });

  it("does not place two visual cards next to each other", () => {
    const previous: Card = {
      ...card("previous", "spark", "personal", "answer", "Выбери предмет и расскажи связанную с ним историю."),
      visual: {
        src: "./media/visual-cards/previous.webp",
        alt: "Несколько предметов для выбора и разговора.",
      },
    };
    const nextVisual: Card = {
      ...card("next-visual", "spark", "stories", "answer", "Выбери кадр и расскажи, что он тебе напоминает."),
      visual: {
        src: "./media/visual-cards/next.webp",
        alt: "Несколько мирных сцен для выбора и разговора.",
      },
    };
    const textCard = card("text", "spark", "bible", "answer", "Какой библейский рассказ тебе особенно нравится?");

    const result = drawCard(
      [previous, nextVisual, textCard],
      1,
      ["previous"],
      () => 0,
      undefined,
      [],
      "previous",
      true,
    );
    expect(result.card?.id).toBe("text");
  });

  it("plans whole rounds around the requested duration", () => {
    expect(targetTurnsForMode("quick", 6, 75)).toBe(12);
    expect(targetTurnsForMode("standard", 6, 75)).toBe(18);
    expect(targetTurnsForMode("quick", 12, 75)).toBe(12);
    expect(targetTurnsForMode("open", 6, 75)).toBeNull();
    expect(estimatedMinutesForTurns(6, 75)).toBe(9);
  });
});
