import { ABILITIES, CATEGORIES, STAGES } from "./game";
import type { AbilityId, Card, CardMode, Category, Player, Preferences, SessionState, Stage, StoredData } from "./types";

const STORAGE_KEY = "teply-krug:v1";
const CURRENT_VERSION = 1;

const defaultPreferences: Preferences = {
  timerSeconds: 75,
  soundEnabled: true,
  motionEnabled: true,
  savedNames: [],
  seenCardIds: [],
  disabledBuiltInCardIds: [],
};

export function createDefaultStoredData(): StoredData {
  return {
    version: CURRENT_VERSION,
    preferences: { ...defaultPreferences },
    session: null,
    customCards: [],
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStage(value: unknown): value is Stage {
  return typeof value === "string" && STAGES.some((stage) => stage === value);
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && CATEGORIES.some((category) => category === value);
}

function isCardMode(value: unknown): value is CardMode {
  return value === "answer" || value === "perform" || value === "group";
}

function isAbility(value: unknown): value is AbilityId {
  return typeof value === "string" && ABILITIES.some((ability) => ability === value);
}

function isAbilityArray(value: unknown): value is AbilityId[] {
  return Array.isArray(value) && value.every(isAbility);
}

function isCard(value: unknown): value is Card {
  return isObject(value)
    && typeof value.id === "string"
    && isStage(value.stage)
    && isCategory(value.category)
    && isCardMode(value.mode)
    && typeof value.text === "string"
    && typeof value.timerSeconds === "number"
    && (value.source === "builtIn" || value.source === "custom");
}

function isPlayer(value: unknown): value is Player {
  return isObject(value)
    && typeof value.id === "string"
    && typeof value.name === "string"
    && isAbilityArray(value.abilities)
    && isAbilityArray(value.usedAbilities);
}

function isSession(value: unknown): value is SessionState {
  return isObject(value)
    && Array.isArray(value.players)
    && value.players.every(isPlayer)
    && typeof value.currentPlayerIndex === "number"
    && isStage(value.stage)
    && typeof value.round === "number"
    && (typeof value.currentCardId === "string" || value.currentCardId === null)
    && isStringArray(value.alternativeCardIds)
    && (typeof value.partnerPlayerId === "string" || value.partnerPlayerId === null)
    && typeof value.groupHelpActive === "boolean";
}

function isPreferences(value: unknown): value is Preferences {
  return isObject(value)
    && typeof value.timerSeconds === "number"
    && [0, 45, 75, 120].includes(value.timerSeconds)
    && typeof value.soundEnabled === "boolean"
    && typeof value.motionEnabled === "boolean"
    && isStringArray(value.savedNames)
    && isStringArray(value.seenCardIds)
    && isStringArray(value.disabledBuiltInCardIds);
}

function isStoredData(value: unknown): value is StoredData {
  return isObject(value)
    && value.version === CURRENT_VERSION
    && isPreferences(value.preferences)
    && (value.session === null || isSession(value.session))
    && Array.isArray(value.customCards)
    && value.customCards.every(isCard);
}

export function loadStoredData(storage: Storage = window.localStorage): StoredData {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) {
    return createDefaultStoredData();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStoredData(parsed) ? parsed : createDefaultStoredData();
  } catch {
    return createDefaultStoredData();
  }
}

export function saveStoredData(data: StoredData, storage: Storage = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearStoredData(storage: Storage = window.localStorage): StoredData {
  storage.removeItem(STORAGE_KEY);
  return createDefaultStoredData();
}
