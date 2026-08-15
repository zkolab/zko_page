(() => {
  'use strict';

  const allowedParents = new Set(['https://zkolab.com', 'https://www.zkolab.com']);
  let parentOrigin = '';
  try { parentOrigin = new URL(document.referrer).origin; } catch { return; }
  if (!allowedParents.has(parentOrigin) || parent === globalThis) return;

  const config = globalThis.ZKO_ACCOUNT_CONFIG;
  const sdk = globalThis.cloudbase ?? globalThis.cloudbaseBundle?.default ?? globalThis.cloudbaseBundle;
  if (!config || !sdk?.init) return;
  const app = sdk.init({ env: config.cloudbase.envId, region: config.cloudbase.region });
  const auth = app.auth({ persistence: 'local' });

  function callResult(response) {
    let value = response?.result ?? response;
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch { return null; }
    }
    return value && typeof value === 'object' ? value : null;
  }

  async function publish() {
    let user = null;
    try { user = await auth.getCurrentUser(); } catch { user = null; }
    if (!user) {
      parent.postMessage({ type: 'zko:account-profile', signedIn: false }, parentOrigin);
      return;
    }
    try {
      const response = callResult(await app.callFunction({
        name: config.functions.accountApi,
        data: { action: 'overview' },
        parse: true,
      }));
      if (!response?.ok) throw new Error('overview_failed');
      parent.postMessage({
        type: 'zko:account-profile',
        signedIn: true,
        profile: {
          username: response.account?.username || user.username || '',
          avatarUrl: response.account?.avatarUrl || '',
        },
      }, parentOrigin);
    } catch {
      parent.postMessage({ type: 'zko:account-profile', signedIn: true, profile: { username: user.username || '', avatarUrl: '' } }, parentOrigin);
    }
  }

  addEventListener('message', (event) => {
    if (event.origin === parentOrigin && event.data?.type === 'zko:account-refresh') void publish();
  });
  void publish();
})();
