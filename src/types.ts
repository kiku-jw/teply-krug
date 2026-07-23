export type Stage = "spark" | "closer" | "together";
export type Category = "personal" | "stories" | "service" | "bible" | "creative";
export type CardMode = "answer" | "perform" | "group";
export type SessionMode = "quick" | "standard" | "open";
export type Screen = "welcome" | "setup" | "game" | "checkpoint" | "finish" | "editor" | "settings";

export interface CardVisual {
  src: string;
  alt: string;
}

export interface Card {
  id: string;
  stage: Stage;
  category: Category;
  mode: CardMode;
  text: string;
  timerSeconds: number;
  source: "builtIn" | "custom";
  visual?: CardVisual;
}

export interface Player {
  id: string;
  name: string;
}

export interface SessionState {
  players: Player[];
  currentPlayerIndex: number;
  round: number;
  currentCardId: string | null;
  partnerPlayerId: string | null;
  mode: SessionMode;
  turnsCompleted: number;
  targetTurns: number | null;
  recentCardIds: string[];
}

export interface Preferences {
  timerSeconds: number;
  soundEnabled: boolean;
  motionEnabled: boolean;
  savedNames: string[];
  seenCardIds: string[];
  disabledBuiltInCardIds: string[];
}

export interface StoredData {
  version: 2;
  preferences: Preferences;
  session: SessionState | null;
  customCards: Card[];
}

export interface DrawResult {
  card: Card | null;
  recycled: boolean;
  seenCardIds: string[];
}
