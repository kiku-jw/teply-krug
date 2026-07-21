export type Stage = "spark" | "closer" | "together";
export type Category = "personal" | "stories" | "service" | "bible" | "creative";
export type CardMode = "answer" | "perform" | "group";
export type AbilityId = "replace" | "partner" | "twoChoices" | "groupHelp" | "chooseCategory";
export type Screen = "welcome" | "setup" | "game" | "checkpoint" | "finish" | "editor" | "settings";

export interface Card {
  id: string;
  stage: Stage;
  category: Category;
  mode: CardMode;
  text: string;
  timerSeconds: number;
  source: "builtIn" | "custom";
}

export interface Player {
  id: string;
  name: string;
  abilities: AbilityId[];
  usedAbilities: AbilityId[];
}

export interface SessionState {
  players: Player[];
  currentPlayerIndex: number;
  stage: Stage;
  round: number;
  currentCardId: string | null;
  alternativeCardIds: string[];
  partnerPlayerId: string | null;
  groupHelpActive: boolean;
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
  version: number;
  preferences: Preferences;
  session: SessionState | null;
  customCards: Card[];
}

export interface DrawResult {
  card: Card | null;
  recycled: boolean;
  seenCardIds: string[];
}
