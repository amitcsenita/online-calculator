// Shared Firebase Auth module — included by all pages before their own scripts.
// Requires Firebase compat SDKs to be loaded first via <script> tags.

(function () {
  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyA3JSnBasAqmQ-zFNFYxBy2vaJRnDZGl5A",
    authDomain:        "amit-tools.firebaseapp.com",
    projectId:         "amit-tools",
    storageBucket:     "amit-tools.firebasestorage.app",
    messagingSenderId: "1069987353793",
    appId:             "1:1069987353793:web:d345b04aced1f6901f3040",
  };

  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);

  const auth     = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();

  // ── Inject auth styles ──────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .auth-btn {
      font-size: 11px; font-weight: 500; letter-spacing: .08em;
      text-transform: uppercase; color: var(--accent);
      background: none; border: none; cursor: pointer; padding: 0;
      font-family: 'Geist', system-ui, sans-serif; line-height: 1;
    }
    .auth-btn:hover { text-decoration: underline; }
    .auth-user { display: flex; align-items: center; gap: 7px; }
    .auth-avatar {
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--accent); color: #fff;
      font-size: 9px; font-weight: 700; letter-spacing: 0;
      display: grid; place-items: center; text-transform: uppercase;
      overflow: hidden; flex-shrink: 0; border: 1px solid rgba(0,0,0,.08);
    }
    .auth-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .auth-name {
      font-size: 11px; font-weight: 500; color: var(--ink-2);
      letter-spacing: .01em; max-width: 90px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .auth-out {
      font-size: 10px; color: var(--muted); background: none;
      border: none; cursor: pointer; padding: 0;
      font-family: 'Geist', system-ui, sans-serif;
      letter-spacing: .08em; text-transform: uppercase;
    }
    .auth-out:hover { color: var(--accent); }
    .auth-gate {
      text-align: center; padding: 28px 16px;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
    }
    .auth-gate-msg {
      font-family: 'Instrument Serif', serif; font-style: italic;
      font-size: 18px; color: var(--ink-2);
    }
    .auth-gate-sub { font-size: 12px; color: var(--muted); margin-top: -4px; }
    .auth-gate-btn {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--ink); color: var(--paper-2);
      border: none; border-radius: 10px; padding: 10px 18px;
      font-family: 'Geist', system-ui, sans-serif;
      font-size: 13px; font-weight: 500; cursor: pointer;
      transition: background .12s; letter-spacing: .01em;
    }
    .auth-gate-btn:hover { background: #2A231D; }
    .auth-gate-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
  `;
  document.head.appendChild(style);

  // ── Public API ──────────────────────────────────────────────────────────────

  window.fbSignIn  = () => auth.signInWithPopup(provider);
  window.fbSignOut = () => auth.signOut();

  window.getIdToken = function () {
    return auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null);
  };

  window.authHeaders = async function () {
    const token = await window.getIdToken();
    return token
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };
  };

  // ── Header auth area ────────────────────────────────────────────────────────

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderAuthArea(user) {
    const area = document.getElementById('authArea');
    if (!area) return;
    if (user) {
      const initials = (user.displayName || user.email || '?')
        .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      const avatar = user.photoURL
        ? `<img src="${escHtml(user.photoURL)}" alt="" referrerpolicy="no-referrer">`
        : initials;
      area.innerHTML = `
        <div class="auth-user">
          <div class="auth-avatar">${avatar}</div>
          <span class="auth-name">${escHtml((user.displayName || user.email).split(' ')[0])}</span>
          <button class="auth-out" onclick="fbSignOut()">sign out</button>
        </div>`;
    } else {
      area.innerHTML = `<button class="auth-btn" onclick="fbSignIn()">Sign in ↗</button>`;
    }
  }

  // ── Gate helper — call on pages that need auth to function ─────────────────
  // Usage: showAuthGate(containerId)  — replaces container with a sign-in prompt

  window.showAuthGate = function (containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="auth-gate">
        <div class="auth-gate-msg">Sign in to continue</div>
        <div class="auth-gate-sub">Your data is saved to your account across devices</div>
        <button class="auth-gate-btn" onclick="fbSignIn()">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>`;
  };

  // ── Auth state listener ─────────────────────────────────────────────────────

  auth.onAuthStateChanged(function (user) {
    renderAuthArea(user);
    if (typeof window.onAuthReady === 'function') window.onAuthReady(user);
  });
})();
