'use strict';
const { test, expect } = require('@playwright/test');
const { setupPage, gotoPlanner } = require('../helpers/setup');

async function addTask(page, hour, text) {
  await page.locator(`.hour-row[data-hour="${hour}"] .empty-hint`).click();
  await page.locator(`#ti-${hour}`).fill(text);
  await page.locator(`#ti-${hour}`).blur();
  await page.waitForSelector(`.hour-row[data-hour="${hour}"] .task-text`, { timeout: 5000 });
}

// Stats are in a .stats-row inside #pane-today, rendered as .stat-box children
const stat = (page, n) =>
  page.locator(`#pane-today .stat-box:nth-child(${n}) .stat-num`);

test.describe('Analytics – TODAY tab', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('analytics section is visible', async ({ page }) => {
    await expect(page.locator('#analyticsSection')).toBeVisible();
  });

  test('TODAY tab is active by default', async ({ page }) => {
    await expect(page.locator('.atab[data-tab="today"]')).toHaveClass(/active/);
    await expect(page.locator('#pane-today')).toBeVisible();
  });

  test('initial done stat is 0/0', async ({ page }) => {
    await expect(stat(page, 1)).toHaveText('0/0');
  });

  test('initial completion is 0%', async ({ page }) => {
    await expect(stat(page, 2)).toHaveText('0%');
  });

  test('initial grade is —', async ({ page }) => {
    await expect(stat(page, 3)).toHaveText('—');
  });

  test('adding a task updates done stat to 0/1', async ({ page }) => {
    await addTask(page, 9, 'First task');
    await expect(stat(page, 1)).toHaveText('0/1');
    await expect(stat(page, 2)).toHaveText('0%');
  });

  test('completing a task updates done stat to 1/1 and completion to 100%', async ({ page }) => {
    await addTask(page, 9, 'Completable task');
    await page.locator('.hour-row[data-hour="9"] .btn-check').click();
    await page.waitForTimeout(150);
    await expect(stat(page, 1)).toHaveText('1/1');
    await expect(stat(page, 2)).toHaveText('100%');
  });

  test('multiple tasks update stats correctly', async ({ page }) => {
    await addTask(page, 9,  'Task A');
    await addTask(page, 10, 'Task B');
    await addTask(page, 11, 'Task C');
    await page.locator('.hour-row[data-hour="9"] .btn-check').click();
    await page.waitForTimeout(150);
    await expect(stat(page, 1)).toContainText('1/3');
    await expect(stat(page, 2)).toContainText('33%');
  });

  test('grade stat updates after clicking a grade pill', async ({ page }) => {
    await page.locator('.grade-pill[data-grade="A"]').click();
    await page.waitForTimeout(300);
    await expect(stat(page, 3)).toHaveText('A');
  });

  test('focus stat shows after clicking a dot', async ({ page }) => {
    await page.locator('.rating-row[data-key="focus"] .dot-btn').nth(3).click();
    await page.waitForTimeout(300);
    await expect(stat(page, 4)).toHaveText('4');
  });

  test('energy stat shows after clicking a dot', async ({ page }) => {
    await page.locator('.rating-row[data-key="energy"] .dot-btn').nth(2).click();
    await page.waitForTimeout(300);
    await expect(stat(page, 5)).toHaveText('3');
  });

  test('mood stat shows after clicking a dot', async ({ page }) => {
    await page.locator('.rating-row[data-key="mood"] .dot-btn').nth(4).click();
    await page.waitForTimeout(300);
    await expect(stat(page, 6)).toHaveText('5');
  });

  test('"By category" bar appears after adding a task', async ({ page }) => {
    await addTask(page, 9, 'Category bar task');
    await expect(page.locator('#pane-today .cat-bar-row')).toBeVisible();
  });

  test('deleting the only task resets stats to 0/0', async ({ page }) => {
    await addTask(page, 9, 'Temp task');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await page.locator('.hour-row[data-hour="9"] .btn-del').click();
    await page.waitForTimeout(150);
    await expect(stat(page, 1)).toHaveText('0/0');
  });
});

test.describe('Analytics – tab switching', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('THIS WEEK tab shows #pane-week', async ({ page }) => {
    await page.locator('.atab[data-tab="week"]').click();
    await expect(page.locator('#pane-week')).toBeVisible();
    await expect(page.locator('#pane-today')).not.toBeVisible();
  });

  test('28 DAYS tab shows #pane-month', async ({ page }) => {
    await page.locator('.atab[data-tab="month"]').click();
    await expect(page.locator('#pane-month')).toBeVisible();
    await expect(page.locator('#pane-today')).not.toBeVisible();
  });

  test('switching back to TODAY restores #pane-today', async ({ page }) => {
    await page.locator('.atab[data-tab="week"]').click();
    await page.locator('.atab[data-tab="today"]').click();
    await expect(page.locator('#pane-today')).toBeVisible();
  });

  test('THIS WEEK tab renders 7 day labels', async ({ page }) => {
    await page.locator('.atab[data-tab="week"]').click();
    await expect(page.locator('#pane-week .week-lbl')).toHaveCount(7);
  });
});
