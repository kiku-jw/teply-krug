import { expect, test } from "@playwright/test";

test("captures the welcome composition", async ({ page }, testInfo) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Что сегодня попадётся?" })).toBeVisible();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBe(viewportWidth);
  await page.waitForTimeout(900);
  await page.screenshot({ path: testInfo.outputPath("welcome.png"), fullPage: true });
});

test("captures a revealed game card", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Собрать компанию" }).click();
  const names = ["Аня", "Борис", "Вера", "Глеб", "Даша", "Егор"];
  await page.getByLabel("Имена по порядку ходов").fill(names.join("\n"));
  await page.getByRole("button", { name: "Начать игру" }).click();
  await expect(page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true })).toBeVisible();
  await page.waitForTimeout(550);
  await page.screenshot({ path: testInfo.outputPath("jar-cover.png"), fullPage: true });
  await page.getByRole("button", { name: "ВЫТЯНУТЬ", exact: true }).click();
  await expect(page.locator(".question-card")).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await expect(page.getByRole("button", { name: "ДАЛЬШЕ", exact: true })).toBeInViewport();
    await expect(page.getByText("Если вопрос не подходит", { exact: true })).toBeInViewport();
  }
  await page.waitForTimeout(750);
  await page.screenshot({ path: testInfo.outputPath("game.png"), fullPage: true });
  await page.getByText("Если вопрос не подходит", { exact: true }).click();
  await page.getByRole("button", { name: /Закончить вечер/ }).click();
  await expect(page.getByRole("heading", { name: "Последняя записка" })).toBeVisible();
  await page.waitForTimeout(550);
  await page.screenshot({ path: testInfo.outputPath("finish.png"), fullPage: true });
});

test("captures the 1440 by 900 presentation viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One Chromium project is enough for this fixed viewport.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Что сегодня попадётся?" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
  await page.waitForTimeout(900);
  await page.screenshot({ path: testInfo.outputPath("welcome-1440.png"), fullPage: true });
});
