import "./styles.css";

import { builtInCards } from "./content/cards";
import {
  abilityDescriptions,
  abilityNames,
  categoryNames,
  CATEGORIES,
  createPlayers,
  drawCard,
  markAbilityUsed,
  nextStage,
  stageDescriptions,
  stageNames,
  STAGES,
} from "./game";
import { clearStoredData, loadStoredData, saveStoredData } from "./storage";
import type { AbilityId, Card, CardMode, Category, Screen, Stage } from "./types";

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
let draftNames = data.preferences.savedNames.length >= 6
  ? [...data.preferences.savedNames]
  : ["", "", "", "", "", ""];
let editingCustomId: string | null = null;
let editorSearch = "";
let cardRevealed = false;
let timerRemaining = data.preferences.timerSeconds;
let timerRunning = false;
let timerHandle: number | null = null;
let toastMessage = "";
let toastHandle: number | null = null;

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
  const result = drawCard(
    enabledCards(),
    session.stage,
    data.preferences.seenCardIds,
    Math.random,
    category,
    excludedCardIds,
  );
  data.preferences.seenCardIds = result.seenCardIds;
  session.currentCardId = result.card?.id ?? null;
  session.alternativeCardIds = [];
  session.partnerPlayerId = null;
  session.groupHelpActive = false;
  cardRevealed = false;
  resetTimer();
  persist();
  if (result.recycled) {
    showToast("Карточки этого этапа закончились. Начался новый цикл.");
  }
  return result.card;
}

function renderBrand(compact = false): string {
  return `
    <button class="brand ${compact ? "brand-compact" : ""}" data-action="home" aria-label="На главную">
      <span class="brand-mark" aria-hidden="true"><span></span></span>
      <span><strong>Тёплый круг</strong><small>вопросы для живого знакомства</small></span>
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
          <button class="button button-quiet" data-action="editor">Колода</button>
          <button class="button button-quiet" data-action="settings">Настройки</button>
        </nav>
      </header>
      <main id="main-content">${content}</main>
      <footer class="site-note">Неофициальная дружеская игра. Ответы участников не сохраняются.</footer>
    </div>
  `;
  bindGlobalActions();
}

function bindGlobalActions(): void {
  root.querySelectorAll<HTMLElement>("[data-action='home']").forEach((element) => {
    element.addEventListener("click", () => {
      stopTimer();
      screen = "welcome";
      render();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-action='editor']").forEach((element) => {
    element.addEventListener("click", () => {
      stopTimer();
      returnScreen = screen;
      screen = "editor";
      editingCustomId = null;
      render();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-action='settings']").forEach((element) => {
    element.addEventListener("click", () => {
      stopTimer();
      returnScreen = screen;
      screen = "settings";
      render();
    });
  });
}

function renderWelcome(): void {
  const canContinue = data.session !== null && data.session.players.length >= 6;
  const seenCount = data.preferences.seenCardIds.length;
  renderShell(`
    <section class="welcome" aria-labelledby="welcome-title">
      <div class="welcome-copy">
        <p class="eyebrow">Один экран. Один круг. Много настоящих разговоров.</p>
        <h1 id="welcome-title">Стать ближе за один вечер</h1>
        <p class="welcome-lead">Введите имена, включите демонстрацию в Zoom и позвольте хорошему вопросу сделать остальное.</p>
        <div class="welcome-actions">
          <button class="button button-primary button-large" data-action="new-game">Собрать круг</button>
          ${canContinue ? '<button class="button button-secondary button-large" data-action="continue">Продолжить</button>' : ""}
        </div>
        <div class="welcome-facts" aria-label="Как устроена игра">
          <div><strong>360</strong><span>живых карточек</span></div>
          <div><strong>3</strong><span>мягких этапа</span></div>
          <div><strong>0</strong><span>очков и неловких рейтингов</span></div>
        </div>
      </div>
      <div class="welcome-scene" aria-label="Пример игровой карточки">
        <div class="orbit orbit-one" aria-hidden="true"></div>
        <div class="orbit orbit-two" aria-hidden="true"></div>
        <div class="sample-card">
          <div class="sample-card-top"><span>Искра</span><span>О тебе</span></div>
          <p>Какой маленький повод недавно сделал твой день лучше?</p>
          <div class="sample-card-bottom"><span>Слушаем без спешки</span><span>75 сек</span></div>
        </div>
        <div class="scene-chip chip-left"><strong>6-12</strong><span>человек</span></div>
        <div class="scene-chip chip-right"><strong>${seenCount}</strong><span>уже сыграно</span></div>
      </div>
    </section>
  `);

  root.querySelector<HTMLElement>("[data-action='new-game']")?.addEventListener("click", () => {
    data.session = null;
    draftNames = data.preferences.savedNames.length >= 6
      ? [...data.preferences.savedNames]
      : ["", "", "", "", "", ""];
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
  draftNames = Array.from(root.querySelectorAll<HTMLInputElement>("[data-player-name]"))
    .map((input) => input.value);
}

function validNames(): string[] {
  return draftNames.map((name) => name.trim()).filter((name) => name.length > 0);
}

function setupValidationMessage(names: string[]): string {
  if (names.length < 6) {
    return `Добавьте ещё ${6 - names.length}.`;
  }
  if (names.length > 12) {
    return "В одном круге может быть не больше 12 человек.";
  }
  const normalized = names.map((name) => name.toLocaleLowerCase("ru-RU"));
  if (new Set(normalized).size !== normalized.length) {
    return "Имена в круге не должны повторяться.";
  }
  return "";
}

function renderSetup(): void {
  const rows = draftNames.map((name, index) => `
    <div class="player-input-row">
      <span class="player-number" aria-hidden="true">${index + 1}</span>
      <label class="sr-only" for="player-${index}">Имя участника ${index + 1}</label>
      <input id="player-${index}" data-player-name type="text" maxlength="28" value="${escapeHtml(name)}" autocomplete="off" placeholder="Имя участника" />
      <div class="row-actions">
        <button class="icon-button" data-move-up="${index}" aria-label="Поднять ${escapeHtml(name || `участника ${index + 1}`)}">↑</button>
        <button class="icon-button" data-move-down="${index}" aria-label="Опустить ${escapeHtml(name || `участника ${index + 1}`)}">↓</button>
        <button class="icon-button icon-button-danger" data-remove-player="${index}" aria-label="Удалить ${escapeHtml(name || `участника ${index + 1}`)}">×</button>
      </div>
    </div>
  `).join("");

  renderShell(`
    <section class="setup-layout" aria-labelledby="setup-title">
      <div class="setup-intro">
        <button class="text-button" data-action="back">Назад</button>
        <p class="section-kicker">Перед началом</p>
        <h1 id="setup-title">Кто сегодня в круге?</h1>
        <p>Порядок имён станет порядком ходов. Его можно изменить стрелками.</p>
        <div class="stage-preview">
          ${STAGES.map((stage, index) => `
            <div><span>${index + 1}</span><strong>${stageNames[stage]}</strong><small>${stageDescriptions[stage]}</small></div>
          `).join("")}
        </div>
      </div>
      <form class="setup-form" id="setup-form">
        <div class="form-heading"><h2>Участники</h2><span>${draftNames.length}/12</span></div>
        <div class="player-inputs">${rows}</div>
        <p class="form-error" id="setup-error" aria-live="polite"></p>
        <div class="setup-footer">
          <button class="button button-secondary" type="button" data-action="add-player" ${draftNames.length >= 12 ? "disabled" : ""}>Добавить имя</button>
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
  root.querySelector<HTMLElement>("[data-action='add-player']")?.addEventListener("click", () => {
    syncDraftNames();
    if (draftNames.length < 12) {
      draftNames.push("");
    }
    render();
    root.querySelectorAll<HTMLInputElement>("[data-player-name]").item(draftNames.length - 1).focus();
  });
  root.querySelectorAll<HTMLElement>("[data-remove-player]").forEach((button) => {
    button.addEventListener("click", () => {
      syncDraftNames();
      const index = Number(button.dataset.removePlayer);
      if (Number.isInteger(index) && draftNames.length > 1) {
        draftNames.splice(index, 1);
      }
      render();
    });
  });
  root.querySelectorAll<HTMLElement>("[data-move-up], [data-move-down]").forEach((button) => {
    button.addEventListener("click", () => {
      syncDraftNames();
      const upIndex = button.dataset.moveUp;
      const downIndex = button.dataset.moveDown;
      const index = Number(upIndex ?? downIndex);
      const target = upIndex === undefined ? index + 1 : index - 1;
      const name = draftNames[index];
      const targetName = draftNames[target];
      if (name !== undefined && targetName !== undefined) {
        draftNames[index] = targetName;
        draftNames[target] = name;
      }
      render();
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
      stage: "spark",
      round: 1,
      currentCardId: null,
      alternativeCardIds: [],
      partnerPlayerId: null,
      groupHelpActive: false,
    };
    drawForCurrent();
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
      playSoftBell();
      announce("Время вышло. Ответ можно спокойно закончить.");
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

function playSoftBell(): void {
  if (!data.preferences.soundEnabled) {
    return;
  }
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.7);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.72);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // Sound is optional and may be blocked by browser policy.
  }
}

function renderStageRail(stage: Stage): string {
  return STAGES.map((item, index) => {
    const activeIndex = STAGES.indexOf(stage);
    const status = index < activeIndex ? "stage-done" : index === activeIndex ? "stage-active" : "";
    return `<div class="stage-step ${status}"><span>${index + 1}</span><strong>${stageNames[item]}</strong></div>`;
  }).join("");
}

function renderPlayerRail(): string {
  const session = data.session;
  if (session === null) {
    return "";
  }
  return session.players.map((player, index) => {
    const active = index === session.currentPlayerIndex;
    const remaining = player.abilities.length - player.usedAbilities.length;
    return `
      <li class="player-rail-item ${active ? "player-active" : ""}">
        <span class="avatar">${escapeHtml(player.name.slice(0, 1).toLocaleUpperCase("ru-RU"))}</span>
        <span><strong>${escapeHtml(player.name)}</strong><small>${remaining} ${remaining === 1 ? "жетон" : "жетона"}</small></span>
        ${active ? '<span class="current-label">ходит</span>' : ""}
      </li>
    `;
  }).join("");
}

function renderAbilities(): string {
  const player = currentPlayer();
  if (player === null) {
    return "";
  }
  return player.abilities.map((ability) => {
    const used = player.usedAbilities.includes(ability);
    return `
      <button class="ability" data-ability="${ability}" ${used ? "disabled" : ""} title="${escapeHtml(abilityDescriptions[ability])}">
        <span>${used ? "0" : "1"}</span>
        <strong>${escapeHtml(abilityNames[ability])}</strong>
      </button>
    `;
  }).join("");
}

function renderQuestionCard(card: Card): string {
  const session = data.session;
  if (session === null) {
    return "";
  }
  const partner = session.players.find((player) => player.id === session.partnerPlayerId);
  return `
    <article class="question-card ${card.mode === "perform" ? "question-card-perform" : ""}">
      <div class="card-meta"><span>${stageNames[card.stage]}</span><span>${categoryNames[card.category]}</span></div>
      <p>${escapeHtml(card.text)}</p>
      <div class="card-context">
        ${partner !== undefined ? `<span>Вместе с ${escapeHtml(partner.name)}</span>` : ""}
        ${session.groupHelpActive ? "<span>Круг помогает идеями</span>" : ""}
        <span>${card.mode === "perform" ? "Покажи, не торопясь" : card.mode === "group" ? "Можно подключить весь круг" : "Слушаем без спешки"}</span>
      </div>
    </article>
  `;
}

function renderChoiceCards(): string {
  const session = data.session;
  if (session === null || session.alternativeCardIds.length !== 2) {
    return "";
  }
  return `
    <div class="choice-heading"><span>Два пути</span><strong>Выбери один вопрос</strong></div>
    <div class="choice-grid">
      ${session.alternativeCardIds.map((id) => {
        const card = cardById(id);
        if (card === null) {
          return "";
        }
        return `<button class="choice-card" data-choose-card="${card.id}"><span>${categoryNames[card.category]}</span><strong>${escapeHtml(card.text)}</strong></button>`;
      }).join("")}
    </div>
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
    drawForCurrent();
    renderGame();
    return;
  }

  renderShell(`
    <section class="game-layout" aria-labelledby="turn-title">
      <aside class="game-sidebar">
        <div class="stage-rail">${renderStageRail(session.stage)}</div>
        <div class="round-label">Круг ${session.round}</div>
        <ol class="player-rail">${renderPlayerRail()}</ol>
      </aside>
      <div class="game-stage">
        <div class="turn-heading">
          <div><span>Сейчас отвечает</span><h1 id="turn-title">${escapeHtml(player.name)}</h1></div>
          <button class="button button-quiet" data-action="leave-game">Выйти</button>
        </div>
        <div class="card-zone">
          ${session.alternativeCardIds.length === 2
            ? renderChoiceCards()
            : cardRevealed
              ? renderQuestionCard(card)
              : `
                <button class="card-cover" data-action="reveal-card">
                  <span class="cover-mark" aria-hidden="true"><span></span></span>
                  <strong>Открыть вопрос</strong>
                  <small>${categoryNames[card.category]}</small>
                </button>
              `}
        </div>
        <div class="game-controls ${cardRevealed ? "controls-visible" : ""}">
          <div class="timer-box">
            <span id="timer-display">${data.preferences.timerSeconds === 0 ? "Без таймера" : formatTime(timerRemaining)}</span>
            ${data.preferences.timerSeconds === 0 ? "" : '<button class="text-button" id="timer-toggle">Старт</button><button class="text-button" data-action="reset-timer">Сброс</button>'}
          </div>
          <button class="button button-primary button-next" data-action="complete-turn" ${cardRevealed ? "" : "disabled"}>Готово. Дальше</button>
        </div>
        <div class="ability-bar" aria-label="Разовые способности ${escapeHtml(player.name)}">
          <span class="ability-label">Супернавыки</span>
          ${renderAbilities()}
        </div>
      </div>
    </section>
    <dialog class="game-dialog" id="game-dialog"></dialog>
  `, { compactHeader: true, gameHeader: true });

  root.querySelector<HTMLElement>("[data-action='leave-game']")?.addEventListener("click", () => {
    if (window.confirm("Выйти на главную? Текущий круг сохранится.")) {
      stopTimer();
      screen = "welcome";
      render();
    }
  });
  root.querySelector<HTMLElement>("[data-action='reveal-card']")?.addEventListener("click", () => {
    cardRevealed = true;
    resetTimer();
    render();
    startTimer();
    announce(`Вопрос для ${player.name}: ${card.text}`);
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
  root.querySelectorAll<HTMLElement>("[data-ability]").forEach((button) => {
    button.addEventListener("click", () => useAbility(button.dataset.ability ?? ""));
  });
  root.querySelectorAll<HTMLElement>("[data-choose-card]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.chooseCard;
      if (id !== undefined && data.session !== null) {
        data.session.currentCardId = id;
        data.session.alternativeCardIds = [];
        cardRevealed = true;
        resetTimer();
        persist();
        render();
        startTimer();
      }
    });
  });
  updateTimerDisplay();
}

function isAbilityId(value: string): value is AbilityId {
  return value === "replace"
    || value === "partner"
    || value === "twoChoices"
    || value === "groupHelp"
    || value === "chooseCategory";
}

function updateCurrentPlayerAbility(ability: AbilityId): void {
  const session = data.session;
  const player = currentPlayer();
  if (session === null || player === null) {
    return;
  }
  session.players[session.currentPlayerIndex] = markAbilityUsed(player, ability);
}

function useAbility(rawAbility: string): void {
  if (!isAbilityId(rawAbility) || data.session === null) {
    return;
  }
  const player = currentPlayer();
  if (player === null || player.usedAbilities.includes(rawAbility)) {
    return;
  }
  if (rawAbility === "replace") {
    updateCurrentPlayerAbility(rawAbility);
    const oldCard = data.session.currentCardId;
    drawForCurrent(undefined, oldCard === null ? [] : [oldCard]);
    persist();
    render();
    showToast("Вопрос заменён. Объяснять причину не нужно.");
    return;
  }
  if (rawAbility === "twoChoices") {
    const original = data.session.currentCardId;
    const result = drawCard(
      enabledCards(),
      data.session.stage,
      data.preferences.seenCardIds,
      Math.random,
      undefined,
      original === null ? [] : [original],
    );
    if (original !== null && result.card !== null) {
      updateCurrentPlayerAbility(rawAbility);
      data.preferences.seenCardIds = result.seenCardIds;
      data.session.alternativeCardIds = [original, result.card.id];
      cardRevealed = true;
      stopTimer();
      persist();
      render();
    }
    return;
  }
  if (rawAbility === "groupHelp") {
    updateCurrentPlayerAbility(rawAbility);
    data.session.groupHelpActive = true;
    cardRevealed = true;
    persist();
    render();
    showToast("Теперь весь круг может подкидывать идеи.");
    return;
  }
  if (rawAbility === "partner") {
    openPartnerDialog();
    return;
  }
  openCategoryDialog();
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
  const dialog = openDialog(`
    <div class="dialog-panel">
      <button class="dialog-close" data-close-dialog aria-label="Закрыть">×</button>
      <span class="dialog-kicker">Напарник</span>
      <h2>Кого пригласить?</h2>
      <p>Выбранный человек отвечает или выполняет задание вместе с ${escapeHtml(player.name)}.</p>
      <div class="dialog-options">
        ${choices.map((candidate) => `<button data-partner="${candidate.id}">${escapeHtml(candidate.name)}</button>`).join("")}
      </div>
    </div>
  `);
  dialog?.querySelectorAll<HTMLElement>("[data-partner]").forEach((button) => {
    button.addEventListener("click", () => {
      const partnerId = button.dataset.partner;
      if (partnerId !== undefined && data.session !== null) {
        updateCurrentPlayerAbility("partner");
        data.session.partnerPlayerId = partnerId;
        cardRevealed = true;
        persist();
        dialog.close();
        render();
      }
    });
  });
}

function openCategoryDialog(): void {
  const dialog = openDialog(`
    <div class="dialog-panel">
      <button class="dialog-close" data-close-dialog aria-label="Закрыть">×</button>
      <span class="dialog-kicker">Выбор темы</span>
      <h2>Какой вопрос открыть?</h2>
      <p>Категория останется в рамках текущего этапа.</p>
      <div class="dialog-options dialog-options-categories">
        ${CATEGORIES.map((category) => `<button data-category="${category}">${categoryNames[category]}</button>`).join("")}
      </div>
    </div>
  `);
  dialog?.querySelectorAll<HTMLElement>("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.category;
      if (category !== undefined && isCategoryValue(category)) {
        updateCurrentPlayerAbility("chooseCategory");
        drawForCurrent(category);
        persist();
        dialog.close();
        render();
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
  const nextIndex = session.currentPlayerIndex + 1;
  if (nextIndex >= session.players.length) {
    session.currentPlayerIndex = 0;
    session.round += 1;
    session.currentCardId = null;
    session.alternativeCardIds = [];
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
  const upcoming = nextStage(session.stage);
  const completedRound = Math.max(1, session.round - 1);
  renderShell(`
    <section class="checkpoint" aria-labelledby="checkpoint-title">
      <div class="checkpoint-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="section-kicker">Полный круг завершён</p>
      <h1 id="checkpoint-title">Все успели сказать своё</h1>
      <p>${stageNames[session.stage]}, круг ${completedRound}. Можно задержаться здесь или мягко сменить настроение.</p>
      <div class="checkpoint-actions">
        <button class="button button-secondary button-large" data-action="more-round">Ещё круг</button>
        ${upcoming === null
          ? '<button class="button button-primary button-large" data-action="finish-game">Завершить вечер</button>'
          : `<button class="button button-primary button-large" data-action="next-stage">Дальше: ${stageNames[upcoming]}</button>`}
      </div>
      <div class="checkpoint-stage-row">${renderStageRail(session.stage)}</div>
    </section>
  `, { compactHeader: true });
  root.querySelector<HTMLElement>("[data-action='more-round']")?.addEventListener("click", () => {
    drawForCurrent();
    screen = "game";
    render();
  });
  root.querySelector<HTMLElement>("[data-action='next-stage']")?.addEventListener("click", () => {
    const next = nextStage(session.stage);
    if (next !== null) {
      session.stage = next;
      session.round = 1;
      session.currentPlayerIndex = 0;
      drawForCurrent();
      screen = "game";
      persist();
      render();
    }
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
      <div class="finish-light" aria-hidden="true"></div>
      <p class="section-kicker">Круг замкнулся</p>
      <h1 id="finish-title">Спасибо за настоящий вечер</h1>
      <p>Напоследок каждый может назвать одну вещь, которую сегодня узнал о другом человеке.</p>
      <div class="finish-people">
        ${session.players.map((player) => `<span>${escapeHtml(player.name)}</span>`).join("")}
      </div>
      <div class="finish-actions">
        <button class="button button-primary button-large" data-action="same-group">Сыграть ещё</button>
        <button class="button button-secondary button-large" data-action="finish-home">На главную</button>
      </div>
    </section>
  `, { compactHeader: true });
  root.querySelector<HTMLElement>("[data-action='same-group']")?.addEventListener("click", () => {
    draftNames = session.players.map((player) => player.name);
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
        <p class="section-kicker">Локальная колода</p>
        <h1 id="editor-title">Вопросы вашего круга</h1>
        <p>Свои карточки остаются только в этом браузере. Встроенную колоду можно скрывать, но исходный текст не изменяется.</p>
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
    screen = returnScreen === "editor" || returnScreen === "settings" ? "welcome" : returnScreen;
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
        <label class="setting-row"><span><strong>Звуковой сигнал</strong><small>Тихий тон по завершении времени.</small></span><input name="sound" type="checkbox" ${data.preferences.soundEnabled ? "checked" : ""} /></label>
        <label class="setting-row"><span><strong>Плавные переходы</strong><small>Можно отключить вместе с декоративным движением.</small></span><input name="motion" type="checkbox" ${data.preferences.motionEnabled ? "checked" : ""} /></label>
        <button class="button button-primary" type="submit">Сохранить</button>
      </form>
      <div class="data-panel">
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
      draftNames = ["", "", "", "", "", ""];
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
