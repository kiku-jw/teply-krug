import { expect, test } from "@playwright/test";

async function startGame(page: import("@playwright/test").Page, count = 6): Promise<void> {
  await page.goto("./");
  await page.getByRole("button", { name: "Собрать круг" }).click();
  const inputs = page.locator("[data-player-name]");
  for (let index = 0; index < count; index += 1) {
    if (index >= 6) {
      await page.getByRole("button", { name: "Добавить имя" }).click();
    }
    await inputs.nth(index).fill(`Игрок ${index + 1}`);
  }
  await page.getByRole("button", { name: "Начать игру" }).click();
  await expect(page.getByRole("heading", { name: "Игрок 1" })).toBeVisible();
}

test("host starts a six-player circle and advances in order", async ({ page }) => {
  await startGame(page);
  await page.getByRole("button", { name: "Открыть вопрос" }).click();
  await expect(page.locator(".question-card")).toBeVisible();
  await page.getByRole("button", { name: "Готово. Дальше" }).click();
  await expect(page.getByRole("heading", { name: "Игрок 2" })).toBeVisible();
});

test("full circle reaches a checkpoint and can change stage", async ({ page }) => {
  await startGame(page, 12);
  for (let index = 0; index < 12; index += 1) {
    await page.getByRole("button", { name: "Открыть вопрос" }).click();
    await page.getByRole("button", { name: "Готово. Дальше" }).click();
  }
  await expect(page.getByRole("heading", { name: "Все успели сказать своё" })).toBeVisible();
  await page.getByRole("button", { name: "Дальше: Ближе" }).click();
  await expect(page.locator(".stage-step.stage-active")).toContainText("Ближе");
  await expect(page.getByRole("heading", { name: "Игрок 1" })).toBeVisible();
});

test("replace ability is one-use and survives reload", async ({ page }) => {
  await startGame(page);
  const replace = page.getByRole("button", { name: /Перезагрузка/ });
  await replace.click();
  await expect(replace).toBeDisabled();
  await page.reload();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("heading", { name: "Игрок 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Перезагрузка/ })).toBeDisabled();
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

  await page.getByLabel("Поиск").fill("маленький повод");
  const builtIn = page.locator(".library-card").filter({ hasText: "Какой маленький повод недавно сделал твой день лучше?" });
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

  await page.getByRole("button", { name: /Напарник/ }).click();
  await page.getByRole("button", { name: "Игрок 2", exact: true }).click();
  await expect(page.getByText("Вместе с Игрок 2")).toBeVisible();

  await page.getByRole("button", { name: /Совет круга/ }).click();
  await expect(page.getByText("Круг помогает идеями")).toBeVisible();

  await page.getByRole("button", { name: /Два пути/ }).click();
  await expect(page.getByText("Выбери один вопрос")).toBeVisible();
  await page.locator("[data-choose-card]").first().click();

  await page.getByRole("button", { name: /Выбор темы/ }).click();
  await page.getByRole("button", { name: "Библия", exact: true }).click();
  await page.getByRole("button", { name: "Открыть вопрос" }).click();
  await expect(page.locator(".question-card .card-meta")).toContainText("Библия");
});

test("soft timer reaches zero without advancing the turn", async ({ page }) => {
  await page.clock.install();
  await startGame(page);
  await page.getByRole("button", { name: "Открыть вопрос" }).click();
  await page.clock.runFor("00:01:16");
  await expect(page.locator("#timer-display")).toHaveText("0:00");
  await expect(page.getByRole("heading", { name: "Игрок 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Готово. Дальше" })).toBeEnabled();
});

test("the third stage completes on the final screen", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    const raw = localStorage.getItem("teply-krug:v1");
    if (raw === null) {
      return;
    }
    const stored = JSON.parse(raw);
    stored.session.stage = "together";
    stored.session.currentPlayerIndex = 0;
    stored.session.round = 1;
    stored.session.currentCardId = null;
    localStorage.setItem("teply-krug:v1", JSON.stringify(stored));
  });
  await page.reload();
  await page.getByRole("button", { name: "Продолжить" }).click();
  for (let index = 0; index < 6; index += 1) {
    await page.getByRole("button", { name: "Открыть вопрос" }).click();
    await page.getByRole("button", { name: "Готово. Дальше" }).click();
  }
  await page.getByRole("button", { name: "Завершить вечер" }).click();
  await expect(page.getByRole("heading", { name: "Спасибо за настоящий вечер" })).toBeVisible();
});
