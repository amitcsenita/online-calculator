'use strict';
const { test, expect } = require('@playwright/test');
const { setupPage, gotoPlanner } = require('../helpers/setup');

async function addTask(page, hour, text, category = 'general') {
  await page.locator(`.hour-row[data-hour="${hour}"] .empty-hint`).click();
  if (category !== 'general') await page.locator(`#cs-${hour}`).selectOption(category);
  await page.locator(`#ti-${hour}`).fill(text);
  await page.locator(`#ti-${hour}`).blur();
  await page.waitForSelector(`.hour-row[data-hour="${hour}"] .task-text`, { timeout: 5000 });
}

function row(page, hour) {
  return page.locator(`.hour-row[data-hour="${hour}"]`);
}

test.describe('Filters – hours', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('"All" pill is active by default', async ({ page }) => {
    await expect(page.locator('.f-pill[data-hr="all"]')).toHaveClass(/active/);
  });

  test('"All" shows all 24 hour rows', async ({ page }) => {
    await expect(page.locator('.hour-row:not(.filtered-out)')).toHaveCount(24);
  });

  test('"6–22" hides rows before 6:00 and after 22:00', async ({ page }) => {
    await page.locator('.f-pill[data-hr="day"]').click();
    await expect(row(page, 0)).toHaveClass(/filtered-out/);
    await expect(row(page, 5)).toHaveClass(/filtered-out/);
    await expect(row(page, 23)).toHaveClass(/filtered-out/);
    await expect(row(page, 9)).not.toHaveClass(/filtered-out/);
  });

  test('"9–18" hides rows outside that range', async ({ page }) => {
    await page.locator('.f-pill[data-hr="working"]').click();
    await expect(row(page, 8)).toHaveClass(/filtered-out/);
    await expect(row(page, 19)).toHaveClass(/filtered-out/);
    await expect(row(page, 9)).not.toHaveClass(/filtered-out/);
    await expect(row(page, 18)).not.toHaveClass(/filtered-out/);
  });

  test('"Morning" shows 6–11 only', async ({ page }) => {
    await page.locator('.f-pill[data-hr="morning"]').click();
    await expect(row(page, 5)).toHaveClass(/filtered-out/);
    await expect(row(page, 12)).toHaveClass(/filtered-out/);
    await expect(row(page, 6)).not.toHaveClass(/filtered-out/);
    await expect(row(page, 11)).not.toHaveClass(/filtered-out/);
  });

  test('"Afternoon" shows 12–17 only', async ({ page }) => {
    await page.locator('.f-pill[data-hr="afternoon"]').click();
    await expect(row(page, 11)).toHaveClass(/filtered-out/);
    await expect(row(page, 18)).toHaveClass(/filtered-out/);
    await expect(row(page, 12)).not.toHaveClass(/filtered-out/);
    await expect(row(page, 17)).not.toHaveClass(/filtered-out/);
  });

  test('"Evening" shows 18–23 only', async ({ page }) => {
    await page.locator('.f-pill[data-hr="evening"]').click();
    await expect(row(page, 17)).toHaveClass(/filtered-out/);
    await expect(row(page, 18)).not.toHaveClass(/filtered-out/);
    await expect(row(page, 23)).not.toHaveClass(/filtered-out/);
  });

  test('clicking the "All" pill restores all 24 rows after a filter', async ({ page }) => {
    await page.locator('.f-pill[data-hr="morning"]').click();
    await expect(page.locator('.f-pill[data-hr="all"]')).not.toHaveClass(/active/);
    await page.locator('.f-pill[data-hr="all"]').click();
    await expect(page.locator('.hour-row:not(.filtered-out)')).toHaveCount(24);
    await expect(page.locator('.f-pill[data-hr="all"]')).toHaveClass(/active/);
  });
});

test.describe('Filters – category', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('category filter pills are rendered in #catPills', async ({ page }) => {
    const pills = page.locator('#catPills .f-pill');
    await expect(pills.first()).toBeVisible();
  });

  test('filtering by Work hides tasks of other categories', async ({ page }) => {
    await addTask(page, 9,  'Work task',     'work');
    await addTask(page, 10, 'Personal task', 'personal');

    await page.locator('#catPills .f-pill[data-cf="work"]').click();

    await expect(page.locator('.hour-row[data-hour="9"]')).not.toHaveClass(/filtered-out/);
    await expect(page.locator('.hour-row[data-hour="10"]')).toHaveClass(/filtered-out/);
  });

  test('filtering by Personal hides Work tasks', async ({ page }) => {
    await addTask(page, 9,  'Work task',     'work');
    await addTask(page, 10, 'Personal task', 'personal');

    await page.locator('#catPills .f-pill[data-cf="personal"]').click();

    await expect(page.locator('.hour-row[data-hour="10"]')).not.toHaveClass(/filtered-out/);
    await expect(page.locator('.hour-row[data-hour="9"]')).toHaveClass(/filtered-out/);
  });

  test('clicking active category filter again clears it', async ({ page }) => {
    await addTask(page, 9,  'Work task',     'work');
    await addTask(page, 10, 'Personal task', 'personal');

    await page.locator('#catPills .f-pill[data-cf="work"]').click();
    await page.locator('#catPills .f-pill[data-cf="work"]').click();

    await expect(page.locator('.hour-row[data-hour="9"]')).not.toHaveClass(/filtered-out/);
    await expect(page.locator('.hour-row[data-hour="10"]')).not.toHaveClass(/filtered-out/);
  });

  test('multiple category filters can be active at once', async ({ page }) => {
    await addTask(page, 9,  'Work task',    'work');
    await addTask(page, 10, 'Health task',  'health');
    await addTask(page, 11, 'General task', 'general');

    await page.locator('#catPills .f-pill[data-cf="work"]').click();
    await page.locator('#catPills .f-pill[data-cf="health"]').click();

    await expect(page.locator('.hour-row[data-hour="9"]')).not.toHaveClass(/filtered-out/);
    await expect(page.locator('.hour-row[data-hour="10"]')).not.toHaveClass(/filtered-out/);
    await expect(page.locator('.hour-row[data-hour="11"]')).toHaveClass(/filtered-out/);
  });
});

test.describe('Filters – priority', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('priority filter pills are rendered', async ({ page }) => {
    await expect(page.locator('.f-pill[data-pf="high"]')).toBeVisible();
    await expect(page.locator('.f-pill[data-pf="normal"]')).toBeVisible();
    await expect(page.locator('.f-pill[data-pf="low"]')).toBeVisible();
  });

  test('filtering by High hides normal/low tasks', async ({ page }) => {
    // Add a high-priority task
    await page.locator('.hour-row[data-hour="9"] .empty-hint').click();
    await page.locator('.hour-row[data-hour="9"] .prio-seg-btn[data-p="high"]').click();
    await page.locator('#ti-9').fill('High task');
    await page.locator('#ti-9').blur();
    await page.waitForTimeout(300);

    // Add a normal task
    await addTask(page, 10, 'Normal task');

    await page.locator('.f-pill[data-pf="high"]').click();

    await expect(page.locator('.hour-row[data-hour="9"]')).not.toHaveClass(/filtered-out/);
    await expect(page.locator('.hour-row[data-hour="10"]')).toHaveClass(/filtered-out/);
  });
});

test.describe('Filters – empty state', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('gridEmpty message shows when all tasks are filtered out', async ({ page }) => {
    await addTask(page, 9, 'Work task', 'work');
    // filter by personal — the work task should be hidden and empty message shown
    await page.locator('#catPills .f-pill[data-cf="personal"]').click();
    await expect(page.locator('#gridEmpty')).toBeVisible();
  });
});
