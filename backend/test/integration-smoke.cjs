// Minimal black-box smoke test. Start the API and provide SENTINEL_TEST_EMAIL/PASSWORD.
const base = (process.env.SENTINEL_API_BASE_URL || 'http://127.0.0.1:3000/api/').replace(/\/$/, '') + '/';
const email = process.env.SENTINEL_TEST_EMAIL;
const password = process.env.SENTINEL_TEST_PASSWORD;
if (!email || !password) {
  console.error('Define SENTINEL_TEST_EMAIL y SENTINEL_TEST_PASSWORD para ejecutar la prueba.');
  process.exit(2);
}
(async () => {
  const health = await fetch(base + 'health');
  if (!health.ok) throw new Error('Health endpoint no disponible: ' + health.status);
  const login = await fetch(base + 'auth/login', {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({email, password})
  });
  if (!login.ok) throw new Error('Login falló: ' + login.status);
  const pair = await login.json();
  if (!pair.accessToken || !pair.refreshToken) throw new Error('Login no devolvió ambos tokens');
  const refresh = await fetch(base + 'auth/refresh', {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({refreshToken: pair.refreshToken})
  });
  if (!refresh.ok) throw new Error('Refresh falló: ' + refresh.status);
  const next = await refresh.json();
  if (!next.accessToken || !next.refreshToken) throw new Error('Refresh no devolvió ambos tokens');
  const replay = await fetch(base + 'auth/refresh', {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({refreshToken: pair.refreshToken})
  });
  if (replay.status !== 401) throw new Error('El refresh anterior debería rechazarse; estado=' + replay.status);
  const logout = await fetch(base + 'auth/logout', {
    method: 'POST', headers: {'content-type':'application/json'},
    body: JSON.stringify({refreshToken: next.refreshToken})
  });
  if (!logout.ok) throw new Error('Logout falló: ' + logout.status);
  console.log('OK: health, login, rotación, rechazo de replay y logout.');
})().catch(err => { console.error(err); process.exit(1); });
