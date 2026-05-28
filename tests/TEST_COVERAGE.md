# Test Coverage — Daily Planner (todo.html)

All tests are end-to-end Playwright tests that run against the real `todo.html` frontend. Firebase auth and the backend API are replaced with lightweight in-memory mocks defined in `tests/helpers/setup.js`.

---

## Test infrastructure

| What | Detail |
|---|---|
| Framework | Playwright |
| Auth mock | Replaces `firebase-auth.js` with a stub that injects a fake user (`TEST USER`) and resolves `onAuthReady` immediately |
| API mock | In-memory store wired via `page.route()`, supports full CRUD for tasks and reflections |
| Isolation | Each test gets a fresh `apiMock` instance; `localStorage` is cleared via `addInitScript` |

---

## 01 — Navigation (11 tests)

File: `tests/specs/01-navigation.spec.js`

| Test | What is verified |
|---|---|
| Header shows "Today" for current date | `#dayName` text equals "Today" on load |
| Header shows day-of-week · date | `#dateStr` contains day name, numeric date, month, year, and a `·` separator |
| Prev button navigates to Yesterday | Clicking `#prevDay` sets `#dayName` to "Yesterday" and updates `#dateStr` |
| Next from Yesterday goes back to Today | Clicking `#nextDay` after going back restores "Today" |
| Next from Today shows Tomorrow | Clicking `#nextDay` sets `#dayName` to "Tomorrow" with correct date |
| Date picker changes displayed date | Setting `#jumpDate` to a specific date updates `#dateStr` |
| Far-away dates show day name, not Today/Yesterday/Tomorrow | `#dayName` is a weekday name for dates far from today |
| Far-away dates have no `·` prefix in date string | `#dateStr` does not contain `·` for non-adjacent days |
| Yesterday date string shows `·` separator | `#dateStr` contains `·` when on Yesterday |
| Tomorrow date string shows `·` separator | `#dateStr` contains `·` when on Tomorrow |
| Auth area shows TEST USER | `#authArea` contains "TEST USER" after mock auth completes |

---

## 02 — Tasks (20 tests)

File: `tests/specs/02-tasks.spec.js`

### Create (10 tests)

| Test | What is verified |
|---|---|
| 24 hour rows are rendered | `.hour-row` count equals 24 |
| Every hour row shows "+ add task" hint | `.empty-hint` count equals 24 |
| Clicking "+ add task" opens the input | `#ti-9` is visible and focused |
| Category select and priority buttons appear while editing | `#cs-9` and `#ps-9` are visible |
| Escape on empty input cancels without creating a task | Empty hint is restored; counter shows `0 / 0` |
| Typing and blurring creates the task | `.task-text` shows the entered text |
| Created task shows a category badge | `.cat-badge` is visible and contains "General" |
| Task counter shows `0 / 1` after adding one task | `#gridStat` updates correctly |
| Category can be changed before saving | Work tasks get a "Work" badge |
| High priority shows `↑` badge after saving | `.prio-badge.high` is visible |

### Complete (4 tests)

| Test | What is verified |
|---|---|
| Clicking ✓ marks task done and updates counter | `#gridStat` shows `1 / 1` |
| Completed task text gets `is-done` class | `.task-text` has `is-done` CSS class |
| Clicking ✓ again un-completes the task | Counter reverts to `0 / 1`; `is-done` removed |
| `btn-check` gets `is-checked` class when done | `.btn-check` has `is-checked` CSS class |

### Edit (4 tests)

| Test | What is verified |
|---|---|
| Clicking task text opens the edit input | `#ti-9` visible and focused |
| Edit input is pre-filled with current text | `#ti-9` value matches existing task text |
| Editing and blurring updates the task text | `.task-text` shows new text |
| Cancel button reverts to original text | `.task-text` restores original after `btn-cancel` click |

### Delete (2 tests)

| Test | What is verified |
|---|---|
| Del button removes the task | `.empty-hint` reappears; counter shows `0 / 0` |
| Clearing text and blurring cancels the edit (task remains) | Original task text is preserved when edit is cleared |

---

## 03 — Filters (16 tests)

File: `tests/specs/03-filters.spec.js`

### Hour filters (8 tests)

| Test | What is verified |
|---|---|
| "All" pill is active by default | `.f-pill[data-hr="all"]` has `active` class |
| "All" shows all 24 rows | Non-filtered row count equals 24 |
| "6–22" hides rows before 6 and after 22 | Rows 0, 5, 23 get `filtered-out`; row 9 does not |
| "9–18" hides rows outside that range | Rows 8, 19 hidden; rows 9, 18 visible |
| "Morning" shows 6–11 only | Rows 5, 12 hidden; rows 6, 11 visible |
| "Afternoon" shows 12–17 only | Rows 11, 18 hidden; rows 12, 17 visible |
| "Evening" shows 18–23 only | Row 17 hidden; rows 18, 23 visible |
| Clicking "All" restores all 24 rows after a filter | Row count back to 24; "All" pill re-activates |

### Category filters (5 tests)

| Test | What is verified |
|---|---|
| Category filter pills are rendered | `#catPills .f-pill` is visible |
| Filtering by Work hides other categories | Work hour visible; Personal hour hidden |
| Filtering by Personal hides Work tasks | Personal hour visible; Work hour hidden |
| Clicking active filter again clears it | Both hours visible after double-click |
| Multiple category filters active at once | Work + Health visible; General hidden |

### Priority filters (2 tests)

| Test | What is verified |
|---|---|
| Priority filter pills are rendered | High, Normal, Low pills visible |
| Filtering by High hides normal/low tasks | High task visible; Normal task hidden |

### Empty state (1 test)

| Test | What is verified |
|---|---|
| `#gridEmpty` shows when all tasks filtered out | Empty message visible when category filter excludes all tasks |

---

## 04 — Reflection (19 tests)

File: `tests/specs/04-reflection.spec.js`

### Layout (5 tests)

| Test | What is verified |
|---|---|
| Reflection section is visible | `#reflectionSection` is visible |
| All three textareas are present | Wins, Fix (could-be-better), Learn textareas all visible |
| All six grade pills are present | A+, A, B, C, D, F pills all visible |
| Focus, energy, mood rating rows are present | Three `.rating-row` elements visible |
| Each rating row has exactly 5 dot buttons | 5 `.dot-btn` elements per row |

### Grade buttons (5 tests)

| Test | What is verified |
|---|---|
| Clicking a grade marks it active | Selected grade pill gets `active` class |
| Only one grade is active at a time | Previous grade loses `active` when a new one is clicked |
| Clicking the active grade deselects it | `active` class removed on second click |
| Grade click triggers save and shows saved status | `#reflectStatus` contains "saved" |
| Saved status shows HH:MM timestamp | Status matches `/saved \d{2}:\d{2}/` |

### Dot ratings (4 tests)

| Test | What is verified |
|---|---|
| Clicking dot 3 on focus fills dots 1–3 | First 3 dots have `filled`; last 2 do not |
| Clicking dot 5 on energy fills all 5 | All 5 energy dots have `filled` |
| Clicking the same dot again decrements by 1 | Dot 3 becomes unfilled; dot 2 stays filled |
| Dot click saves and shows saved status | `#reflectStatus` contains "saved" |

### Textareas (5 tests)

| Test | What is verified |
|---|---|
| Typing in Wins shows "saving…" status | `#reflectStatus` contains "saving" while typing |
| Wins saves on blur | `#reflectStatus` shows "saved" after blur |
| Could be better saves on blur | Same for the Fix textarea |
| Lessons & notes saves on blur | Same for the Learn textarea |
| All three textareas save without error | None trigger "save failed" status |

---

## 05 — Analytics (18 tests)

File: `tests/specs/05-analytics.spec.js`

### TODAY tab (14 tests)

| Test | What is verified |
|---|---|
| Analytics section is visible | `#analyticsSection` is visible |
| TODAY tab is active by default | `.atab[data-tab="today"]` has `active`; `#pane-today` visible |
| Initial done stat is `0/0` | First stat box shows `0/0` |
| Initial completion is `0%` | Second stat box shows `0%` |
| Initial grade is `—` | Third stat box shows `—` |
| Adding a task updates done stat to `0/1` | Stat box 1 shows `0/1`; completion stays `0%` |
| Completing a task updates stats to `1/1` and `100%` | Both stats update after check |
| Multiple tasks update stats correctly | 1 of 3 done → `1/3` and `33%` |
| Grade stat updates after clicking a grade pill | Stat box 3 shows selected grade |
| Focus stat shows after clicking a dot | Stat box 4 shows dot value |
| Energy stat shows after clicking a dot | Stat box 5 shows dot value |
| Mood stat shows after clicking a dot | Stat box 6 shows dot value |
| "By category" bar appears after adding a task | `.cat-bar-row` is visible |
| Deleting the only task resets stats to `0/0` | Stat box 1 returns to `0/0` after delete |

### Tab switching (4 tests)

| Test | What is verified |
|---|---|
| THIS WEEK tab shows `#pane-week` | Week pane visible; today pane hidden |
| 28 DAYS tab shows `#pane-month` | Month pane visible; today pane hidden |
| Switching back to TODAY restores `#pane-today` | Today pane visible again |
| THIS WEEK tab renders 7 day labels | `.week-lbl` count equals 7 |

---

## 06 — Persistence (12 tests)

File: `tests/specs/06-persistence.spec.js`

These tests verify that data survives `page.reload()`. The in-memory API mock acts as the persistent store across the reload.

### Tasks (6 tests)

| Test | What is verified |
|---|---|
| Task is visible after page reload | `.task-text` still shows after reload |
| Completed task remains done after reload | Counter shows `1 / 1`; `is-done` class retained |
| Edited task text persists after reload | Updated text shown after reload |
| Deleted task does not reappear after reload | `.empty-hint` shown after reload |
| Multiple tasks all persist after reload | Tasks at hours 9, 14, 20 all survive reload |
| Navigating to another day and back keeps today's tasks | Tasks unaffected by day-switch round trip |

### Reflection (6 tests)

| Test | What is verified |
|---|---|
| Grade persists after reload | Active grade pill re-selected after reload |
| Wins text persists after reload | Wins textarea value survives reload |
| Could be better text persists after reload | Fix textarea value survives reload |
| Lessons & notes text persists after reload | Learn textarea value survives reload |
| All three textareas persist independently | All three values correct after reload |
| Focus rating persists after reload | Correct number of filled dots after reload |

---

## Summary

| Spec file | Suites | Tests |
|---|---|---|
| 01-navigation | 1 | 11 |
| 02-tasks | 4 | 20 |
| 03-filters | 4 | 16 |
| 04-reflection | 4 | 19 |
| 05-analytics | 2 | 18 |
| 06-persistence | 2 | 12 |
| **Total** | **17** | **96** |

### What is NOT covered by automated tests

- Calculator tab functionality (separate feature in the same repo)
- Week and month analytics data accuracy (tab switch verified, content not)
- Priority badge display for Low priority tasks
- Mobile / narrow viewport layout
- Network error handling (API returns 4xx/5xx)
- Multiple browser / OS combinations (single browser assumed)
