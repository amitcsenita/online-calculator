'use strict';
const { test, expect } = require('@playwright/test');
const { setupPage, gotoPlanner } = require('../helpers/setup');

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await gotoPlanner(page);
  });

  test('header shows "Today" for current date', async ({ page }) => {
    await expect(page.locator('#dayName')).toHaveText('Today');
  });

  test('header shows day-of-week · date (e.g. Thursday · 28 May 2026)', async ({ page }) => {
    const dateStr = await page.locator('#dateStr').textContent();
    const today   = new Date();
    expect(dateStr).toContain(DAYS[today.getDay()]);
    expect(dateStr).toContain(`${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`);
    expect(dateStr).toContain('·');
  });

  test('prev button (#prevDay) navigates to Yesterday', async ({ page }) => {
    await page.click('#prevDay');
    await expect(page.locator('#dayName')).toHaveText('Yesterday');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await expect(page.locator('#dateStr')).toContainText(DAYS[yesterday.getDay()]);
  });

  test('next button from Yesterday goes back to Today', async ({ page }) => {
    await page.click('#prevDay');
    await expect(page.locator('#dayName')).toHaveText('Yesterday');
    await page.click('#nextDay');
    await expect(page.locator('#dayName')).toHaveText('Today');
  });

  test('next button from Today shows Tomorrow', async ({ page }) => {
    await page.click('#nextDay');
    await expect(page.locator('#dayName')).toHaveText('Tomorrow');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await expect(page.locator('#dateStr')).toContainText(DAYS[tomorrow.getDay()]);
  });

  test('date picker (#jumpDate) changes the displayed date', async ({ page }) => {
    await page.locator('#jumpDate').fill('2025-06-15');
    await page.locator('#jumpDate').dispatchEvent('change');
    await expect(page.locator('#dateStr')).toContainText('15 June 2025');
  });

  test('far-away dates show day name in header instead of Today/Yesterday/Tomorrow', async ({ page }) => {
    await page.locator('#jumpDate').fill('2020-01-01');
    await page.locator('#jumpDate').dispatchEvent('change');
    const name = await page.locator('#dayName').textContent();
    expect(DAYS).toContain(name);
    expect(['Today', 'Yesterday', 'Tomorrow']).not.toContain(name);
  });

  test('far-away dates have no · prefix in date string', async ({ page }) => {
    await page.locator('#jumpDate').fill('2020-01-01');
    await page.locator('#jumpDate').dispatchEvent('change');
    await expect(page.locator('#dateStr')).not.toContainText('·');
  });

  test('Yesterday date string shows day-of-week · date', async ({ page }) => {
    await page.click('#prevDay');
    const dateStr = await page.locator('#dateStr').textContent();
    expect(dateStr).toContain('·');
  });

  test('Tomorrow date string shows day-of-week · date', async ({ page }) => {
    await page.click('#nextDay');
    const dateStr = await page.locator('#dateStr').textContent();
    expect(dateStr).toContain('·');
  });

  test('auth area shows TEST USER when authenticated', async ({ page }) => {
    await expect(page.locator('#authArea')).toContainText('TEST USER');
  });
});
