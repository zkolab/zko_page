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
  const selectAll = (selector) => [...document.querySelectorAll(selector)];
  const emailForm = select('[data-auth-form="email"]');
  const usernameForm = select('[data-auth-form="username"]');
  const emailInput = select('[data-auth-email]');
  const verificationStep = select('[data-verification-step]');
  const codeInput = select('[data-auth-code]');
  const sendButton = select('[data-send-code]');
  const verifyButton = select('[data-verify-code]');
  const resendButton = select('[data-resend-code]');
  const emailMessage = select('[data-email-auth-message]');
  const usernameMessage = select('[data-username-auth-message]');
  const authState = select('[data-auth-state]');
  const workspace = select('[data-account-workspace]');
  const profileForm = select('[data-profile-form]');
  const avatarInput = select('[data-avatar-input]');
  const authorizeButton = select('[data-authorize-desktop]');
  const openDesktopLink = select('[data-open-desktop]');
  const startDesktopLink = select('[data-start-desktop]');
  const desktopStatus = select('[data-desktop-status]');
  const rechargeForm = select('[data-recharge-form]');
  const rechargeButton = select('[data-recharge-submit]');
  const rechargeMessage = select('[data-recharge-message]');
  const desktopRequest = readDesktopRequest(new URLSearchParams(location.search));
  let otpVerification = null;
  let currentUser = null;
  let currentProfile = null;
  let pendingAvatarDataUrl = '';
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
    if (/frequency|limit|too_many/i.test(code)) return '操作过于频繁，请稍后再试。';
    if (/invalid.*otp|verification|token/i.test(code)) return '验证码不正确或已过期，请重新输入。';
    if (/invalid.*password|password.*invalid|wrong.*password/i.test(code)) return '用户名或密码不正确。';
    if (/username.*exist|already.*registered|username_taken|23505/i.test(code)) return '这个用户名已被使用。';
    if (/username/i.test(code)) return '用户名格式不正确，或该用户名暂不可用。';
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

  function initialFor(profile) {
    return String(profile?.displayName || profile?.username || currentUser?.email || 'Z').trim().slice(0, 1).toUpperCase() || 'Z';
  }

  function setAvatar(image, initial, profile) {
    if (!image || !initial) return;
    const url = profile?.avatarUrl || '';
    image.hidden = !url;
    initial.hidden = Boolean(url);
    if (url) image.src = url;
    else image.removeAttribute('src');
    initial.textContent = initialFor(profile);
  }

  function renderProfile(profile) {
    const identity = profile.displayName || profile.username || currentUser?.email || 'ZKO 用户';
    select('[data-profile-heading]').textContent = identity;
    select('[data-overview-name]').textContent = identity;
    select('[data-profile-username]').textContent = profile.username ? `@${profile.username}` : '尚未设置用户名';
    select('[data-profile-display-name]').value = profile.displayName || '';
    select('[data-profile-full-name]').value = profile.fullName || '';
    select('[data-profile-username-input]').value = profile.username || '';
    select('[data-security-email]').textContent = currentUser?.email || profile.email || '未读取到邮箱';
    select('[data-security-username]').textContent = profile.username ? `@${profile.username} 可用于密码登录` : '保存用户名后即可配置密码。';
    select('[data-username-state]').textContent = profile.username ? '已绑定' : '未配置';
    setAvatar(select('[data-profile-avatar-image]'), select('[data-profile-avatar-initial]'), profile);
    setAvatar(select('[data-avatar-preview]'), select('[data-avatar-preview-initial]'), profile);
    globalThis.ZKO_ACCOUNT_HEADER?.update?.({ ...profile, signedIn: true });
    updatePublicSiteLinks(profile);
  }

  function encodeProfile(profile) {
    const safe = JSON.stringify({
      displayName: profile.displayName || '',
      username: profile.username || '',
      avatarUrl: profile.avatarUrl || '',
      updatedAt: Date.now(),
    });
    const bytes = new TextEncoder().encode(safe);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  }

  function updatePublicSiteLinks(profile) {
    const siteUrl = config.websiteUrl || 'https://zkolab.com/';
    const encoded = profile ? encodeProfile(profile) : '';
    for (const link of selectAll('[data-public-site-link]')) {
      const target = new URL(link.dataset.publicSiteLink || '', siteUrl);
      if (encoded) target.searchParams.set('_zko_profile', encoded);
      else target.searchParams.set('_zko_signed_out', '1');
      link.href = target.href;
    }
  }

  async function refreshUi({ autoHandoff = false } = {}) {
    try {
      currentUser = await auth.getCurrentUser();
    } catch {
      currentUser = null;
    }
    const signedIn = Boolean(currentUser);
    for (const guest of selectAll('[data-guest-view]')) guest.hidden = signedIn;
    workspace.hidden = !signedIn;
    authState.textContent = signedIn ? '已登录' : '未登录';
    if (!signedIn) {
      currentProfile = null;
      globalThis.ZKO_ACCOUNT_HEADER?.update?.({ signedIn: false });
      configureDesktopState();
      updatePublicSiteLinks(null);
      return;
    }
    configureDesktopState();
    await loadOverview();
    if (autoHandoff && desktopRequest && !desktopRequest.invalid) await authorizeDesktop();
  }

  function configureDesktopState() {
    authorizeButton.hidden = true;
    openDesktopLink.hidden = true;
    startDesktopLink.hidden = Boolean(desktopRequest);
    if (!desktopRequest) {
      desktopStatus.textContent = '当前没有桌面端登录请求';
      select('[data-desktop-summary]').textContent = '可随时登录';
      return;
    }
    if (desktopRequest.invalid) {
      desktopStatus.textContent = '桌面端登录请求无效，请从 AutoClipboard 重新打开';
      select('[data-desktop-summary]').textContent = '请求无效';
      return;
    }
    if (!currentUser) {
      desktopStatus.textContent = '完成账户登录后将自动返回 AutoClipboard';
      return;
    }
    desktopStatus.textContent = '账户已验证，正在授权 AutoClipboard……';
    select('[data-desktop-summary]').textContent = '正在授权';
    authorizeButton.hidden = false;
  }

  async function loadOverview() {
    try {
      const response = await callAccountApi({ action: 'overview' });
      if (!response.ok) throw new Error(response.code || 'overview_failed');
      currentProfile = {
        ...response.account,
        email: currentUser?.email || response.account?.email || '',
        username: response.account?.username || currentUser?.username || '',
      };
      renderProfile(currentProfile);
      const cents = Number(response.wallet?.balance_cents || 0);
      select('[data-wallet-balance]').textContent = `¥ ${(cents / 100).toFixed(2)}`;
      renderEntries(response.entries || []);
      const paymentReady = Boolean(response.payment?.configured);
      rechargeButton.disabled = !paymentReady;
      setMessage(
        rechargeMessage,
        paymentReady ? '选择金额和支付方式后继续。' : '支付宝和微信商户 API 尚未接入，当前不会创建假订单或自动入账。',
        paymentReady ? '' : 'warning',
      );
    } catch {
      setMessage(select('[data-profile-message]'), '账户服务暂时不可用，请稍后刷新。', 'error');
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
      const summary = document.createElement('span');
      const value = document.createElement('strong');
      summary.textContent = `${date} · ${entry.entry_type}`;
      value.dataset.positive = String(amount >= 0);
      value.textContent = `${amount >= 0 ? '+' : ''}¥${amount.toFixed(2)}`;
      item.append(summary, value);
      list.append(item);
    }
  }

  async function sendCode() {
    const email = emailInput.value.trim().toLowerCase();
    if (!emailInput.checkValidity() || !email) return emailInput.reportValidity();
    sendButton.disabled = true;
    setMessage(emailMessage, '正在发送验证码……');
    try {
      const response = await auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (response?.error || !response?.data?.verifyOtp) throw response?.error || new Error('otp_unavailable');
      otpVerification = response.data;
      verificationStep.hidden = false;
      emailInput.disabled = true;
      sendButton.hidden = true;
      codeInput.focus();
      setMessage(emailMessage, `验证码已发送到 ${email}。`, 'success');
      startResendCountdown();
    } catch (error) {
      setMessage(emailMessage, friendlyError(error, '验证码发送失败，请稍后再试。'), 'error');
      sendButton.disabled = false;
    }
  }

  async function verifyCode() {
    const token = codeInput.value.trim();
    if (!otpVerification || !/^\d{4,8}$/.test(token)) return setMessage(emailMessage, '请输入邮件中的验证码。', 'error');
    verifyButton.disabled = true;
    setMessage(emailMessage, '正在验证并登录……');
    try {
      const response = await otpVerification.verifyOtp({ token });
      if (response?.error) throw response.error;
      setMessage(emailMessage, '登录成功。', 'success');
      await refreshUi({ autoHandoff: true });
    } catch (error) {
      setMessage(emailMessage, friendlyError(error, '验证码验证失败，请重试。'), 'error');
    } finally {
      verifyButton.disabled = false;
    }
  }

  async function loginWithUsername() {
    const usernameInput = select('[data-login-username]');
    const passwordInput = select('[data-login-password]');
    const username = usernameInput.value.trim().toLowerCase();
    if (!usernameForm.checkValidity()) return usernameForm.reportValidity();
    setMessage(usernameMessage, '正在登录……');
    select('[data-username-login]').disabled = true;
    try {
      const response = await auth.signInWithPassword({ username, password: passwordInput.value });
      if (response?.error) throw response.error;
      passwordInput.value = '';
      setMessage(usernameMessage, '登录成功。', 'success');
      await refreshUi({ autoHandoff: true });
    } catch (error) {
      setMessage(usernameMessage, friendlyError(error, '用户名登录失败，请检查用户名和密码。'), 'error');
    } finally {
      select('[data-username-login]').disabled = false;
    }
  }

  function resetOtp() {
    otpVerification = null;
    verificationStep.hidden = true;
    emailInput.disabled = false;
    sendButton.hidden = false;
    sendButton.disabled = false;
    codeInput.value = '';
    emailInput.focus();
    setMessage(emailMessage, '');
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

  async function compressAvatar(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) throw new Error('avatar_invalid');
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#101318';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    let quality = 0.88;
    let value = canvas.toDataURL('image/jpeg', quality);
    while (value.length > 690000 && quality > 0.5) {
      quality -= 0.08;
      value = canvas.toDataURL('image/jpeg', quality);
    }
    if (value.length > 690000) throw new Error('avatar_too_large');
    return value;
  }

  async function saveProfile() {
    if (!profileForm.checkValidity()) return profileForm.reportValidity();
    const displayName = select('[data-profile-display-name]').value.trim();
    const fullName = select('[data-profile-full-name]').value.trim();
    const username = select('[data-profile-username-input]').value.trim().toLowerCase();
    const oldUsername = currentProfile?.username || currentUser?.username || '';
    const saveButton = select('[data-save-profile]');
    saveButton.disabled = true;
    setMessage(select('[data-profile-message]'), '正在保存个人资料……');
    try {
      if (username !== oldUsername) {
        const check = await callAccountApi({ action: 'checkUsername', username });
        if (!check.ok || !check.available) throw new Error(check.code || 'username_taken');
        if (typeof currentUser.updateUsername === 'function') {
          await currentUser.updateUsername(username);
        } else {
          const authResult = await auth.updateUser({ username });
          if (authResult?.error) throw authResult.error;
        }
      }
      const response = await callAccountApi({
        action: 'updateProfile',
        displayName,
        fullName,
        username,
        avatarDataUrl: pendingAvatarDataUrl || undefined,
      });
      if (!response.ok) throw new Error(response.code || 'profile_update_failed');
      currentUser = await auth.getCurrentUser();
      currentProfile = { ...response.account, email: currentUser?.email || '' };
      pendingAvatarDataUrl = '';
      renderProfile(currentProfile);
      setMessage(select('[data-profile-message]'), '个人资料已保存。', 'success');
    } catch (error) {
      setMessage(select('[data-profile-message]'), friendlyError(error, '保存失败，请稍后重试。'), 'error');
    } finally {
      saveButton.disabled = false;
    }
  }

  async function authorizeDesktop() {
    if (authorizing || !currentUser || !desktopRequest || desktopRequest.invalid) return;
    authorizing = true;
    authorizeButton.disabled = true;
    desktopStatus.textContent = '正在创建一次性授权码……';
    try {
      const response = await callAccountApi({
        action: 'authorizeDesktop',
        state: desktopRequest.state,
        codeChallenge: desktopRequest.codeChallenge,
        deviceInstanceHash: desktopRequest.deviceInstanceHash,
      });
      if (!response.ok || !response.code) throw new Error(response.code || 'authorization_failed');
      const callback = new URL('autoclipboard://auth/callback');
      callback.searchParams.set('code', response.code);
      callback.searchParams.set('state', response.state);
      openDesktopLink.href = callback.href;
      openDesktopLink.hidden = false;
      openDesktopLink.textContent = '未自动打开？点击返回 AutoClipboard';
      desktopStatus.textContent = '授权成功，正在打开 AutoClipboard……';
      select('[data-desktop-summary]').textContent = '授权成功';
      location.assign(callback.href);
    } catch {
      desktopStatus.textContent = '桌面端授权失败，请返回软件重新发起登录。';
      authorizeButton.disabled = false;
    } finally {
      authorizing = false;
    }
  }

  for (const tab of selectAll('[data-auth-tab]')) {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.authTab;
      for (const candidate of selectAll('[data-auth-tab]')) candidate.setAttribute('aria-selected', String(candidate === tab));
      emailForm.hidden = mode !== 'email';
      usernameForm.hidden = mode !== 'username';
      (mode === 'email' ? emailInput : select('[data-login-username]')).focus();
    });
  }
  emailForm.addEventListener('submit', (event) => { event.preventDefault(); void sendCode(); });
  usernameForm.addEventListener('submit', (event) => { event.preventDefault(); void loginWithUsername(); });
  verifyButton.addEventListener('click', () => void verifyCode());
  resendButton.addEventListener('click', () => { resetOtp(); void sendCode(); });
  select('[data-change-identifier]').addEventListener('click', resetOtp);
  select('[data-sign-out]').addEventListener('click', async () => {
    await auth.signOut();
    resetOtp();
    await refreshUi();
  });
  avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    setMessage(select('[data-profile-message]'), '正在处理头像……');
    try {
      pendingAvatarDataUrl = await compressAvatar(file);
      const preview = select('[data-avatar-preview]');
      preview.src = pendingAvatarDataUrl;
      preview.hidden = false;
      select('[data-avatar-preview-initial]').hidden = true;
      setMessage(select('[data-profile-message]'), '头像已准备好，点击“保存个人资料”完成上传。', 'success');
    } catch (error) {
      pendingAvatarDataUrl = '';
      setMessage(select('[data-profile-message]'), friendlyError(error, '头像处理失败，请换一张图片。'), 'error');
    }
  });
  profileForm.addEventListener('submit', (event) => { event.preventDefault(); void saveProfile(); });
  select('[data-reset-password]').addEventListener('click', async () => {
    const email = currentUser?.email || currentProfile?.email || '';
    if (!email) return setMessage(select('[data-security-message]'), '当前账户没有可用邮箱。', 'error');
    setMessage(select('[data-security-message]'), '正在发送安全邮件……');
    try {
      const response = await auth.resetPasswordForEmail(email, { redirectTo: location.href.split('?')[0] });
      if (response?.error) throw response.error;
      setMessage(select('[data-security-message]'), `设置或修改密码的邮件已发送到 ${email}。`, 'success');
    } catch (error) {
      setMessage(select('[data-security-message]'), friendlyError(error, '邮件发送失败，请稍后重试。'), 'error');
    }
  });
  authorizeButton.addEventListener('click', () => void authorizeDesktop());
  rechargeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(rechargeForm);
    rechargeButton.disabled = true;
    try {
      const response = await callAccountApi({ action: 'createRecharge', amountCents: Number(form.get('amount')), provider: String(form.get('provider') || '') });
      setMessage(rechargeMessage, response.message || '支付通道尚未配置。', response.ok ? 'success' : 'warning');
    } catch {
      setMessage(rechargeMessage, '充值服务暂时不可用。', 'error');
    }
  });

  void refreshUi({ autoHandoff: true });
})();
