(() => {
  'use strict';

  const config = globalThis.ZKO_ACCOUNT_CONFIG;
  const websiteHosts = new Set(['zkolab.com', 'www.zkolab.com']);
  if (config?.hostedAccountUrl && websiteHosts.has(location.hostname)) {
    const destination = new URL(config.hostedAccountUrl);
    destination.search = location.search;
    destination.hash = location.hash;
    location.replace(destination.toString());
    return;
  }
  const sdk = globalThis.cloudbase ?? globalThis.cloudbaseBundle?.default ?? globalThis.cloudbaseBundle;
  if (!config || !sdk?.init) return;

  const app = sdk.init({ env: config.cloudbase.envId, region: config.cloudbase.region });
  const auth = app.auth({ persistence: 'local' });
  const select = (selector) => document.querySelector(selector);
  const authForm = select('[data-auth-form]');
  const identifierInput = select('[data-auth-identifier]');
  const verificationStep = select('[data-verification-step]');
  const codeInput = select('[data-auth-code]');
  const sendButton = select('[data-send-code]');
  const verifyButton = select('[data-verify-code]');
  const resendButton = select('[data-resend-code]');
  const authMessage = select('[data-auth-message]');
  const authState = select('[data-auth-state]');
  const signedInSummary = select('[data-signed-in-summary]');
  const accountIdentity = select('[data-account-identity]');
  const accountAvatar = select('[data-account-avatar]');
  const dashboard = select('[data-account-dashboard]');
  const authorizeButton = select('[data-authorize-desktop]');
  const openDesktopLink = select('[data-open-desktop]');
  const desktopStatus = select('[data-desktop-status]');
  const rechargeForm = select('[data-recharge-form]');
  const rechargeButton = select('[data-recharge-submit]');
  const rechargeMessage = select('[data-recharge-message]');
  const desktopRequest = readDesktopRequest(new URLSearchParams(location.search));
  let otpVerification = null;
  let currentUser = null;
  let resendTimer = 0;
  let authorizing = false;

  function readDesktopRequest(query) {
    if (query.get('desktop') !== '1') return null;
    const state = query.get('state') || '';
    const codeChallenge = query.get('code_challenge') || '';
    const deviceInstanceHash = query.get('device') || '';
    if (
      !/^[A-Za-z0-9._~-]{32,180}$/.test(state)
      || !/^[0-9a-f]{64}$/.test(codeChallenge)
      || !/^[0-9a-f]{64}$/.test(deviceInstanceHash)
    ) return { invalid: true };
    return { state, codeChallenge, deviceInstanceHash };
  }

  function setMessage(target, message, tone = '') {
    if (!target) return;
    target.textContent = message;
    if (tone) target.dataset.tone = tone;
    else delete target.dataset.tone;
  }

  function friendlyError(error, fallback) {
    const code = String(error?.code || error?.error || error?.message || '');
    if (/frequency|limit|too_many/i.test(code)) return '验证码发送过于频繁，请稍后再试。';
    if (/invalid.*otp|verification|token/i.test(code)) return '验证码不正确或已过期，请重新输入。';
    if (/email/i.test(code)) return '请输入有效的邮箱地址。';
    return fallback;
  }

  function callResult(response) {
    let value = response?.result ?? response;
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch { return { ok: false, code: 'invalid_response' }; }
    }
    return value && typeof value === 'object' ? value : { ok: false, code: 'invalid_response' };
  }

  async function callAccountApi(data) {
    return callResult(await app.callFunction({
      name: config.functions.accountApi,
      data,
      parse: true,
    }));
  }

  function userIdentity(user) {
    return user?.email || user?.username || user?.displayName || 'ZKO 用户';
  }

  async function refreshUi({ autoHandoff = false } = {}) {
    try {
      currentUser = await auth.getCurrentUser();
    } catch {
      currentUser = null;
    }
    const signedIn = Boolean(currentUser);
    authForm.hidden = signedIn;
    signedInSummary.hidden = !signedIn;
    dashboard.hidden = !signedIn;
    authState.textContent = signedIn ? '已登录' : '未登录';
    if (!signedIn) {
      configureDesktopState();
      return;
    }

    const identity = userIdentity(currentUser);
    accountIdentity.textContent = identity;
    accountAvatar.textContent = identity.trim().slice(0, 1).toUpperCase() || 'Z';
    configureDesktopState();
    await loadOverview();
    if (autoHandoff && desktopRequest && !desktopRequest.invalid) await authorizeDesktop();
  }

  function configureDesktopState() {
    authorizeButton.hidden = true;
    openDesktopLink.hidden = true;
    if (!desktopRequest) {
      desktopStatus.textContent = '当前没有桌面端登录请求';
      return;
    }
    if (desktopRequest.invalid) {
      desktopStatus.textContent = '桌面端登录请求无效，请从 AutoClipboard 重新打开';
      return;
    }
    if (!currentUser) {
      desktopStatus.textContent = '完成邮箱验证后将自动返回 AutoClipboard';
      return;
    }
    desktopStatus.textContent = '账户已验证，正在授权 AutoClipboard……';
    authorizeButton.hidden = false;
  }

  async function loadOverview() {
    setMessage(select('[data-wallet-status]'), '正在读取账户服务……');
    try {
      const result = await callAccountApi({ action: 'overview' });
      if (!result.ok) throw new Error(result.code || 'overview_failed');
      const cents = Number(result.wallet?.balance_cents || 0);
      select('[data-wallet-balance]').textContent = `¥ ${(cents / 100).toFixed(2)}`;
      setMessage(select('[data-wallet-status]'), '余额由 CloudBase 后端保存；未登录不影响软件本地功能。');
      renderEntries(result.entries || []);
      const paymentReady = Boolean(result.payment?.configured);
      rechargeButton.disabled = !paymentReady;
      setMessage(
        rechargeMessage,
        paymentReady ? '选择金额和支付方式后继续。' : '支付宝和微信商户 API 尚未接入，当前不会创建假订单或自动入账。',
        paymentReady ? '' : 'warning',
      );
    } catch {
      setMessage(select('[data-wallet-status]'), '账户服务暂时不可用，请稍后刷新。', 'error');
      rechargeButton.disabled = true;
    }
  }

  function renderEntries(entries) {
    const list = select('[data-transaction-list]');
    list.replaceChildren();
    if (!entries.length) {
      const item = document.createElement('li');
      item.textContent = '暂无充值或消费记录';
      list.append(item);
      return;
    }
    for (const entry of entries) {
      const item = document.createElement('li');
      const amount = Number(entry.amount_cents || 0) / 100;
      const date = new Date(entry.created_at).toLocaleString('zh-CN');
      item.textContent = `${date} · ${entry.entry_type} · ${amount >= 0 ? '+' : ''}¥${amount.toFixed(2)}`;
      list.append(item);
    }
  }

  async function sendCode() {
    const email = identifierInput.value.trim().toLowerCase();
    if (!identifierInput.checkValidity() || !email) {
      identifierInput.reportValidity();
      return;
    }
    sendButton.disabled = true;
    setMessage(authMessage, '正在发送验证码……');
    try {
      const response = await auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (response?.error || !response?.data?.verifyOtp) throw response?.error || new Error('otp_unavailable');
      otpVerification = response.data;
      verificationStep.hidden = false;
      identifierInput.disabled = true;
      sendButton.hidden = true;
      codeInput.focus();
      setMessage(authMessage, `验证码已发送到 ${email}。`, 'success');
      startResendCountdown();
    } catch (error) {
      setMessage(authMessage, friendlyError(error, '验证码发送失败，请稍后再试。'), 'error');
      sendButton.disabled = false;
    }
  }

  async function verifyCode() {
    const token = codeInput.value.trim();
    if (!otpVerification || !/^\d{4,8}$/.test(token)) {
      setMessage(authMessage, '请输入邮件中的验证码。', 'error');
      return;
    }
    verifyButton.disabled = true;
    setMessage(authMessage, '正在验证并登录……');
    try {
      const response = await otpVerification.verifyOtp({ token });
      if (response?.error) throw response.error;
      setMessage(authMessage, '登录成功。', 'success');
      await refreshUi({ autoHandoff: true });
    } catch (error) {
      setMessage(authMessage, friendlyError(error, '验证码验证失败，请重试。'), 'error');
    } finally {
      verifyButton.disabled = false;
    }
  }

  function resetOtp() {
    otpVerification = null;
    verificationStep.hidden = true;
    identifierInput.disabled = false;
    sendButton.hidden = false;
    sendButton.disabled = false;
    codeInput.value = '';
    identifierInput.focus();
    setMessage(authMessage, '');
  }

  function startResendCountdown() {
    clearInterval(resendTimer);
    let remaining = 60;
    resendButton.disabled = true;
    resendButton.textContent = `${remaining} 秒后重发`;
    resendTimer = setInterval(() => {
      remaining -= 1;
      resendButton.textContent = remaining > 0 ? `${remaining} 秒后重发` : '重新发送';
      if (remaining <= 0) {
        clearInterval(resendTimer);
        resendButton.disabled = false;
      }
    }, 1000);
  }

  async function authorizeDesktop() {
    if (authorizing || !currentUser || !desktopRequest || desktopRequest.invalid) return;
    authorizing = true;
    authorizeButton.disabled = true;
    desktopStatus.textContent = '正在创建一次性授权码……';
    try {
      const result = await callAccountApi({
        action: 'authorizeDesktop',
        state: desktopRequest.state,
        codeChallenge: desktopRequest.codeChallenge,
        deviceInstanceHash: desktopRequest.deviceInstanceHash,
      });
      if (!result.ok || !result.code) throw new Error(result.code || 'authorization_failed');
      const callback = new URL('autoclipboard://auth/callback');
      callback.searchParams.set('code', result.code);
      callback.searchParams.set('state', result.state);
      openDesktopLink.href = callback.href;
      openDesktopLink.hidden = false;
      openDesktopLink.textContent = '未自动打开？点击返回 AutoClipboard';
      desktopStatus.textContent = '授权成功，正在打开 AutoClipboard……';
      location.assign(callback.href);
    } catch {
      desktopStatus.textContent = '桌面端授权失败，请返回软件重新发起登录。';
      authorizeButton.disabled = false;
    } finally {
      authorizing = false;
    }
  }

  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    void sendCode();
  });
  verifyButton.addEventListener('click', () => void verifyCode());
  resendButton.addEventListener('click', () => {
    resetOtp();
    void sendCode();
  });
  select('[data-change-identifier]').addEventListener('click', resetOtp);
  select('[data-sign-out]').addEventListener('click', async () => {
    await auth.signOut();
    resetOtp();
    await refreshUi();
  });
  authorizeButton.addEventListener('click', () => void authorizeDesktop());
  rechargeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(rechargeForm);
    rechargeButton.disabled = true;
    try {
      const result = await callAccountApi({
        action: 'createRecharge',
        amountCents: Number(form.get('amount')),
        provider: String(form.get('provider') || ''),
      });
      setMessage(rechargeMessage, result.message || '支付通道尚未配置。', result.ok ? 'success' : 'warning');
    } catch {
      setMessage(rechargeMessage, '充值服务暂时不可用。', 'error');
    }
  });

  void refreshUi({ autoHandoff: true });
})();
