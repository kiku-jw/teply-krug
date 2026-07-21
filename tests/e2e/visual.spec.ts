import { expect, test } from "@playwright/test";

test("captures the welcome composition", async ({ page }, testInfo) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Поиграем вместе?" })).toBeVisible();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBe(viewportWidth);
  await page.waitForTimeout(900);
  await page.screenshot({ path: testInfo.outputPath("welcome.png"), fullPage: true });
});

test("captures a revealed game card", async ({ page }, testInfo) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Собрать круг" }).click();
  const names = ["Аня", "Борис", "Вера", "Глеб", "Даша", "Егор"];
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    if (name !== undefined) {
      await page.locator("[data-player-name]").nth(index).fill(name);
    }
  }
  await page.getByRole("button", { name: "Начать игру" }).click();
  await page.getByRole("button", { name: "Открыть вопрос" }).click();
  await expect(page.locator(".question-card")).toBeVisible();
  await page.waitForTimeout(750);
  await page.screenshot({ path: testInfo.outputPath("game.png"), fullPage: true });
});

test("captures the 1440 by 900 presentation viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One Chromium project is enough for this fixed viewport.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Поиграем вместе?" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.waitForTimeout(900);
  await page.screenshot({ path: testInfo.outputPath("welcome-1440.png"), fullPage: true });
});
