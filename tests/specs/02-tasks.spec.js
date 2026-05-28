'use strict';
const { test, expect } = require('@playwright/test');
const { setupPage, gotoPlanner } = require('../helpers/setup');

// ── Helpers ───────────────────────────────────────────────────────────────────

async function addTask(page, hour, text, category = 'general') {
  await page.locator(`.hour-row[data-hour="${hour}"] .empty-hint`).click();
  if (category !== 'general') {
    await page.locator(`#cs-${hour}`).selectOption(category);
  }
  await page.locator(`#ti-${hour}`).fill(text);
  // blur() moves focus to body (outside the row), triggering the 200ms save timeout
  await page.locator(`#ti-${hour}`).blur();
  await page.waitForSelector(`.hour-row[data-hour="${hour}"] .task-text`, { timeout: 5000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Tasks – create', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('24 hour rows are rendered', async ({ page }) => {
    await expect(page.locator('.hour-row')).toHaveCount(24);
  });

  test('every hour row shows "+ add task" hint', async ({ page }) => {
    await expect(page.locator('.empty-hint')).toHaveCount(24);
  });

  test('clicking "+ add task" opens the task input', async ({ page }) => {
    await page.locator('.hour-row[data-hour="9"] .empty-hint').click();
    await expect(page.locator('#ti-9')).toBeVisible();
    await expect(page.locator('#ti-9')).toBeFocused();
  });

  test('category select and priority buttons appear while editing', async ({ page }) => {
    await page.locator('.hour-row[data-hour="9"] .empty-hint').click();
    await expect(page.locator('#cs-9')).toBeVisible();
    await expect(page.locator('#ps-9')).toBeVisible();
  });

  test('pressing Escape on empty input cancels without creating a task', async ({ page }) => {
    await page.locator('.hour-row[data-hour="9"] .empty-hint').click();
    await page.locator('#ti-9').press('Escape');
    await expect(page.locator('.hour-row[data-hour="9"] .empty-hint')).toBeVisible();
    await expect(page.locator('#gridStat')).toContainText('0 / 0');
  });

  test('typing text and blurring creates the task', async ({ page }) => {
    await page.locator('.hour-row[data-hour="9"] .empty-hint').click();
    await page.locator('#ti-9').fill('Morning standup');
    await page.locator('#ti-9').blur();
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveText('Morning standup');
  });

  test('created task shows a category badge', async ({ page }) => {
    await addTask(page, 9, 'Badge test');
    await expect(page.locator('.hour-row[data-hour="9"] .cat-badge')).toBeVisible();
    await expect(page.locator('.hour-row[data-hour="9"] .cat-badge')).toContainText('General');
  });

  test('task counter shows 0 / 1 done after adding one task', async ({ page }) => {
    await addTask(page, 9, 'Counter task');
    await expect(page.locator('#gridStat')).toContainText('0 / 1');
  });

  test('category can be changed before saving', async ({ page }) => {
    await page.locator('.hour-row[data-hour="10"] .empty-hint').click();
    await page.locator('#cs-10').selectOption('work');
    await page.locator('#ti-10').fill('Work task');
    await page.locator('#ti-10').blur();
    await expect(page.locator('.hour-row[data-hour="10"] .cat-badge')).toContainText('Work');
  });

  test('high priority shows ↑ badge after saving', async ({ page }) => {
    await page.locator('.hour-row[data-hour="11"] .empty-hint').click();
    await page.locator('.hour-row[data-hour="11"] .prio-seg-btn[data-p="high"]').click();
    await page.locator('#ti-11').fill('High priority task');
    await page.locator('#ti-11').blur();
    await expect(page.locator('.hour-row[data-hour="11"] .prio-badge.high')).toBeVisible();
  });
});

test.describe('Tasks – complete', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('clicking ✓ button marks task done and updates counter', async ({ page }) => {
    await addTask(page, 9, 'Complete me');
    await page.locator('.hour-row[data-hour="9"] .btn-check').click();
    await expect(page.locator('#gridStat')).toContainText('1 / 1');
  });

  test('completed task text gets is-done class', async ({ page }) => {
    await addTask(page, 9, 'Done task');
    await page.locator('.hour-row[data-hour="9"] .btn-check').click();
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveClass(/is-done/);
  });

  test('clicking ✓ again un-completes the task', async ({ page }) => {
    await addTask(page, 9, 'Toggle task');
    await page.locator('.hour-row[data-hour="9"] .btn-check').click();
    await expect(page.locator('#gridStat')).toContainText('1 / 1');
    await page.locator('.hour-row[data-hour="9"] .btn-check').click();
    await expect(page.locator('#gridStat')).toContainText('0 / 1');
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).not.toHaveClass(/is-done/);
  });

  test('btn-check gets is-checked class when task is done', async ({ page }) => {
    await addTask(page, 9, 'Check class test');
    await page.locator('.hour-row[data-hour="9"] .btn-check').click();
    await expect(page.locator('.hour-row[data-hour="9"] .btn-check')).toHaveClass(/is-checked/);
  });
});

test.describe('Tasks – edit', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('clicking task text opens the edit input', async ({ page }) => {
    await addTask(page, 9, 'Editable task');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await expect(page.locator('#ti-9')).toBeVisible();
    await expect(page.locator('#ti-9')).toBeFocused();
  });

  test('edit input is pre-filled with current text', async ({ page }) => {
    await addTask(page, 9, 'Pre-filled text');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await expect(page.locator('#ti-9')).toHaveValue('Pre-filled text');
  });

  test('editing and blurring updates the task text', async ({ page }) => {
    await addTask(page, 9, 'Old text');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await page.locator('#ti-9').fill('New text');
    await page.locator('#ti-9').blur();
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveText('New text');
  });

  test('× cancel button reverts to original task text', async ({ page }) => {
    await addTask(page, 9, 'Original text');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await page.locator('#ti-9').fill('Cancelled edit');
    await page.locator('.hour-row[data-hour="9"] .btn-cancel').click();
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveText('Original text');
  });
});

test.describe('Tasks – delete', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('Del button removes the task', async ({ page }) => {
    await addTask(page, 9, 'Delete via Del button');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await page.locator('.hour-row[data-hour="9"] .btn-del').click();
    await expect(page.locator('.hour-row[data-hour="9"] .empty-hint')).toBeVisible();
    await expect(page.locator('#gridStat')).toContainText('0 / 0');
  });

  test('clearing text and blurring cancels the edit (task remains)', async ({ page }) => {
    await addTask(page, 9, 'Clear to cancel');
    await page.locator('.hour-row[data-hour="9"] .task-text').click();
    await page.locator('#ti-9').fill('');
    await page.locator('#ti-9').blur();
    // Clearing an existing task's text cancels the edit — original task is preserved
    await expect(page.locator('.hour-row[data-hour="9"] .task-text')).toHaveText('Clear to cancel');
  });
});
