import type { Card, Category, DrawResult, Player, SessionMode, Stage } from "./types";

export const STAGES: Stage[] = ["spark", "closer", "together"];
export const CATEGORIES: Category[] = ["personal", "stories", "service", "bible", "creative"];
export const SESSION_MODES: SessionMode[] = ["quick", "standard", "open"];

export const stageNames: Record<Stage, string> = {
  spark: "В начале",
  closer: "После первого круга",
  together: "После второго круга",
};

export const categoryNames: Record<Category, string> = {
  personal: "О себе",
  stories: "Случай из жизни",
  service: "Служение",
  bible: "Библия",
  creative: "Показать или придумать",
};

export const sessionModeNames: Record<SessionMode, string> = {
  quick: "Быстро",
  standard: "Обычный вечер",
  open: "Без плана",
};

export const sessionModeDescriptions: Record<SessionMode, string> = {
  quick: "Около 15 минут",
  standard: "Около 30 минут",
  open: "Закончите, когда захочется",
};

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    const value = result[index];
    const swap = result[target];
    if (value !== undefined && swap !== undefined) {
      result[index] = swap;
      result[target] = value;
    }
  }
  return result;
}

export function createPlayers(names: string[]): Player[] {
  return names.map((name, index) => ({
    id: `player-${index + 1}-${name.trim().toLocaleLowerCase("ru-RU").replace(/[^а-яёa-z0-9]+/giu, "-")}`,
    name: name.trim(),
  }));
}

function allowedStages(round: number): Stage[] {
  if (round <= 1) {
    return ["spark"];
  }
  if (round === 2) {
    return ["spark", "closer"];
  }
  return STAGES;
}

export function isDeepCard(card: Card): boolean {
  return card.stage !== "spark"
    && card.mode === "answer"
    && (card.category === "service" || card.category === "bible");
}

function openingKey(text: string): string {
  return text.trim().split(/\s+/u)[0]?.toLocaleLowerCase("ru-RU").replace(/[«»"!?.,:]/gu, "") ?? "";
}

function followsSmoothly(card: Card, previous: Card | null, category?: Category): boolean {
  if (previous === null) {
    return true;
  }
  const repeatsCategory = category === undefined && card.category === previous.category;
  const repeatsDeepCard = isDeepCard(card) && isDeepCard(previous);
  const repeatsActiveMode = card.mode !== "answer" && card.mode === previous.mode;
  const repeatsOpening = openingKey(card.text) === openingKey(previous.text);
  const repeatsVisual = card.visual !== undefined && previous.visual !== undefined;
  return !repeatsCategory
    && !repeatsDeepCard
    && !repeatsActiveMode
    && !repeatsOpening
    && !repeatsVisual;
}

export function drawCard(
  cards: Card[],
  round: number,
  seenCardIds: string[],
  random: () => number = Math.random,
  category?: Category,
  excludedCardIds: string[] = [],
  previousCardId: string | null = null,
  preferVisual = false,
): DrawResult {
  const stages = allowedStages(round);
  const eligible = cards.filter((card) =>
    stages.some((stage) => stage === card.stage)
    && (category === undefined || card.category === category)
    && !excludedCardIds.includes(card.id),
  );
  let available = eligible.filter((card) => !seenCardIds.includes(card.id));
  let recycled = false;
  let nextSeen = [...seenCardIds];

  if (available.length === 0 && eligible.length > 0) {
    const eligibleIds = eligible.map((card) => card.id);
    nextSeen = nextSeen.filter((id) => !eligibleIds.includes(id));
    available = eligible;
    recycled = true;
  }

  const previous = cards.find((card) => card.id === previousCardId) ?? null;
  const smoothlyPaced = available.filter((card) => followsSmoothly(card, previous, category));
  const pacedPool = smoothlyPaced.length > 0 ? smoothlyPaced : available;
  const preferredPool = pacedPool.filter((card) =>
    preferVisual ? card.visual !== undefined : card.visual === undefined
  );
  const selectionPool = preferredPool.length > 0 ? preferredPool : pacedPool;
  const selected = selectionPool[Math.floor(random() * selectionPool.length)] ?? null;
  if (selected === null) {
    return { card: null, recycled, seenCardIds: nextSeen };
  }
  return {
    card: selected,
    recycled,
    seenCardIds: [...nextSeen, selected.id],
  };
}

function targetSeconds(mode: SessionMode): number | null {
  if (mode === "quick") {
    return 15 * 60;
  }
  if (mode === "standard") {
    return 30 * 60;
  }
  return null;
}

export function targetTurnsForMode(
  mode: SessionMode,
  playerCount: number,
  timerSeconds: number,
): number | null {
  const seconds = targetSeconds(mode);
  if (seconds === null || playerCount < 1) {
    return null;
  }
  const answerSeconds = timerSeconds === 0 ? 75 : Math.max(timerSeconds, 45);
  const estimatedTurnSeconds = answerSeconds + 15;
  const estimatedRounds = Math.max(1, Math.round(seconds / (playerCount * estimatedTurnSeconds)));
  return estimatedRounds * playerCount;
}

export function estimatedMinutesForTurns(turns: number, timerSeconds: number): number {
  const answerSeconds = timerSeconds === 0 ? 75 : Math.max(timerSeconds, 45);
  return Math.max(1, Math.round((turns * (answerSeconds + 15)) / 60));
}
