'use strict';

// ── Firebase mock ─────────────────────────────────────────────────────────────
// Replaces firebase-auth.js entirely. Sets up window.authHeaders and calls
// window.onAuthReady with a fake user so the planner loads without Google OAuth.
const FIREBASE_AUTH_MOCK = `
(function () {
  const mockUser = {
    uid:         'test-uid-playwright',
    displayName: 'Test User',
    email:       'test@playwright.local',
    photoURL:    null,
  };

  window.authHeaders = async function () {
    return {
      'Content-Type':  'application/json',
      'Authorization': 'Bearer mock-playwright-token',
    };
  };
  window.getIdToken  = () => Promise.resolve('mock-playwright-token');
  window.fbSignIn    = () => Promise.resolve();
  window.fbSignOut   = () => Promise.resolve();

  const area = document.getElementById('authArea');
  if (area) area.innerHTML = '<span style="font-size:11px;opacity:.5">TEST USER</span>';

  setTimeout(function () {
    if (typeof window.onAuthReady === 'function') window.onAuthReady(mockUser);
  }, 0);
})();
`;

// ── In-memory API mock ────────────────────────────────────────────────────────
function createApiMock() {
  const tasksDb = {};
  const reflDb  = {};
  let   nextId  = 1000;
  const UID     = 'test-uid-playwright';

  return {
    tasksDb,
    reflDb,

    clear() {
      Object.keys(tasksDb).forEach(k => delete tasksDb[k]);
      Object.keys(reflDb).forEach(k => delete reflDb[k]);
    },

    handleTasks(method, urlStr, body) {
      const qs   = new URLSearchParams(urlStr.split('?')[1] || '');
      const date = qs.get('date');
      const id   = qs.get('id') ? parseInt(qs.get('id')) : null;

      if (method === 'GET') {
        if (qs.get('heatmap')) {
          const counts = {};
          Object.values(tasksDb).forEach(t => {
            if (!counts[t.date]) counts[t.date] = { total: 0, done: 0, pending: 0 };
            counts[t.date].total++;
            if (t.completed) counts[t.date].done++;
            else             counts[t.date].pending++;
          });
          return { status: 200, body: counts };
        }
        const tasks = Object.values(tasksDb)
          .filter(t => t.user_id === UID && t.date === date)
          .sort((a, b) => a.hour - b.hour);
        return { status: 200, body: tasks };
      }

      if (method === 'POST') {
        const { date: d, hour, task_text, category = 'general', priority = 'normal' } = body || {};
        const key = `${UID}:${d}:${hour}`;
        if (tasksDb[key]) return { status: 409, body: { error: 'Hour already has a task' } };
        const task = { task_id: nextId++, user_id: UID, date: d, hour, task_text, category, priority, completed: false };
        tasksDb[key] = task;
        return { status: 201, body: task };
      }

      if (method === 'PATCH') {
        const task = Object.values(tasksDb).find(t => t.task_id === id && t.user_id === UID);
        if (!task) return { status: 404, body: { error: 'Not found' } };
        if (body.task_text !== undefined) task.task_text = body.task_text;
        if (body.category  !== undefined) task.category  = body.category;
        if (body.priority  !== undefined) task.priority  = body.priority;
        if (body.completed !== undefined) task.completed = Boolean(body.completed);
        return { status: 200, body: task };
      }

      if (method === 'DELETE') {
        const key = Object.keys(tasksDb).find(k => tasksDb[k].task_id === id && tasksDb[k].user_id === UID);
        if (!key) return { status: 404, body: { error: 'Not found' } };
        delete tasksDb[key];
        return { status: 204, body: null };
      }

      return { status: 405, body: { error: 'Method not allowed' } };
    },

    handleReflections(method, urlStr, body) {
      const qs   = new URLSearchParams(urlStr.split('?')[1] || '');
      const date = (method === 'GET' ? qs.get('date') : null) || (body && body.date);
      const key  = `${UID}:${date}`;

      if (method === 'GET') {
        return { status: 200, body: reflDb[key] || null };
      }

      if (method === 'POST') {
        if (!reflDb[key]) {
          reflDb[key] = { user_id: UID, date, grade: null, focus: 0, energy: 0, mood: 0, wins: '', fix: '', learn: '' };
        }
        const r = reflDb[key];
        if (body.grade  !== undefined) r.grade  = body.grade;
        if (body.focus  !== undefined) r.focus  = body.focus;
        if (body.energy !== undefined) r.energy = body.energy;
        if (body.mood   !== undefined) r.mood   = body.mood;
        if (body.wins   !== undefined) r.wins   = body.wins;
        if (body.fix    !== undefined) r.fix    = body.fix;
        if (body.learn  !== undefined) r.learn  = body.learn;
        return { status: 200, body: r };
      }

      return { status: 405, body: { error: 'Method not allowed' } };
    },
  };
}

// ── Main setup ────────────────────────────────────────────────────────────────
async function setupPage(page) {
  const apiMock = createApiMock();

  // Block Firebase CDN scripts (not needed with our auth mock)
  await page.route('**/firebasejs/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );

  // Replace firebase-auth.js with our lightweight mock
  await page.route('**/firebase-auth.js', route =>
    route.fulfill({ contentType: 'application/javascript', body: FIREBASE_AUTH_MOCK })
  );

  // Mock tasks API
  await page.route('**/api/tasks**', async route => {
    const req    = route.request();
    const method = req.method();
    let   body   = null;
    if (['POST', 'PATCH'].includes(method)) {
      try { body = JSON.parse(req.postData() || '{}'); } catch {}
    }
    const { status, body: resp } = apiMock.handleTasks(method, req.url(), body);
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: resp === null ? '' : JSON.stringify(resp),
    });
  });

  // Mock reflections API
  await page.route('**/api/reflections**', async route => {
    const req    = route.request();
    const method = req.method();
    let   body   = null;
    if (method === 'POST') {
      try { body = JSON.parse(req.postData() || '{}'); } catch {}
    }
    const { status, body: resp } = apiMock.handleReflections(method, req.url(), body);
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: resp === null ? '' : JSON.stringify(resp),
    });
  });

  // Clear localStorage before each test
  await page.addInitScript(() => localStorage.clear());

  return apiMock;
}

// Navigate to the planner and wait until the hour grid is rendered
async function gotoPlanner(page) {
  await page.goto('/todo.html');
  await page.waitForSelector('#hourGrid', { state: 'visible', timeout: 10000 });
}

module.exports = { setupPage, gotoPlanner };
