import type { AbilityId, Card, Category, DrawResult, Player, Stage } from "./types";

export const STAGES: Stage[] = ["spark", "closer", "together"];
export const CATEGORIES: Category[] = ["personal", "stories", "service", "bible", "creative"];
export const ABILITIES: AbilityId[] = ["replace", "partner", "twoChoices", "groupHelp", "chooseCategory"];

export const stageNames: Record<Stage, string> = {
  spark: "Искра",
  closer: "Ближе",
  together: "Вместе",
};

export const stageDescriptions: Record<Stage, string> = {
  spark: "Начинаем легко и с улыбкой",
  closer: "Узнаём истории и то, что для нас важно",
  together: "Импровизируем и заканчиваем одним кругом",
};

export const categoryNames: Record<Category, string> = {
  personal: "О тебе",
  stories: "Истории",
  service: "Служение",
  bible: "Библия",
  creative: "Импровизация",
};

export const abilityNames: Record<AbilityId, string> = {
  replace: "Перезагрузка",
  partner: "Напарник",
  twoChoices: "Два пути",
  groupHelp: "Совет круга",
  chooseCategory: "Выбор темы",
};

export const abilityDescriptions: Record<AbilityId, string> = {
  replace: "Замени текущую карточку без объяснений.",
  partner: "Пригласи одного человека отвечать вместе.",
  twoChoices: "Открой ещё одну карточку и выбери одну из двух.",
  groupHelp: "Попроси весь круг подкинуть идеи.",
  chooseCategory: "Выбери тему новой карточки на этом этапе.",
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

export function dealAbilities(random: () => number = Math.random): AbilityId[] {
  const optional = ABILITIES.filter((ability) => ability !== "replace");
  return ["replace", ...shuffle(optional, random).slice(0, 2)];
}

export function createPlayers(names: string[], random: () => number = Math.random): Player[] {
  return names.map((name, index) => ({
    id: `player-${index + 1}-${name.trim().toLocaleLowerCase("ru-RU").replace(/[^а-яёa-z0-9]+/giu, "-")}`,
    name: name.trim(),
    abilities: dealAbilities(random),
    usedAbilities: [],
  }));
}

export function drawCard(
  cards: Card[],
  stage: Stage,
  seenCardIds: string[],
  random: () => number = Math.random,
  category?: Category,
  excludedCardIds: string[] = [],
): DrawResult {
  const eligible = cards.filter((card) =>
    card.stage === stage
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

  const selected = available[Math.floor(random() * available.length)] ?? null;
  if (selected === null) {
    return { card: null, recycled, seenCardIds: nextSeen };
  }
  return {
    card: selected,
    recycled,
    seenCardIds: [...nextSeen, selected.id],
  };
}

export function nextStage(stage: Stage): Stage | null {
  const index = STAGES.indexOf(stage);
  return STAGES[index + 1] ?? null;
}

export function markAbilityUsed(player: Player, ability: AbilityId): Player {
  if (!player.abilities.includes(ability) || player.usedAbilities.includes(ability)) {
    return player;
  }
  return { ...player, usedAbilities: [...player.usedAbilities, ability] };
}
