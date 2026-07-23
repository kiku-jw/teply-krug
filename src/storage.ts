import { CATEGORIES, SESSION_MODES, STAGES } from "./game";
import type { Card, CardMode, Category, Player, Preferences, SessionMode, SessionState, Stage, StoredData } from "./types";

const STORAGE_KEY = "teply-krug:v1";

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
    version: 2,
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

function isSessionMode(value: unknown): value is SessionMode {
  return typeof value === "string" && SESSION_MODES.some((mode) => mode === value);
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
    && typeof value.name === "string";
}

function isSession(value: unknown): value is SessionState {
  return isObject(value)
    && Array.isArray(value.players)
    && value.players.every(isPlayer)
    && typeof value.currentPlayerIndex === "number"
    && typeof value.round === "number"
    && (typeof value.currentCardId === "string" || value.currentCardId === null)
    && (typeof value.partnerPlayerId === "string" || value.partnerPlayerId === null)
    && isSessionMode(value.mode)
    && typeof value.turnsCompleted === "number"
    && (typeof value.targetTurns === "number" || value.targetTurns === null)
    && isStringArray(value.recentCardIds);
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
    && value.version === 2
    && isPreferences(value.preferences)
    && (value.session === null || isSession(value.session))
    && Array.isArray(value.customCards)
    && value.customCards.every(isCard);
}

function migratePlayer(value: unknown): Player | null {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }
  return { id: value.id, name: value.name };
}

function migrateSession(value: unknown): SessionState | null {
  if (!isObject(value) || !Array.isArray(value.players)) {
    return null;
  }
  const players: Player[] = [];
  for (const candidate of value.players) {
    const player = migratePlayer(candidate);
    if (player === null) {
      return null;
    }
    players.push(player);
  }
  if (players.length < 2) {
    return null;
  }
  const currentPlayerIndex = typeof value.currentPlayerIndex === "number"
    ? Math.max(0, Math.min(players.length - 1, Math.floor(value.currentPlayerIndex)))
    : 0;
  const round = typeof value.round === "number" ? Math.max(1, Math.floor(value.round)) : 1;
  const currentCardId = typeof value.currentCardId === "string" ? value.currentCardId : null;
  const partnerPlayerId = typeof value.partnerPlayerId === "string" ? value.partnerPlayerId : null;
  return {
    players,
    currentPlayerIndex,
    round,
    currentCardId,
    partnerPlayerId,
    mode: "open",
    turnsCompleted: ((round - 1) * players.length) + currentPlayerIndex,
    targetTurns: null,
    recentCardIds: currentCardId === null ? [] : [currentCardId],
  };
}

function migrateVersionOne(value: unknown): StoredData | null {
  if (!isObject(value)
    || value.version !== 1
    || !isPreferences(value.preferences)
    || !Array.isArray(value.customCards)
    || !value.customCards.every(isCard)) {
    return null;
  }
  const session = value.session === null ? null : migrateSession(value.session);
  return {
    version: 2,
    preferences: value.preferences,
    session,
    customCards: value.customCards,
  };
}

export function loadStoredData(storage: Storage = window.localStorage): StoredData {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) {
    return createDefaultStoredData();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isStoredData(parsed)) {
      return parsed;
    }
    const migrated = migrateVersionOne(parsed);
    if (migrated !== null) {
      storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return createDefaultStoredData();
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
