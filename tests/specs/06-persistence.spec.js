'use strict';
const { test, expect } = require('@playwright/test');
const { setupPage, gotoPlanner } = require('../helpers/setup');

// Routes survive page.reload() within the same page object, so the in-memory
// mock acts as a persistent store — exactly what these tests verify.

async function addTask(page, hour, text) {
  await page.locator(`.hour-row[data-hour="${hour}"] .empty-hint`).click();
  await page.locator(`#ti-${hour}`).fill(text);
  await page.locator(`#ti-${hour}`).blur();
  await page.waitForSelector(`.hour-row[data-hour="${hour}"] .task-text`, { timeout: 5000 });
}

async function waitSaved(page) {
  await expect(page.locator('#reflectStatus')).toContainText('saved', { timeout: 5000 });
}

async function reload(page) {
  await page.reload();
  await page.waitForSelector('#hourGrid', { state: 'visible', timeout: 10000 });
}

test.describe('Persistence – tasks', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('task is visible after page reload', async ({ page }) => {
    await addTask(page, 9, 'Persistent task');
    await reload(page);
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveText('Persistent task');
  });

  test('completed task remains done after reload', async ({ page }) => {
    await addTask(page, 9, 'Complete persist');
    await page.locator('.hour-row[data-hour="9"] .btn-check').click();
    await page.waitForTimeout(300);
    await reload(page);
    await expect(page.locator('#gridStat')).toContainText('1 / 1');
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveClass(/is-done/);
  });

  test('edited task text persists after reload', async ({ page }) => {
    await addTask(page, 9, 'Before edit');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await page.locator('#ti-9').fill('After edit');
    await page.locator('#ti-9').blur();
    await page.waitForTimeout(300);
    await reload(page);
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveText('After edit');
  });

  test('deleted task does not reappear after reload', async ({ page }) => {
    await addTask(page, 9, 'Will be deleted');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await page.locator('.hour-row[data-hour="9"] .btn-del').click();
    await page.waitForTimeout(300);
    await reload(page);
    await expect(page.locator('.hour-row[data-hour="9"] .empty-hint')).toBeVisible();
  });

  test('multiple tasks all persist after reload', async ({ page }) => {
    await addTask(page, 9,  'Task at 9');
    await addTask(page, 14, 'Task at 14');
    await addTask(page, 20, 'Task at 20');
    await reload(page);
    await expect(page.locator('.hour-row[data-hour="9"]  .task-text')).toHaveText('Task at 9');
    await expect(page.locator('.hour-row[data-hour="14"] .task-text')).toHaveText('Task at 14');
    await expect(page.locator('.hour-row[data-hour="20"] .task-text')).toHaveText('Task at 20');
  });

  test('navigating to another day and back keeps today\'s tasks', async ({ page }) => {
    await addTask(page, 9, 'Stay-on-today task');
    await page.locator('#prevDay').click();
    await page.waitForTimeout(200);
    await page.locator('#nextDay').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveText('Stay-on-today task');
  });
});

test.describe('Persistence – reflection', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('grade persists after reload', async ({ page }) => {
    await page.locator('.grade-pill[data-grade="B"]').click();
    await waitSaved(page);
    await reload(page);
    await expect(page.locator('.grade-pill[data-grade="B"]')).toHaveClass(/active/);
  });

  test('Wins text persists after reload', async ({ page }) => {
    await page.locator('textarea[data-key="wins"]').fill('Great day!');
    await page.locator('textarea[data-key="wins"]').blur();
    await waitSaved(page);
    await reload(page);
    await expect(page.locator('textarea[data-key="wins"]')).toHaveValue('Great day!');
  });

  test('Could be better text persists after reload', async ({ page }) => {
    await page.locator('textarea[data-key="fix"]').fill('Too scattered');
    await page.locator('textarea[data-key="fix"]').blur();
    await waitSaved(page);
    await reload(page);
    await expect(page.locator('textarea[data-key="fix"]')).toHaveValue('Too scattered');
  });

  test('Lessons & notes text persists after reload', async ({ page }) => {
    await page.locator('textarea[data-key="learn"]').fill('Ship first');
    await page.locator('textarea[data-key="learn"]').blur();
    await waitSaved(page);
    await reload(page);
    await expect(page.locator('textarea[data-key="learn"]')).toHaveValue('Ship first');
  });

  test('all three textareas persist independently after reload', async ({ page }) => {
    await page.locator('textarea[data-key="wins"]').fill('Win text');
    await page.locator('textarea[data-key="wins"]').blur();
    await waitSaved(page);
    await page.locator('textarea[data-key="fix"]').fill('Fix text');
    await page.locator('textarea[data-key="fix"]').blur();
    await waitSaved(page);
    await page.locator('textarea[data-key="learn"]').fill('Learn text');
    await page.locator('textarea[data-key="learn"]').blur();
    await waitSaved(page);
    await reload(page);
    await expect(page.locator('textarea[data-key="wins"]')).toHaveValue('Win text');
    await expect(page.locator('textarea[data-key="fix"]')).toHaveValue('Fix text');
    await expect(page.locator('textarea[data-key="learn"]')).toHaveValue('Learn text');
  });

  test('focus rating persists after reload', async ({ page }) => {
    await page.locator('.rating-row[data-key="focus"] .dot-btn').nth(3).click(); // 4/5
    await waitSaved(page);
    await reload(page);
    const dots = page.locator('.rating-row[data-key="focus"] .dot-btn');
    for (let i = 0; i < 4; i++) await expect(dots.nth(i)).toHaveClass(/filled/);
    await expect(dots.nth(4)).not.toHaveClass(/filled/);
  });
});
