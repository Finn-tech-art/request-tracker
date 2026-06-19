import authService from "../services/authService.js";

export function initializeAuthPage() {
	// Clear any existing session when visiting the login page
	try { authService.logout(); } catch (e) { /* ignore */ }

	const form = document.getElementById('login-form');
	if (!form) return;

	form.addEventListener('submit', async (e) => {
		e.preventDefault();
		const usernameInput = document.querySelector('#email, #username, #name');
		const username = (usernameInput?.value || '').trim();
		const password = (document.getElementById('password')?.value || '');
		if (!username || !password) {
			alert('Please provide username and password');
			return;
		}

		// Use remote auth API for login (server-side authentication).
		// Prefer window.APP_CONFIG.AUTH_API_URL, otherwise try the local Python service at http://localhost:8000
		const defaultLocal = 'http://localhost:8000';
		const remote = (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.AUTH_API_URL)
			? window.APP_CONFIG.AUTH_API_URL.replace(/\/$/, '')
			: defaultLocal;

		try {
			const res = await fetch(`${remote}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			if (res.ok) {
				const data = await res.json();
				const session = { username: data.username || username, name: data.name || '', isAdmin: !!data.isAdmin };
				authService.setSession(session);
				if (data.token) authService.setToken(data.token);
				window.location.href = './dashboard.html';
				return;
			}
			// Non-OK response (401 expected for bad creds)
			if (res.status === 401) {
				alert('Invalid username or password');
			} else {
				const txt = await res.text().catch(() => '');
				console.error('Auth server error', res.status, txt);
				alert(`Authentication server error (${res.status}). Check the auth service or APP_CONFIG.AUTH_API_URL.`);
			}
		} catch (err) {
			console.error('Remote auth error', err);
			alert(`Unable to contact auth server at ${remote}.\nRun the Python auth server (api/app.py) locally or set APP_CONFIG.AUTH_API_URL to your deployed service.`);
		}
	});
}

