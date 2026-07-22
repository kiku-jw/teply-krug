import { expect, test } from "@playwright/test";

async function startGame(
  page: import("@playwright/test").Page,
  count = 6,
  animated = false,
): Promise<void> {
  if (!animated) {
    await page.emulateMedia({ reducedMotion: "reduce" });
  }
  await page.goto("./");
  await page.getByRole("button", { name: "Собрать компанию" }).click();
  const inputs = page.locator("[data-player-name]");
  for (let index = 0; index < count; index += 1) {
    if (index >= 2) {
      await page.getByRole("button", { name: "Добавить имя" }).click();
    }
    await inputs.nth(index).fill(`Игрок ${index + 1}`);
  }
  await page.getByRole("button", { name: "Начать игру" }).click();
  await expect(page.getByRole("heading", { name: "Игрок 1" })).toBeVisible();
}

test("the jar ritual uses a full first draw and quick later draws", async ({ page }) => {
  await page.addInitScript(() => {
    const mutedStates: boolean[] = [];
    Object.defineProperty(window, "__jarMutedStates", { value: mutedStates });
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value(this: HTMLMediaElement) {
        mutedStates.push(this.muted);
        return Promise.resolve();
      },
    });
  });
  await page.goto("./");
  await expect(page.getByRole("button", { name: /Доставай!/ })).toBeVisible();
  await expect(page.getByText("Тёплый круг")).toHaveCount(0);

  await startGame(page, 6, true);
  await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
  const intro = page.locator("#jar-reveal-video");
  await expect(intro).toHaveAttribute("src", /question-jar-intro\.mp4$/);
  await expect(page.locator(".question-card")).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.get(window, "__jarMutedStates"))).toEqual([false]);
  await intro.evaluate((video) => video.dispatchEvent(new Event("ended")));
  await expect(page.locator(".question-card")).toBeVisible();

  await page.getByRole("button", { name: "Настройки" }).click();
  await page.getByLabel("Звуки").uncheck();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.getByRole("button", { name: "ДАЛЬШЕ", exact: true }).click();
  await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
  const quick = page.locator("#jar-reveal-video");
  await expect(quick).toHaveAttribute("src", /question-jar-quick\.mp4$/);
  await expect(page.locator(".jar-reveal-mirrored")).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, "__jarMutedStates"))).toEqual([false, true]);
  await quick.evaluate((video) => video.dispatchEvent(new Event("ended")));
  await expect(page.locator(".question-card")).toBeVisible();

  for (let drawNumber = 3; drawNumber <= 5; drawNumber += 1) {
    await page.getByRole("button", { name: "ДАЛЬШЕ", exact: true }).click();
    await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
    const repeated = page.locator("#jar-reveal-video");
    if (drawNumber === 5) {
      await expect(page.locator(".jar-reveal-lucky")).toBeVisible();
      await expect(page.locator(".paper-spark")).toHaveCount(3);
    }
    await repeated.evaluate((video) => video.dispatchEvent(new Event("ended")));
    await expect(page.locator(".question-card")).toBeVisible();
  }
});

test("two people can start a small circle", async ({ page }) => {
  await startGame(page, 2);
  for (let index = 0; index < 2; index += 1) {
    await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
    await expect(page.locator("#jar-reveal-video")).toHaveCount(0);
    await expect(page.locator(".question-card")).toBeVisible();
    await page.getByRole("button", { name: "ДАЛЬШЕ", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Все ответили" })).toBeVisible();
});

test("host starts a six-player circle and advances in order", async ({ page }) => {
  await startGame(page);
  const firstCardId = await page.evaluate(() => {
    const raw = localStorage.getItem("teply-krug:v1");
    if (raw === null) {
      return "";
    }
    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== "object" || stored === null || !("session" in stored)) {
      return "";
    }
    const session = Reflect.get(stored, "session");
    if (typeof session !== "object" || session === null) {
      return "";
    }
    const currentCardId = Reflect.get(session, "currentCardId");
    return typeof currentCardId === "string" ? currentCardId : "";
  });
  expect(firstCardId).toContain("spark-bible-");
  await expect(page.locator(".stage-rail")).toHaveCount(0);
  await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
  await expect(page.locator(".question-card")).toBeVisible();
  await expect(page.getByText("Слушаем без спешки")).toHaveCount(0);
  await expect(page.locator(".site-note")).toHaveCount(0);
  await page.getByRole("button", { name: "ДАЛЬШЕ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Игрок 2" })).toBeVisible();
});

test("full circle reaches a simple checkpoint and advances pacing automatically", async ({ page }) => {
  await startGame(page, 12);
  for (let index = 0; index < 12; index += 1) {
    await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
    await page.getByRole("button", { name: "ДАЛЬШЕ", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Все ответили" })).toBeVisible();
  await expect(page.getByText("Искра")).toHaveCount(0);
  await expect(page.getByText("Ближе")).toHaveCount(0);
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Игрок 1" })).toBeVisible();
  const secondRoundStage = await page.evaluate(() => {
    const raw = localStorage.getItem("teply-krug:v1");
    if (raw === null) {
      return "";
    }
    const stored: unknown = JSON.parse(raw);
    if (typeof stored !== "object" || stored === null || !("session" in stored)) {
      return "";
    }
    const session = Reflect.get(stored, "session");
    return typeof session === "object" && session !== null ? Reflect.get(session, "stage") : "";
  });
  expect(secondRoundStage).toBe("closer");
});

test("replace ability is one-use and survives reload", async ({ page }) => {
  await startGame(page);
  const replace = page.getByRole("button", { name: /Другой вопрос/ });
  await replace.click();
  await expect(replace).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("heading", { name: "Игрок 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Другой вопрос/ })).toBeDisabled();
});

test("host creates and edits a local card", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Колода" }).click();
  await page.getByLabel("Текст").fill("Расскажи о добром поступке друга, который ты помнишь до сих пор.");
  await page.getByRole("button", { name: "Добавить" }).click();
  await expect(page.getByText("Расскажи о добром поступке друга, который ты помнишь до сих пор.")).toBeVisible();
  await page.getByRole("button", { name: "Изменить" }).click();
  await page.getByLabel("Текст").fill("Расскажи о маленькой помощи, которую ты помнишь до сих пор.");
  await page.getByRole("button", { name: "Сохранить" }).click();
  const editedText = page.getByText("Расскажи о маленькой помощи, которую ты помнишь до сих пор.");
  await expect(editedText).toBeVisible();

  await page.getByLabel("Поиск").fill("украинское блюдо");
  const builtIn = page.locator(".library-card").filter({ hasText: "Какое украинское блюдо тебе всегда приятно видеть на столе?" });
  await builtIn.getByRole("button", { name: "Скрыть" }).click();
  await expect(builtIn.getByRole("button", { name: "Вернуть" })).toBeVisible();
  await page.getByRole("button", { name: "Вернуть скрытые (1)" }).click();
  await expect(builtIn.getByRole("button", { name: "Скрыть" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.locator(".library-card").filter({ has: editedText }).getByRole("button", { name: "Удалить" }).click();
  await expect(editedText).toHaveCount(0);
});

test("all social abilities complete their host flow", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem("teply-krug:v1");
    if (raw === null) {
      return;
    }
    const stored = JSON.parse(raw);
    stored.session.players[0].abilities = ["replace", "partner", "twoChoices", "groupHelp", "chooseCategory"];
    localStorage.setItem("teply-krug:v1", JSON.stringify(stored));
  });
  await page.reload();
  await page.getByRole("button", { name: "Продолжить" }).click();

  await expect(page.getByText("Убрать этот и взять новый. Объяснять не нужно.")).toBeVisible();
  await expect(page.getByText("Позвать любого участника отвечать вдвоём.")).toBeVisible();
  await page.getByRole("button", { name: /Вместе/ }).click();
  await page.getByRole("button", { name: "Игрок 2", exact: true }).click();
  await expect(page.getByText("Вместе с Игрок 2")).toBeVisible();

  await page.getByRole("button", { name: /Спросить всех/ }).click();
  await expect(page.getByText("Отвечает весь круг")).toBeVisible();

  await page.getByRole("button", { name: /На выбор/ }).click();
  await expect(page.getByText("Выбери вопрос")).toBeVisible();
  await page.locator("[data-choose-card]").first().click();

  await page.getByRole("button", { name: /Выбрать тему/ }).click();
  await page.getByRole("button", { name: "Библия", exact: true }).click();
  await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
  await expect(page.locator(".question-card .card-meta")).toHaveCount(0);
});

test("soft timer reaches zero without advancing the turn", async ({ page }) => {
  await page.clock.install();
  await startGame(page);
  await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
  await page.clock.runFor("00:01:16");
  await expect(page.locator("#timer-display")).toHaveText("0:00");
  await expect(page.getByRole("heading", { name: "Игрок 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ДАЛЬШЕ", exact: true })).toBeEnabled();
});

test("short sound cues follow the host setting", async ({ page }) => {
  await page.addInitScript(() => {
    const frequencies: number[] = [];
    Object.defineProperty(window, "__teplyKrugSoundFrequencies", { value: frequencies });
    class QuietAudioContext {
      currentTime = 0;
      destination = {};

      createOscillator() {
        return {
          type: "sine",
          frequency: {
            setValueAtTime(value: number) {
              frequencies.push(value);
            },
            exponentialRampToValueAtTime() {},
          },
          connect() {},
          start() {},
          stop() {},
          addEventListener(_event: string, listener: () => void) {
            listener();
          },
        };
      }

      createGain() {
        return {
          gain: {
            setValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          connect() {},
        };
      }

      close() {
        return Promise.resolve();
      }
    }
    Object.defineProperty(window, "AudioContext", { value: QuietAudioContext });
  });

  await startGame(page);
  await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
  const enabledCount = await page.evaluate(() => {
    const values = Reflect.get(window, "__teplyKrugSoundFrequencies");
    return Array.isArray(values) ? values.length : 0;
  });
  expect(enabledCount).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Настройки" }).click();
  await page.getByLabel("Звуки").uncheck();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.getByRole("button", { name: "ДАЛЬШЕ", exact: true }).click();
  const disabledCount = await page.evaluate(() => {
    const values = Reflect.get(window, "__teplyKrugSoundFrequencies");
    return Array.isArray(values) ? values.length : 0;
  });
  expect(disabledCount).toBe(enabledCount);
});

test("a completed round can finish the evening", async ({ page }) => {
  await startGame(page);
  for (let index = 0; index < 6; index += 1) {
    await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
    await page.getByRole("button", { name: "ДАЛЬШЕ", exact: true }).click();
  }
  await page.getByRole("button", { name: "Закончить", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Спасибо за вечер" })).toBeVisible();
});
