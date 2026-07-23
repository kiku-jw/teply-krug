import "./styles.css";

import { builtInCards } from "./content/cards";
import {
  categoryNames,
  CATEGORIES,
  createPlayers,
  drawCard,
  estimatedMinutesForTurns,
  SESSION_MODES,
  sessionModeDescriptions,
  sessionModeNames,
  stageNames,
  STAGES,
  targetTurnsForMode,
} from "./game";
import { clearStoredData, loadStoredData, saveStoredData } from "./storage";
import type { Card, CardMode, Category, Screen, SessionMode, Stage } from "./types";

const rootElement = document.querySelector<HTMLDivElement>("#app");
const liveRegionElement = document.querySelector<HTMLDivElement>("#live-region");

if (rootElement === null || liveRegionElement === null) {
  throw new Error("Required application roots are missing.");
}

const root: HTMLDivElement = rootElement;
const liveRegion: HTMLDivElement = liveRegionElement;

let data = loadStoredData();
let screen: Screen = "welcome";
let returnScreen: Screen = "welcome";
let editorReturnScreen: Screen = "welcome";
let draftNames = data.preferences.savedNames.length >= 2
  ? [...data.preferences.savedNames]
  : ["", ""];
let draftMode: SessionMode = "standard";
let editingCustomId: string | null = null;
let editorSearch = "";
let cardRevealed = false;
let timerRemaining = data.preferences.timerSeconds;
let timerRunning = false;
let timerHandle: number | null = null;
let toastMessage = "";
let toastHandle: number | null = null;
let jarRevealMode: "idle" | "intro" | "shuffle" | "pop" | "unfold" = "idle";
let jarRevealCount = 0;
let jarRevealRun = 0;
let jarRevealFallbackHandle: number | null = null;

type SoundCue = "paper" | "turn" | "glass" | "timer";

const jarPosterUrl = "./media/question-jar-poster.webp";
const jarIntroUrl = "./media/question-jar-intro.mp4";
const jarQuickUrl = "./media/question-jar-quick.mp4";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function announce(message: string): void {
  liveRegion.textContent = "";
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 20);
}

function showToast(message: string): void {
  toastMessage = message;
  if (toastHandle !== null) {
    window.clearTimeout(toastHandle);
  }
  renderToast();
  toastHandle = window.setTimeout(() => {
    toastMessage = "";
    renderToast();
  }, 3400);
}

function renderToast(): void {
  let toast = document.querySelector<HTMLDivElement>("#toast");
  if (toast === null) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.textContent = toastMessage;
  toast.classList.toggle("toast-visible", toastMessage.length > 0);
}

function persist(): void {
  saveStoredData(data);
}

function enabledCards(): Card[] {
  const builtIns = builtInCards.filter((card) => !data.preferences.disabledBuiltInCardIds.includes(card.id));
  return [...builtIns, ...data.customCards];
}

function cardById(id: string | null): Card | null {
  if (id === null) {
    return null;
  }
  return enabledCards().find((card) => card.id === id) ?? null;
}

function currentCard(): Card | null {
  return cardById(data.session?.currentCardId ?? null);
}

function currentPlayer() {
  const session = data.session;
  if (session === null) {
    return null;
  }
  return session.players[session.currentPlayerIndex] ?? null;
}

function drawForCurrent(category?: Category, excludedCardIds: string[] = []): Card | null {
  const session = data.session;
  if (session === null) {
    return null;
  }
  const previousCardId = session.recentCardIds.at(-1) ?? null;
  const result = drawCard(
    enabledCards(),
    session.round,
    data.preferences.seenCardIds,
    Math.random,
    category,
    excludedCardIds,
    previousCardId,
  );
  data.preferences.seenCardIds = result.seenCardIds;
  session.currentCardId = result.card?.id ?? null;
  session.partnerPlayerId = null;
  if (result.card !== null) {
    session.recentCardIds = [...session.recentCardIds, result.card.id].slice(-4);
  }
  cancelJarReveal();
  cardRevealed = false;
  resetTimer();
  persist();
  if (result.recycled) {
    showToast("Эти вопросы закончились, поэтому колода началась заново.");
  }
  return result.card;
}

function renderBrand(compact = false): string {
  return `
    <button class="brand ${compact ? "brand-compact" : ""}" data-action="home" aria-label="Доставай! На главную">
      <span class="brand-mark" aria-hidden="true"><span></span></span>
      <span><strong>Доставай!</strong><small>банка вопросов</small></span>
    </button>
  `;
}

function renderShell(content: string, options?: { compactHeader?: boolean; gameHeader?: boolean }): void {
  const compactHeader = options?.compactHeader ?? false;
  const gameHeader = options?.gameHeader ?? false;
  document.body.classList.toggle("motion-off", !data.preferences.motionEnabled);
  root.innerHTML = `
    <div class="ambient" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="app-shell ${gameHeader ? "app-shell-game" : ""}">
      <header class="topbar ${compactHeader ? "topbar-compact" : ""}">
        ${renderBrand(compactHeader)}
        <nav class="top-actions" aria-label="Настройки игры">
          <button class="button button-quiet" data-action="settings">Настройки</button>
        </nav>
      </header>
      <main id="main-content">${content}</main>
    </div>
  `;
  bindGlobalActions();
}

function bindGlobalActions(): void {
  root.querySelectorAll<HTMLElement>("[data-action='home']").forEach((element) => {
    element.addEventListener("click", () => {
      cancelJarReveal();
      stopTimer();
      screen = "welcome";
      render();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-action='editor']").forEach((element) => {
    element.addEventListener("click", () => {
      cancelJarReveal();
      stopTimer();
      editorReturnScreen = screen;
      screen = "editor";
      editingCustomId = null;
      render();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-action='settings']").forEach((element) => {
    element.addEventListener("click", () => {
      cancelJarReveal();
      stopTimer();
      returnScreen = screen;
      screen = "settings";
      render();
    });
  });
}

function renderWelcome(): void {
  const canContinue = data.session !== null && data.session.players.length >= 2;
  const seenCount = data.preferences.seenCardIds.length;
  renderShell(`
    <section class="welcome" aria-labelledby="welcome-title">
      <div class="welcome-copy">
        <h1 id="welcome-title">Что сегодня попадётся?</h1>
        <p class="welcome-lead">Впишите имена, покажите экран в Zoom и тяните записки по очереди.</p>
        <div class="welcome-actions">
          <button class="button button-primary button-large" data-action="new-game">Собрать компанию</button>
          ${canContinue ? '<button class="button button-secondary button-large" data-action="continue">Продолжить</button>' : ""}
        </div>
      </div>
      <div class="welcome-scene" aria-label="Банка с записками">
        <div class="jar-halo" aria-hidden="true"></div>
        <div class="jar-showcase">
          <img src="${jarPosterUrl}" alt="Прозрачная банка со сложенными записками" width="720" height="720" />
          <span class="loose-note loose-note-one" aria-hidden="true"></span>
          <span class="loose-note loose-note-two" aria-hidden="true"></span>
        </div>
        <div class="scene-chip chip-left"><strong>15/30</strong><span>минут</span></div>
        <div class="scene-chip chip-right"><strong>${seenCount}</strong><span>без повторов</span></div>
      </div>
      <div class="welcome-facts" aria-label="Как устроена игра">
        <div><strong>360</strong><span>записок в банке</span></div>
        <div><strong>2-12</strong><span>человек</span></div>
        <div><strong>0</strong><span>правильных ответов</span></div>
      </div>
    </section>
  `);

  root.querySelector<HTMLElement>("[data-action='new-game']")?.addEventListener("click", () => {
    data.session = null;
    draftNames = data.preferences.savedNames.length >= 2
      ? [...data.preferences.savedNames]
      : ["", ""];
    draftMode = "standard";
    screen = "setup";
    render();
  });
  root.querySelector<HTMLElement>("[data-action='continue']")?.addEventListener("click", () => {
    if (data.session !== null && data.session.currentCardId === null) {
      drawForCurrent();
    }
    screen = "game";
    render();
  });
}

function syncDraftNames(): void {
  const input = root.querySelector<HTMLTextAreaElement>("[data-player-list]");
  if (input !== null) {
    draftNames = input.value.split(/[\n,;]+/u).map((name) => name.trim()).filter((name) => name.length > 0);
  }
}

function validNames(): string[] {
  return draftNames.map((name) => name.trim()).filter((name) => name.length > 0);
}

function setupValidationMessage(names: string[]): string {
  if (names.length < 2) {
    return "Добавьте хотя бы ещё одного человека.";
  }
  if (names.length > 12) {
    return "В одной игре может быть не больше 12 человек.";
  }
  if (names.some((name) => name.length > 28)) {
    return "Сократите имена до 28 символов.";
  }
  const normalized = names.map((name) => name.toLocaleLowerCase("ru-RU"));
  if (new Set(normalized).size !== normalized.length) {
    return "Имена не должны повторяться.";
  }
  return "";
}

function renderSetup(): void {
  renderShell(`
    <section class="setup-layout" aria-labelledby="setup-title">
      <div class="setup-intro">
        <button class="text-button" data-action="back">Назад</button>
        <h1 id="setup-title">Кто сегодня играет?</h1>
        <p>Вставьте имена через запятую или с новой строки. Их порядок станет порядком ходов.</p>
        <p>Первый вопрос будет о Библии. Дальше темы перемешаются сами.</p>
      </div>
      <form class="setup-form" id="setup-form">
        <div class="form-heading"><h2>Имена</h2><span id="player-count">${validNames().length}/12</span></div>
        <label class="player-list-field" for="player-list">
          <span class="sr-only">Имена по порядку ходов</span>
          <textarea id="player-list" data-player-list rows="7" autocomplete="off" placeholder="Аня&#10;Борис&#10;Вера">${escapeHtml(draftNames.join("\n"))}</textarea>
          <small>От 2 до 12 человек. Порядок можно изменить прямо в списке.</small>
        </label>
        <fieldset class="session-mode-picker">
          <legend>Сколько играем?</legend>
          <div class="session-mode-grid">
            ${SESSION_MODES.map((mode) => `
              <label class="session-mode-option">
                <input type="radio" name="session-mode" value="${mode}" ${draftMode === mode ? "checked" : ""} />
                <span><strong>${sessionModeNames[mode]}</strong><small>${sessionModeDescriptions[mode]}</small></span>
              </label>
            `).join("")}
          </div>
        </fieldset>
        <p class="form-error" id="setup-error" aria-live="polite"></p>
        <div class="setup-footer">
          <button class="button button-primary" type="submit">Начать игру</button>
        </div>
      </form>
    </section>
  `);

  root.querySelector<HTMLElement>("[data-action='back']")?.addEventListener("click", () => {
    syncDraftNames();
    screen = "welcome";
    render();
  });
  root.querySelector<HTMLTextAreaElement>("[data-player-list]")?.addEventListener("input", (event) => {
    if (!(event.currentTarget instanceof HTMLTextAreaElement)) {
      return;
    }
    const count = event.currentTarget.value.split(/[\n,;]+/u).map((name) => name.trim()).filter((name) => name.length > 0).length;
    const counter = root.querySelector<HTMLElement>("#player-count");
    if (counter !== null) {
      counter.textContent = `${count}/12`;
    }
  });
  root.querySelectorAll<HTMLInputElement>("input[name='session-mode']").forEach((input) => {
    input.addEventListener("change", () => {
      if (isSessionModeValue(input.value)) {
        draftMode = input.value;
      }
    });
  });
  root.querySelector<HTMLFormElement>("#setup-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    syncDraftNames();
    const names = validNames();
    const message = setupValidationMessage(names);
    const error = root.querySelector<HTMLParagraphElement>("#setup-error");
    if (message.length > 0) {
      if (error !== null) {
        error.textContent = message;
      }
      return;
    }
    data.preferences.savedNames = names;
    data.session = {
      players: createPlayers(names),
      currentPlayerIndex: 0,
      round: 1,
      currentCardId: null,
      partnerPlayerId: null,
      mode: draftMode,
      turnsCompleted: 0,
      targetTurns: targetTurnsForMode(draftMode, names.length, data.preferences.timerSeconds),
      recentCardIds: [],
    };
    drawForCurrent("bible");
    screen = "game";
    persist();
    render();
  });
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function stopTimer(): void {
  timerRunning = false;
  if (timerHandle !== null) {
    window.clearInterval(timerHandle);
    timerHandle = null;
  }
}

function resetTimer(): void {
  stopTimer();
  timerRemaining = data.preferences.timerSeconds;
}

function startTimer(): void {
  if (data.preferences.timerSeconds === 0 || timerRunning) {
    return;
  }
  timerRunning = true;
  timerHandle = window.setInterval(() => {
    timerRemaining -= 1;
    updateTimerDisplay();
    if (timerRemaining <= 0) {
      stopTimer();
      playSound("timer");
      announce("Время вышло. Можно закончить ответ.");
    }
  }, 1000);
  updateTimerDisplay();
}

function updateTimerDisplay(): void {
  const display = root.querySelector<HTMLElement>("#timer-display");
  if (display !== null) {
    display.textContent = data.preferences.timerSeconds === 0 ? "Без таймера" : formatTime(timerRemaining);
    display.classList.toggle("timer-finished", timerRemaining <= 0 && data.preferences.timerSeconds > 0);
  }
  const button = root.querySelector<HTMLButtonElement>("#timer-toggle");
  if (button !== null) {
    button.textContent = timerRunning ? "Пауза" : timerRemaining === data.preferences.timerSeconds ? "Старт" : "Продолжить";
  }
}

function playSound(cue: SoundCue): void {
  if (!data.preferences.soundEnabled) {
    return;
  }
  try {
    const context = new AudioContext();
    const addPaper = (delay: number, length: number, volume: number): void => {
      const frameCount = Math.max(1, Math.floor(context.sampleRate * length));
      const buffer = context.createBuffer(1, frameCount, context.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < channel.length; index += 1) {
        const envelope = 1 - (index / channel.length);
        channel[index] = ((Math.random() * 2) - 1) * envelope;
      }
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      filter.type = "bandpass";
      filter.frequency.value = 2200;
      filter.Q.value = 0.65;
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      source.start(context.currentTime + delay);
    };
    const addGlass = (delay: number, frequency: number, length: number, volume: number): void => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + delay);
      gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + length);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + length + 0.02);
    };

    if (cue === "paper") {
      addPaper(0, 0.16, 0.055);
      addGlass(0.08, 1480, 0.22, 0.025);
    } else if (cue === "turn") {
      addPaper(0, 0.1, 0.04);
    } else if (cue === "glass") {
      addGlass(0, 1320, 0.24, 0.035);
    } else {
      addGlass(0, 1180, 0.3, 0.045);
      addGlass(0.18, 1480, 0.42, 0.04);
    }
    window.setTimeout(() => void context.close(), cue === "timer" ? 800 : 500);
  } catch {
    // Sound is optional and may be blocked by browser policy.
  }
}

function cancelJarReveal(): void {
  jarRevealRun += 1;
  jarRevealMode = "idle";
  if (jarRevealFallbackHandle !== null) {
    window.clearTimeout(jarRevealFallbackHandle);
    jarRevealFallbackHandle = null;
  }
}

function shouldReduceRevealMotion(): boolean {
  return !data.preferences.motionEnabled
    || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function finishJarReveal(run: number, playerName: string, cardText: string): void {
  if (run !== jarRevealRun) {
    return;
  }
  if (jarRevealFallbackHandle !== null) {
    window.clearTimeout(jarRevealFallbackHandle);
    jarRevealFallbackHandle = null;
  }
  jarRevealMode = "idle";
  cardRevealed = true;
  resetTimer();
  render();
  startTimer();
  announce(`Сейчас отвечает ${playerName}. Вопрос: ${cardText}`);
}

function beginJarReveal(playerName: string, cardText: string): void {
  cancelJarReveal();
  resetTimer();

  if (shouldReduceRevealMotion()) {
    playSound("paper");
    cardRevealed = true;
    render();
    startTimer();
    announce(`Сейчас отвечает ${playerName}. Вопрос: ${cardText}`);
    return;
  }

  const isFirstDraw = jarRevealCount === 0;
  const revealIndex = Math.max(0, jarRevealCount - 1) % 3;
  jarRevealMode = isFirstDraw
    ? "intro"
    : revealIndex === 0
      ? "shuffle"
      : revealIndex === 1
        ? "pop"
        : "unfold";
  jarRevealCount += 1;
  const run = jarRevealRun;
  render();

  const video = root.querySelector<HTMLVideoElement>("#jar-reveal-video");
  if (video === null) {
    playSound("paper");
    finishJarReveal(run, playerName, cardText);
    return;
  }

  let finished = false;
  const finish = (): void => {
    if (finished) {
      return;
    }
    finished = true;
    finishJarReveal(run, playerName, cardText);
  };
  const finishWithFallbackSound = (): void => {
    if (finished) {
      return;
    }
    playSound("paper");
    finish();
  };
  video.muted = !data.preferences.soundEnabled;
  video.addEventListener("ended", finish, { once: true });
  video.addEventListener("error", finishWithFallbackSound, { once: true });
  jarRevealFallbackHandle = window.setTimeout(finishWithFallbackSound, isFirstDraw ? 4100 : 1800);
  announce(`Сейчас отвечает ${playerName}. Достаём вопрос.`);
  void video.play().catch(finishWithFallbackSound);
}

function renderJarCover(): string {
  return `
    <button class="jar-draw-button" data-action="reveal-card" aria-label="ВЫТЯНУТЬ">
      <img src="${jarPosterUrl}" alt="" width="720" height="720" />
      <span class="jar-draw-shade" aria-hidden="true"></span>
      <span class="jar-draw-copy"><small>нажми на банку</small><strong>ВЫТЯНУТЬ</strong></span>
    </button>
  `;
}

function renderJarReveal(): string {
  const intro = jarRevealMode === "intro";
  const mirrored = jarRevealMode === "pop";
  return `
    <div class="jar-reveal jar-reveal-${jarRevealMode} ${mirrored ? "jar-reveal-mirrored" : ""}" role="status" aria-label="Достаём записку">
      <video id="jar-reveal-video" src="${intro ? jarIntroUrl : jarQuickUrl}" poster="${jarPosterUrl}" playsinline preload="auto"></video>
      <span class="jar-reveal-glow" aria-hidden="true"></span>
      <span class="reveal-note reveal-note-one" aria-hidden="true"></span>
      <span class="reveal-note reveal-note-two" aria-hidden="true"></span>
      <span class="reveal-paper" aria-hidden="true"></span>
      <span class="sr-only">Достаём и разворачиваем вопрос</span>
    </div>
  `;
}

function renderQuestionCard(card: Card): string {
  const session = data.session;
  if (session === null) {
    return "";
  }
  const player = currentPlayer();
  const partner = session.players.find((player) => player.id === session.partnerPlayerId);
  const contexts = [
    player !== null && partner !== undefined
      ? `Вдвоём: ${escapeHtml(player.name)} и ${escapeHtml(partner.name)}`
      : "",
  ].filter((context) => context.length > 0);
  return `
    <article class="question-card ${card.mode === "perform" ? "question-card-perform" : ""}">
      <p>${escapeHtml(card.text)}</p>
      ${contexts.length > 0 ? `<div class="card-context">${contexts.map((context) => `<span>${context}</span>`).join("")}</div>` : ""}
    </article>
  `;
}

function renderGame(): void {
  const session = data.session;
  const player = currentPlayer();
  const card = currentCard();
  if (session === null || player === null) {
    screen = "welcome";
    render();
    return;
  }
  if (card === null) {
    const drawn = drawForCurrent();
    if (drawn === null) {
      renderShell(`
        <section class="empty-deck" aria-labelledby="empty-deck-title">
          <h1 id="empty-deck-title">В банке не осталось вопросов</h1>
          <p>Верните скрытые карточки в настройках или добавьте свои.</p>
          <button class="button button-primary" data-action="settings">Открыть настройки</button>
        </section>
      `, { compactHeader: true });
      return;
    }
    renderGame();
    return;
  }

  renderShell(`
    <section class="game-layout" aria-labelledby="turn-title">
      <div class="game-stage">
        <div class="turn-heading">
          <div>
            <span>Круг ${session.round}, ${session.currentPlayerIndex + 1} из ${session.players.length}</span>
            <h1 id="turn-title">${escapeHtml(player.name)}</h1>
          </div>
          <button class="button button-quiet" data-action="leave-game">Выйти</button>
        </div>
        <div class="card-zone" ${jarRevealMode !== "idle" ? 'aria-busy="true"' : ""}>
          ${cardRevealed
            ? renderQuestionCard(card)
            : jarRevealMode === "idle"
              ? renderJarCover()
              : renderJarReveal()}
        </div>
        <div class="game-controls ${cardRevealed ? "controls-visible" : ""}">
          <div class="timer-box">
            <span id="timer-display">${data.preferences.timerSeconds === 0 ? "Без таймера" : formatTime(timerRemaining)}</span>
            ${data.preferences.timerSeconds === 0 ? "" : '<button class="text-button" id="timer-toggle">Старт</button><button class="text-button" data-action="reset-timer">Сброс</button>'}
          </div>
          <button class="button button-primary button-next" data-action="complete-turn" ${cardRevealed ? "" : "disabled"}>ДАЛЬШЕ</button>
        </div>
        <details class="turn-options">
          <summary>Если вопрос не подходит</summary>
          <div class="turn-options-panel">
            <button data-action="replace-card" ${jarRevealMode !== "idle" ? "disabled" : ""}><strong>Другой вопрос</strong><small>Можно сменить без объяснений</small></button>
            <button data-action="answer-together" ${jarRevealMode !== "idle" ? "disabled" : ""}><strong>Ответить вместе</strong><small>Позвать кого-нибудь в помощь</small></button>
            <button data-action="choose-category" ${jarRevealMode !== "idle" ? "disabled" : ""}><strong>Выбрать тему</strong><small>Если сейчас хочется о чём-то другом</small></button>
            <button data-action="finish-after-card" ${cardRevealed ? "" : "disabled"}><strong>Закончить вечер</strong><small>Перейти к последней записке</small></button>
          </div>
        </details>
      </div>
    </section>
    <dialog class="game-dialog" id="game-dialog"></dialog>
  `, { compactHeader: true, gameHeader: true });

  root.querySelector<HTMLElement>("[data-action='leave-game']")?.addEventListener("click", () => {
    if (window.confirm("Выйти на главную? Текущий круг сохранится.")) {
      cancelJarReveal();
      stopTimer();
      screen = "welcome";
      render();
    }
  });
  root.querySelector<HTMLElement>("[data-action='reveal-card']")?.addEventListener("click", () => {
    beginJarReveal(player.name, card.text);
  });
  root.querySelector<HTMLElement>("[data-action='complete-turn']")?.addEventListener("click", completeTurn);
  root.querySelector<HTMLElement>("[data-action='reset-timer']")?.addEventListener("click", () => {
    resetTimer();
    updateTimerDisplay();
  });
  root.querySelector<HTMLElement>("#timer-toggle")?.addEventListener("click", () => {
    if (timerRunning) {
      stopTimer();
      updateTimerDisplay();
    } else {
      startTimer();
    }
  });
  root.querySelector<HTMLElement>("[data-action='replace-card']")?.addEventListener("click", () => {
    const oldCard = data.session?.currentCardId ?? null;
    const replacement = drawForCurrent(undefined, oldCard === null ? [] : [oldCard]);
    if (replacement !== null) {
      playSound("glass");
      beginJarReveal(player.name, replacement.text);
      showToast("Берём другую записку.");
    }
  });
  root.querySelector<HTMLElement>("[data-action='answer-together']")?.addEventListener("click", openPartnerDialog);
  root.querySelector<HTMLElement>("[data-action='choose-category']")?.addEventListener("click", openCategoryDialog);
  root.querySelector<HTMLElement>("[data-action='finish-after-card']")?.addEventListener("click", () => {
    stopTimer();
    screen = "finish";
    persist();
    render();
  });
  updateTimerDisplay();
}

function openDialog(content: string): HTMLDialogElement | null {
  const dialog = root.querySelector<HTMLDialogElement>("#game-dialog");
  if (dialog === null) {
    return null;
  }
  dialog.innerHTML = content;
  dialog.showModal();
  dialog.querySelector<HTMLElement>("[data-close-dialog]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
  return dialog;
}

function openPartnerDialog(): void {
  const session = data.session;
  const player = currentPlayer();
  if (session === null || player === null) {
    return;
  }
  const choices = session.players.filter((candidate) => candidate.id !== player.id);
  if (choices.length === 1) {
    const partner = choices[0];
    if (partner !== undefined) {
      session.partnerPlayerId = partner.id;
      persist();
      playSound("glass");
      render();
      root.querySelector<HTMLElement>("[data-action='answer-together']")?.focus();
    }
    return;
  }
  const dialog = openDialog(`
    <div class="dialog-panel">
      <button class="dialog-close" data-close-dialog aria-label="Закрыть">×</button>
      <h2>Ответить вместе с кем?</h2>
      <p>Выберите, кто поможет ответить.</p>
      <div class="dialog-options">
        ${choices.map((candidate) => `<button data-partner="${candidate.id}">${escapeHtml(candidate.name)}</button>`).join("")}
      </div>
    </div>
  `);
  dialog?.querySelectorAll<HTMLElement>("[data-partner]").forEach((button) => {
    button.addEventListener("click", () => {
      const partnerId = button.dataset.partner;
      if (partnerId !== undefined && data.session !== null) {
        data.session.partnerPlayerId = partnerId;
        persist();
        playSound("glass");
        dialog.close();
        render();
        root.querySelector<HTMLElement>("[data-action='answer-together']")?.focus();
      }
    });
  });
}

function openCategoryDialog(): void {
  const dialog = openDialog(`
    <div class="dialog-panel">
      <button class="dialog-close" data-close-dialog aria-label="Закрыть">×</button>
      <h2>О чём хочется вопрос?</h2>
      <p>Выбери тему, и вопрос сменится.</p>
      <div class="dialog-options dialog-options-categories">
        ${CATEGORIES.map((category) => `<button data-category="${category}">${categoryNames[category]}</button>`).join("")}
      </div>
    </div>
  `);
  dialog?.querySelectorAll<HTMLElement>("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;
      if (category !== undefined && isCategoryValue(category)) {
        const previousCardId = data.session?.currentCardId ?? null;
        const wasRevealed = cardRevealed;
        const selected = drawForCurrent(category);
        const player = currentPlayer();
        dialog.close();
        if (selected !== null && player !== null) {
          playSound("glass");
          beginJarReveal(player.name, selected.text);
        } else if (data.session !== null) {
          data.session.currentCardId = previousCardId;
          cardRevealed = wasRevealed;
          persist();
          render();
          showToast("В этой теме пока нет доступных вопросов.");
        }
      }
    });
  });
}

function completeTurn(): void {
  const session = data.session;
  if (session === null) {
    return;
  }
  stopTimer();
  playSound("turn");
  session.turnsCompleted += 1;
  const nextIndex = session.currentPlayerIndex + 1;
  if (nextIndex >= session.players.length) {
    session.currentPlayerIndex = 0;
    session.round += 1;
    session.currentCardId = null;
    session.partnerPlayerId = null;
    screen = "checkpoint";
    persist();
    render();
    return;
  }
  session.currentPlayerIndex = nextIndex;
  drawForCurrent();
  persist();
  render();
}

function renderCheckpoint(): void {
  const session = data.session;
  if (session === null) {
    screen = "welcome";
    render();
    return;
  }
  const planReached = session.targetTurns !== null && session.turnsCompleted >= session.targetTurns;
  const roundMinutes = estimatedMinutesForTurns(session.players.length, data.preferences.timerSeconds);
  renderShell(`
    <section class="checkpoint" aria-labelledby="checkpoint-title">
      <div class="checkpoint-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
      <h1 id="checkpoint-title">${planReached ? "Можно завершать" : "Все ответили"}</h1>
      <p>${planReached
        ? `Запланированное время прошло. Ещё один круг займёт примерно ${roundMinutes} мин.`
        : `Можно закончить сейчас или сыграть ещё один круг, примерно ${roundMinutes} мин.`}</p>
      <div class="checkpoint-actions">
        <button class="button ${planReached ? "button-secondary" : "button-primary"} button-large" data-action="more-round">Ещё круг</button>
        <button class="button ${planReached ? "button-primary" : "button-secondary"} button-large" data-action="finish-game">Закончить</button>
      </div>
    </section>
  `, { compactHeader: true });
  root.querySelector<HTMLElement>("[data-action='more-round']")?.addEventListener("click", () => {
    drawForCurrent();
    screen = "game";
    persist();
    render();
  });
  root.querySelector<HTMLElement>("[data-action='finish-game']")?.addEventListener("click", () => {
    screen = "finish";
    render();
  });
}

function renderFinish(): void {
  const session = data.session;
  if (session === null) {
    screen = "welcome";
    render();
    return;
  }
  renderShell(`
    <section class="finish" aria-labelledby="finish-title">
      <div class="finish-jar" aria-hidden="true">
        <div class="finish-light"></div>
        <img src="${jarPosterUrl}" alt="" width="720" height="720" />
        <span class="finish-note"></span>
      </div>
      <div class="finish-copy">
        <h1 id="finish-title">Последняя записка</h1>
        <p class="finish-question">Что за этот вечер запомнилось больше всего?</p>
        <p>Можно ответить по очереди или просто закончить вечер.</p>
        <div class="finish-people" aria-label="Имена за этот вечер">
          ${session.players.map((player) => `<span>${escapeHtml(player.name)}</span>`).join("")}
        </div>
        <div class="finish-actions">
          <button class="button button-primary button-large" data-action="same-group">Сыграть ещё</button>
          <button class="button button-secondary button-large" data-action="finish-home">На главную</button>
        </div>
      </div>
    </section>
  `, { compactHeader: true });
  root.querySelector<HTMLElement>("[data-action='same-group']")?.addEventListener("click", () => {
    draftNames = session.players.map((player) => player.name);
    draftMode = session.mode;
    data.session = null;
    screen = "setup";
    persist();
    render();
  });
  root.querySelector<HTMLElement>("[data-action='finish-home']")?.addEventListener("click", () => {
    data.session = null;
    persist();
    screen = "welcome";
    render();
  });
}

function isStageValue(value: string): value is Stage {
  return STAGES.some((stage) => stage === value);
}

function isCategoryValue(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}

function isModeValue(value: string): value is CardMode {
  return value === "answer" || value === "perform" || value === "group";
}

function isSessionModeValue(value: string): value is SessionMode {
  return SESSION_MODES.some((mode) => mode === value);
}

function renderEditor(): void {
  const editing = editingCustomId === null ? null : data.customCards.find((card) => card.id === editingCustomId) ?? null;
  const normalizedSearch = editorSearch.trim().toLocaleLowerCase("ru-RU");
  const filteredBuiltIns = builtInCards.filter((card) =>
    normalizedSearch.length > 0
      ? card.text.toLocaleLowerCase("ru-RU").includes(normalizedSearch)
        || categoryNames[card.category].toLocaleLowerCase("ru-RU").includes(normalizedSearch)
      : true,
  ).slice(0, normalizedSearch.length > 0 ? 80 : 24);
  const disabledCount = data.preferences.disabledBuiltInCardIds.length;
  renderShell(`
    <section class="editor" aria-labelledby="editor-title">
      <div class="page-heading">
        <button class="text-button" data-action="back-from-tool">Назад</button>
        <p class="section-kicker">Своя банка</p>
        <h1 id="editor-title">Вопросы вашей компании</h1>
        <p>Свои вопросы остаются только в этом браузере. Встроенные можно скрывать, но их исходный текст не изменяется.</p>
      </div>
      <div class="editor-grid">
        <form class="custom-card-form" id="custom-card-form">
          <div class="form-heading"><h2>${editing === null ? "Новая карточка" : "Редактировать"}</h2>${editing === null ? "" : '<button class="text-button" type="button" data-action="cancel-edit">Отмена</button>'}</div>
          <label>Этап<select name="stage">
            ${STAGES.map((stage) => `<option value="${stage}" ${editing?.stage === stage ? "selected" : ""}>${stageNames[stage]}</option>`).join("")}
          </select></label>
          <label>Категория<select name="category">
            ${CATEGORIES.map((category) => `<option value="${category}" ${editing?.category === category ? "selected" : ""}>${categoryNames[category]}</option>`).join("")}
          </select></label>
          <label>Формат<select name="mode">
            <option value="answer" ${editing?.mode === "answer" ? "selected" : ""}>Ответ</option>
            <option value="perform" ${editing?.mode === "perform" ? "selected" : ""}>Показать</option>
            <option value="group" ${editing?.mode === "group" ? "selected" : ""}>Для группы</option>
          </select></label>
          <label>Текст<textarea name="text" maxlength="220" required placeholder="Например: расскажи о маленьком поступке друга, который ты помнишь до сих пор.">${escapeHtml(editing?.text ?? "")}</textarea></label>
          <p class="form-error" id="card-error" aria-live="polite"></p>
          <button class="button button-primary" type="submit">${editing === null ? "Добавить" : "Сохранить"}</button>
        </form>
        <div class="deck-library">
          <div class="library-section">
            <div class="library-heading"><div><h2>Свои карточки</h2><span>${data.customCards.length}</span></div></div>
            <div class="custom-card-list">
              ${data.customCards.length === 0
                ? '<div class="empty-state"><strong>Здесь пока тихо</strong><span>Добавьте первый вопрос, который звучит именно как ваша компания.</span></div>'
                : data.customCards.map((card) => `
                  <article class="library-card">
                    <div><span>${stageNames[card.stage]} / ${categoryNames[card.category]}</span><p>${escapeHtml(card.text)}</p></div>
                    <div><button class="text-button" data-edit-custom="${card.id}">Изменить</button><button class="text-button text-danger" data-remove-custom="${card.id}">Удалить</button></div>
                  </article>
                `).join("")}
            </div>
          </div>
          <div class="library-section built-in-library">
            <div class="library-heading"><div><h2>Встроенная колода</h2><span>360</span></div>${disabledCount > 0 ? `<button class="text-button" data-action="restore-builtins">Вернуть скрытые (${disabledCount})</button>` : ""}</div>
            <label class="search-field"><span>Поиск</span><input id="deck-search" type="search" value="${escapeHtml(editorSearch)}" placeholder="Слово или тема" /></label>
            <p class="library-hint">${normalizedSearch.length === 0 ? "Показаны первые 24 карточки. Используйте поиск, чтобы найти конкретную." : `Найдено: ${filteredBuiltIns.length}`}</p>
            <div class="built-in-list">
              ${filteredBuiltIns.map((card) => {
                const disabled = data.preferences.disabledBuiltInCardIds.includes(card.id);
                return `
                  <article class="library-card ${disabled ? "library-card-disabled" : ""}">
                    <div><span>${stageNames[card.stage]} / ${categoryNames[card.category]}</span><p>${escapeHtml(card.text)}</p></div>
                    <button class="text-button" data-toggle-built-in="${card.id}">${disabled ? "Вернуть" : "Скрыть"}</button>
                  </article>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  `, { compactHeader: true });

  bindToolBack();
  root.querySelector<HTMLElement>("[data-action='cancel-edit']")?.addEventListener("click", () => {
    editingCustomId = null;
    render();
  });
  const customCardForm = root.querySelector<HTMLFormElement>("#custom-card-form");
  customCardForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(customCardForm);
    const stage = formData.get("stage");
    const category = formData.get("category");
    const mode = formData.get("mode");
    const text = formData.get("text");
    const error = root.querySelector<HTMLParagraphElement>("#card-error");
    if (typeof stage !== "string" || typeof category !== "string" || typeof mode !== "string" || typeof text !== "string"
      || !isStageValue(stage) || !isCategoryValue(category) || !isModeValue(mode) || text.trim().length < 12) {
      if (error !== null) {
        error.textContent = "Напишите законченную карточку длиной хотя бы 12 символов.";
      }
      return;
    }
    if (editingCustomId === null) {
      data.customCards.unshift({
        id: `custom-${crypto.randomUUID()}`,
        stage,
        category,
        mode,
        text: text.trim(),
        timerSeconds: data.preferences.timerSeconds || 75,
        source: "custom",
      });
    } else {
      data.customCards = data.customCards.map((card) => card.id === editingCustomId
        ? { ...card, stage, category, mode, text: text.trim() }
        : card);
    }
    editingCustomId = null;
    persist();
    render();
    showToast("Карточка сохранена в этом браузере.");
  });
  root.querySelectorAll<HTMLElement>("[data-edit-custom]").forEach((button) => {
    button.addEventListener("click", () => {
      editingCustomId = button.dataset.editCustom ?? null;
      render();
      root.querySelector<HTMLTextAreaElement>("textarea[name='text']")?.focus();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-remove-custom]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.removeCustom;
      if (id !== undefined && window.confirm("Удалить эту пользовательскую карточку?")) {
        data.customCards = data.customCards.filter((card) => card.id !== id);
        persist();
        render();
      }
    });
  });
  root.querySelector<HTMLInputElement>("#deck-search")?.addEventListener("input", (event) => {
    if (event.currentTarget instanceof HTMLInputElement) {
      editorSearch = event.currentTarget.value;
      render();
      const search = root.querySelector<HTMLInputElement>("#deck-search");
      search?.focus();
      search?.setSelectionRange(editorSearch.length, editorSearch.length);
    }
  });
  root.querySelectorAll<HTMLElement>("[data-toggle-built-in]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.toggleBuiltIn;
      if (id === undefined) {
        return;
      }
      if (data.preferences.disabledBuiltInCardIds.includes(id)) {
        data.preferences.disabledBuiltInCardIds = data.preferences.disabledBuiltInCardIds.filter((cardId) => cardId !== id);
      } else {
        data.preferences.disabledBuiltInCardIds.push(id);
      }
      persist();
      render();
    });
  });
  root.querySelector<HTMLElement>("[data-action='restore-builtins']")?.addEventListener("click", () => {
    data.preferences.disabledBuiltInCardIds = [];
    persist();
    render();
  });
}

function bindToolBack(): void {
  root.querySelector<HTMLElement>("[data-action='back-from-tool']")?.addEventListener("click", () => {
    screen = screen === "editor" ? editorReturnScreen : returnScreen;
    render();
  });
}

function renderSettings(): void {
  renderShell(`
    <section class="settings-page" aria-labelledby="settings-title">
      <div class="page-heading">
        <button class="text-button" data-action="back-from-tool">Назад</button>
        <p class="section-kicker">Для хоста</p>
        <h1 id="settings-title">Настройте темп</h1>
        <p>Изменения сохраняются только в этом браузере.</p>
      </div>
      <form class="settings-panel" id="settings-form">
        <label class="setting-row"><span><strong>Мягкий таймер</strong><small>Он подаст сигнал, но никогда не прервёт ответ.</small></span><select name="timer">
          <option value="45" ${data.preferences.timerSeconds === 45 ? "selected" : ""}>45 секунд</option>
          <option value="75" ${data.preferences.timerSeconds === 75 ? "selected" : ""}>75 секунд</option>
          <option value="120" ${data.preferences.timerSeconds === 120 ? "selected" : ""}>120 секунд</option>
          <option value="0" ${data.preferences.timerSeconds === 0 ? "selected" : ""}>Выключен</option>
        </select></label>
        <label class="setting-row"><span><strong>Звуки</strong><small>Шорох бумаги, лёгкий звон стекла и мягкий сигнал таймера.</small></span><input name="sound" type="checkbox" ${data.preferences.soundEnabled ? "checked" : ""} /></label>
        <label class="setting-row"><span><strong>Анимации</strong><small>Банка, записки и переходы между ходами.</small></span><input name="motion" type="checkbox" ${data.preferences.motionEnabled ? "checked" : ""} /></label>
        <button class="button button-primary" type="submit">Сохранить</button>
      </form>
      <div class="data-panel">
        <div><strong>Вопросы</strong><span>Свои карточки и скрытие встроенных</span><button class="button button-secondary" data-action="editor">Открыть колоду</button></div>
        <div><strong>История вопросов</strong><span>${data.preferences.seenCardIds.length} карточек уже использовано</span><button class="button button-secondary" data-action="reset-history">Начать колоду заново</button></div>
        <div><strong>Все локальные данные</strong><span>Имена, текущая игра, свои карточки и настройки</span><button class="button button-danger" data-action="reset-all">Удалить данные</button></div>
      </div>
    </section>
  `, { compactHeader: true });
  bindToolBack();
  const settingsForm = root.querySelector<HTMLFormElement>("#settings-form");
  settingsForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(settingsForm);
    const timer = Number(formData.get("timer"));
    if ([0, 45, 75, 120].includes(timer)) {
      data.preferences.timerSeconds = timer;
    }
    data.preferences.soundEnabled = formData.get("sound") === "on";
    data.preferences.motionEnabled = formData.get("motion") === "on";
    resetTimer();
    persist();
    showToast("Настройки сохранены.");
    screen = returnScreen === "settings" ? "welcome" : returnScreen;
    render();
  });
  root.querySelector<HTMLElement>("[data-action='reset-history']")?.addEventListener("click", () => {
    if (window.confirm("Вернуть все встроенные и свои вопросы в колоду?")) {
      data.preferences.seenCardIds = [];
      persist();
      render();
      showToast("История вопросов очищена.");
    }
  });
  root.querySelector<HTMLElement>("[data-action='reset-all']")?.addEventListener("click", () => {
    if (window.confirm("Удалить все локальные данные игры? Это действие нельзя отменить.")) {
      data = clearStoredData();
      draftNames = ["", ""];
      draftMode = "standard";
      screen = "welcome";
      render();
      showToast("Локальные данные удалены.");
    }
  });
}

function render(): void {
  if (screen === "welcome") {
    renderWelcome();
  } else if (screen === "setup") {
    renderSetup();
  } else if (screen === "game") {
    renderGame();
  } else if (screen === "checkpoint") {
    renderCheckpoint();
  } else if (screen === "finish") {
    renderFinish();
  } else if (screen === "editor") {
    renderEditor();
  } else {
    renderSettings();
  }
  renderToast();
}

render();
