'use strict';
const { test, expect } = require('@playwright/test');
const { setupPage, gotoPlanner } = require('../helpers/setup');

async function waitSaved(page) {
  await expect(page.locator('#reflectStatus')).toContainText('saved', { timeout: 5000 });
}

test.describe('Reflection – layout', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('reflection section is visible after login', async ({ page }) => {
    await expect(page.locator('#reflectionSection')).toBeVisible();
  });

  test('all three textareas are present', async ({ page }) => {
    await expect(page.locator('textarea[data-key="wins"]')).toBeVisible();
    await expect(page.locator('textarea[data-key="fix"]')).toBeVisible();
    await expect(page.locator('textarea[data-key="learn"]')).toBeVisible();
  });

  test('all six grade pills are present', async ({ page }) => {
    for (const g of ['A+', 'A', 'B', 'C', 'D', 'F']) {
      await expect(page.locator(`.grade-pill[data-grade="${g}"]`)).toBeVisible();
    }
  });

  test('focus, energy and mood rating rows are present', async ({ page }) => {
    await expect(page.locator('.rating-row[data-key="focus"]')).toBeVisible();
    await expect(page.locator('.rating-row[data-key="energy"]')).toBeVisible();
    await expect(page.locator('.rating-row[data-key="mood"]')).toBeVisible();
  });

  test('each rating row has exactly 5 dot buttons', async ({ page }) => {
    await expect(page.locator('.rating-row[data-key="focus"] .dot-btn')).toHaveCount(5);
    await expect(page.locator('.rating-row[data-key="energy"] .dot-btn')).toHaveCount(5);
    await expect(page.locator('.rating-row[data-key="mood"] .dot-btn')).toHaveCount(5);
  });
});

test.describe('Reflection – grade buttons', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('clicking a grade marks it active', async ({ page }) => {
    await page.locator('.grade-pill[data-grade="B"]').click();
    await expect(page.locator('.grade-pill[data-grade="B"]')).toHaveClass(/active/);
  });

  test('only one grade is active at a time', async ({ page }) => {
    await page.locator('.grade-pill[data-grade="A"]').click();
    await page.locator('.grade-pill[data-grade="B"]').click();
    await expect(page.locator('.grade-pill[data-grade="A"]')).not.toHaveClass(/active/);
    await expect(page.locator('.grade-pill[data-grade="B"]')).toHaveClass(/active/);
  });

  test('clicking the active grade deselects it', async ({ page }) => {
    await page.locator('.grade-pill[data-grade="A"]').click();
    await page.locator('.grade-pill[data-grade="A"]').click();
    await expect(page.locator('.grade-pill[data-grade="A"]')).not.toHaveClass(/active/);
  });

  test('grade click triggers save and shows saved status', async ({ page }) => {
    await page.locator('.grade-pill[data-grade="A+"]').click();
    await waitSaved(page);
  });

  test('saved status shows HH:MM timestamp', async ({ page }) => {
    await page.locator('.grade-pill[data-grade="C"]').click();
    await waitSaved(page);
    await expect(page.locator('#reflectStatus')).toContainText(/saved \d{2}:\d{2}/);
  });
});

test.describe('Reflection – dot ratings', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('clicking dot 3 on focus fills dots 1–3', async ({ page }) => {
    await page.locator('.rating-row[data-key="focus"] .dot-btn').nth(2).click();
    const dots = page.locator('.rating-row[data-key="focus"] .dot-btn');
    await expect(dots.nth(0)).toHaveClass(/filled/);
    await expect(dots.nth(1)).toHaveClass(/filled/);
    await expect(dots.nth(2)).toHaveClass(/filled/);
    await expect(dots.nth(3)).not.toHaveClass(/filled/);
    await expect(dots.nth(4)).not.toHaveClass(/filled/);
  });

  test('clicking dot 5 on energy fills all 5', async ({ page }) => {
    const dots = page.locator('.rating-row[data-key="energy"] .dot-btn');
    await dots.nth(4).click();
    for (let i = 0; i < 5; i++) await expect(dots.nth(i)).toHaveClass(/filled/);
  });

  test('clicking the same dot again decrements rating by 1', async ({ page }) => {
    const dots = page.locator('.rating-row[data-key="mood"] .dot-btn');
    await dots.nth(2).click(); // set to 3
    await dots.nth(2).click(); // decrement to 2
    await expect(dots.nth(2)).not.toHaveClass(/filled/);
    await expect(dots.nth(1)).toHaveClass(/filled/);
  });

  test('dot click saves and shows saved status', async ({ page }) => {
    await page.locator('.rating-row[data-key="focus"] .dot-btn').nth(3).click();
    await waitSaved(page);
  });
});

test.describe('Reflection – textareas', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('typing in Wins shows "saving…" status', async ({ page }) => {
    await page.locator('textarea[data-key="wins"]').fill('Good day');
    await expect(page.locator('#reflectStatus')).toContainText('saving', { timeout: 2000 });
  });

  test('Wins saves on blur and shows saved status', async ({ page }) => {
    await page.locator('textarea[data-key="wins"]').fill('Shipped the feature');
    await page.locator('textarea[data-key="wins"]').blur();
    await waitSaved(page);
  });

  test('Could be better saves on blur', async ({ page }) => {
    await page.locator('textarea[data-key="fix"]').fill('Too many meetings');
    await page.locator('textarea[data-key="fix"]').blur();
    await waitSaved(page);
  });

  test('Lessons & notes saves on blur', async ({ page }) => {
    await page.locator('textarea[data-key="learn"]').fill('Ship daily');
    await page.locator('textarea[data-key="learn"]').blur();
    await waitSaved(page);
  });

  test('all three textareas save without triggering error status', async ({ page }) => {
    for (const key of ['wins', 'fix', 'learn']) {
      await page.locator(`textarea[data-key="${key}"]`).fill(`Text for ${key}`);
      await page.locator(`textarea[data-key="${key}"]`).blur();
      await waitSaved(page);
      await expect(page.locator('#reflectStatus')).not.toContainText('save failed');
    }
  });
});
