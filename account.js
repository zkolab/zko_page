(() => {
  'use strict';

  const config = globalThis.ZKO_ACCOUNT_CONFIG;
  const websiteHosts = new Set(['zkolab.com', 'www.zkolab.com']);
  if (config?.hostedAccountUrl && websiteHosts.has(location.hostname)) {
    const destination = new URL(config.hostedAccountUrl);
    destination.search = location.search;
    if (config.hostedAccountVersion) destination.searchParams.set('v', config.hostedAccountVersion);
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
  const registrationForm = select('[data-auth-form="register"]');
  const emailInput = select('[data-auth-email]');
  const verificationStep = select('[data-verification-step]');
  const codeInput = select('[data-auth-code]');
  const sendButton = select('[data-send-code]');
  const verifyButton = select('[data-verify-code]');
  const resendButton = select('[data-resend-code]');
  const emailCodeTimer = select('[data-email-code-timer]');
  const emailMessage = select('[data-email-auth-message]');
  const usernameMessage = select('[data-username-auth-message]');
  const registrationMessage = select('[data-register-message]');
  const registrationCodeTimer = select('[data-register-code-timer]');
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
  const bindingButton = select('[data-create-binding]');
  const bindingMessage = select('[data-binding-message]');
  const bindingOutput = select('[data-binding-code]');
  const productSelect = select('[data-premium-product]');
  const goofishLink = select('[data-goofish-purchase]');
  const desktopRequest = readDesktopRequest(new URLSearchParams(location.search));
  let otpVerification = null;
  let registrationVerification = null;
  let pendingRegistration = null;
  let currentUser = null;
  let currentProfile = null;
  let pendingAvatarDataUrl = '';
  const verificationTimers = new Map();
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
    if (tone) target.dataset.type = tone;
    else delete target.dataset.type;
  }

  function errorDetails(error) {
    const values = [
      error?.code,
      error?.error,
      error?.errorCode,
      error?.message,
      error?.error_description,
      error?.cause?.code,
      error?.cause?.message,
    ].filter((value) => value !== undefined && value !== null && value !== '');
    return values.map(String).join(' ');
  }

  function friendlyError(error, fallback) {
    const code = errorDetails(error);
    const retryAfter = Number(error?.retryAfter || error?.retry_after || error?.cause?.retryAfter || 0);
    const requestId = String(error?.requestId || error?.request_id || error?.cause?.requestId || '').trim();
    const reference = requestId ? `（请求 ID：${requestId.slice(0, 80)}）` : '';
    if (/res_stopped|isolated|instance.*status|service.*unavailable|internal_server/i.test(code)) {
      return `身份认证服务当前不可用，请稍后再试。${reference}`;
    }
    if (/frequency|rate.?limit|too_many|429/i.test(code)) {
      return retryAfter > 0 ? `操作过于频繁，请 ${Math.ceil(retryAfter)} 秒后再试。${reference}` : `操作过于频繁，请稍后再试。${reference}`;
    }
    if (/invalid.*otp|verification|token/i.test(code)) return '验证码不正确或已过期，请重新输入。';
    if (/invalid.*password|password.*invalid|wrong.*password/i.test(code)) return '用户名或密码不正确。';
    if (/email.*exist|already.*registered|user.*exist|target.*not.?user/i.test(code)) return '这个邮箱已经注册，请直接登录。';
    if (/username.*exist|username.*registered|username_taken|23505/i.test(code)) return '这个用户名已被使用。';
    if (/username/i.test(code)) return '用户名格式不正确，或该用户名暂不可用。';
    if (/email/i.test(code)) return '请输入有效的邮箱地址。';
    return `${fallback}${reference}`;
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
    return String(profile?.username || currentUser?.email || 'Z').trim().slice(0, 1).toUpperCase() || 'Z';
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
    const identity = profile.username || currentUser?.email || '请设置用户名';
    select('[data-profile-heading]').textContent = identity;
    select('[data-overview-name]').textContent = identity;
    select('[data-profile-username]').textContent = profile.username ? `@${profile.username}` : '尚未设置用户名';
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
      renderPremium(response.subscription || {}, response.products || [], response.purchaseBinding);
      select('[data-admin-link]').hidden = response.account?.role !== 'admin';
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

  function renderPremium(subscription, products, binding) {
    const active = subscription.active === true;
    const expiry = subscription.validUntil ? new Date(subscription.validUntil).toLocaleString('zh-CN') : '';
    select('[data-premium-summary]').textContent = active ? '有效' : '未开通';
    select('[data-premium-status]').textContent = active ? `有效至 ${expiry}` : '当前没有有效权益';
    select('[data-premium-state]').textContent = active ? '高级版可用' : '未开通';
    select('[data-premium-expiry]').textContent = active
      ? `到期时间：${expiry}。续费会从当前到期时间继续顺延。`
      : '购买后由管理员人工发放；未来自动支付也会进入同一权益流水。';
    productSelect.replaceChildren();
    for (const product of products) {
      const option = document.createElement('option');
      option.value = product.productCode;
      option.textContent = `${product.displayName}（${product.durationDays} 天）`;
      option.dataset.purchaseUrl = product.purchaseUrl || '';
      productSelect.append(option);
    }
    const updatePurchaseUrl = () => {
      const selected = productSelect.selectedOptions[0];
      if (selected?.dataset.purchaseUrl) goofishLink.href = selected.dataset.purchaseUrl;
    };
    productSelect.onchange = updatePurchaseUrl;
    updatePurchaseUrl();
    if (binding) {
      bindingOutput.hidden = true;
      setMessage(bindingMessage, `已有未使用绑定码（尾号 ${binding.suffix}），有效至 ${new Date(binding.expiresAt).toLocaleString('zh-CN')}；重新生成会让旧码失效。`, 'warning');
    }
  }

  async function createPurchaseBinding() {
    bindingButton.disabled = true;
    bindingOutput.hidden = true;
    setMessage(bindingMessage, '正在生成一次性购买绑定码……');
    try {
      const response = await callAccountApi({ action: 'createPurchaseBinding' });
      if (!response.ok || !response.bindingCode) throw new Error(response.code || 'binding_failed');
      bindingOutput.textContent = response.bindingCode;
      bindingOutput.hidden = false;
      setMessage(bindingMessage, `绑定码有效至 ${new Date(response.expiresAt).toLocaleString('zh-CN')}。请只发给闲鱼卖家用于本次订单绑定。`, 'success');
    } catch (error) {
      setMessage(bindingMessage, friendlyError(error, '绑定码生成失败，请稍后重试。'), 'error');
    } finally {
      bindingButton.disabled = false;
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
      const response = await auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (response?.error || !response?.data?.verifyOtp) throw response?.error || new Error('otp_unavailable');
      otpVerification = response.data;
      verificationStep.hidden = false;
      emailInput.disabled = true;
      sendButton.hidden = true;
      codeInput.focus();
      setMessage(emailMessage, `验证码已发送到 ${email}。`, 'success');
      startVerificationCountdown(resendButton, emailCodeTimer);
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

  function registrationValues() {
    return {
      email: select('[data-register-email]').value.trim().toLowerCase(),
      username: select('[data-register-username]').value.trim().toLowerCase(),
      password: select('[data-register-password]').value,
      passwordConfirm: select('[data-register-password-confirm]').value,
    };
  }

  async function sendRegistrationCode() {
    const values = registrationValues();
    if (!registrationForm.checkValidity()) return registrationForm.reportValidity();
    if (values.password !== values.passwordConfirm) {
      return setMessage(registrationMessage, '两次输入的密码不一致。', 'error');
    }
    const button = select('[data-register-send-code]');
    button.disabled = true;
    setMessage(registrationMessage, '正在发送注册验证码……');
    try {
      const verification = await auth.getVerification({ email: values.email });
      if (!verification?.verification_id) throw new Error('registration_verification_unavailable');
      if (verification.is_user) throw new Error('email_already_registered');
      registrationVerification = verification;
      pendingRegistration = values;
      select('[data-register-verification-step]').hidden = false;
      for (const input of registrationForm.querySelectorAll('input:not([data-register-code])')) input.disabled = true;
      button.hidden = true;
      select('[data-register-code]').focus();
      setMessage(registrationMessage, `注册验证码已发送到 ${values.email}。`, 'success');
      startVerificationCountdown(select('[data-register-resend-code]'), registrationCodeTimer);
    } catch (error) {
      setMessage(registrationMessage, friendlyError(error, '注册验证码发送失败，请稍后再试。'), 'error');
      button.disabled = false;
    }
  }

  async function completeRegistration() {
    const token = select('[data-register-code]').value.trim();
    if (!registrationVerification || !pendingRegistration || !/^\d{4,8}$/.test(token)) {
      return setMessage(registrationMessage, '请输入邮件中的验证码。', 'error');
    }
    const button = select('[data-register-verify]');
    button.disabled = true;
    setMessage(registrationMessage, '正在验证并创建账户……');
    try {
      const verified = await auth.verify({
        verification_id: registrationVerification.verification_id,
        verification_code: token,
      });
      if (!verified?.verification_token) throw new Error('registration_verification_failed');
      const registered = pendingRegistration;
      await auth.signUp({
        email: registered.email,
        username: registered.username,
        password: registered.password,
        name: registered.username,
        verification_code: token,
        verification_token: verified.verification_token,
      });
      pendingRegistration = null;
      registrationVerification = null;
      select('[data-register-password]').value = '';
      select('[data-register-password-confirm]').value = '';
      try {
        await callAccountApi({
          action: 'updateProfile',
          username: registered.username,
        });
      } catch {
        // Auth registration is authoritative; profile mirroring can retry after sign-in.
      }
      setMessage(registrationMessage, '注册成功，用户名和密码已经可以使用。', 'success');
      await refreshUi({ autoHandoff: true });
    } catch (error) {
      setMessage(registrationMessage, friendlyError(error, '注册失败，请检查验证码和注册信息。'), 'error');
    } finally {
      button.disabled = false;
    }
  }

  function resetRegistration() {
    clearVerificationCountdown(select('[data-register-resend-code]'), registrationCodeTimer);
    registrationVerification = null;
    pendingRegistration = null;
    select('[data-register-verification-step]').hidden = true;
    select('[data-register-code]').value = '';
    for (const input of registrationForm.querySelectorAll('input')) input.disabled = false;
    const button = select('[data-register-send-code]');
    button.hidden = false;
    button.disabled = false;
    select('[data-register-email]').focus();
    setMessage(registrationMessage, '');
  }

  function resetOtp() {
    clearVerificationCountdown(resendButton, emailCodeTimer);
    otpVerification = null;
    verificationStep.hidden = true;
    emailInput.disabled = false;
    sendButton.hidden = false;
    sendButton.disabled = false;
    codeInput.value = '';
    emailInput.focus();
    setMessage(emailMessage, '');
  }

  function clearVerificationCountdown(resendTarget, statusTarget) {
    const timer = verificationTimers.get(resendTarget);
    if (timer) clearInterval(timer);
    verificationTimers.delete(resendTarget);
    if (statusTarget) {
      statusTarget.textContent = '';
      delete statusTarget.dataset.type;
    }
  }

  function startVerificationCountdown(resendTarget, statusTarget) {
    clearVerificationCountdown(resendTarget, statusTarget);
    const startedAt = Date.now();
    const resendDelaySeconds = 60;
    const validitySeconds = 600;

    const renderCountdown = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const resendRemaining = Math.max(0, resendDelaySeconds - elapsedSeconds);
      const validityRemaining = Math.max(0, validitySeconds - elapsedSeconds);

      resendTarget.disabled = resendRemaining > 0;
      resendTarget.textContent = resendRemaining > 0 ? `${resendRemaining} 秒后可重发` : '重新发送';

      if (validityRemaining <= 0) {
        statusTarget.textContent = '验证码已超过 600 秒有效期，请重新发送。';
        statusTarget.dataset.type = 'warning';
        const timer = verificationTimers.get(resendTarget);
        if (timer) clearInterval(timer);
        verificationTimers.delete(resendTarget);
        return;
      }

      statusTarget.dataset.type = resendRemaining > 0 ? 'waiting' : 'ready';
      statusTarget.textContent = resendRemaining > 0
        ? `还需要等待 ${resendRemaining} 秒才能重新发送；验证码有效期还剩 ${validityRemaining} 秒。`
        : `现在可以重新发送；验证码有效期还剩 ${validityRemaining} 秒。`;
    };

    renderCountdown();
    verificationTimers.set(resendTarget, setInterval(renderCountdown, 1000));
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
      registrationForm.hidden = mode !== 'register';
      const focusTarget = mode === 'email' ? emailInput : mode === 'register' ? select('[data-register-email]') : select('[data-login-username]');
      focusTarget.focus();
    });
  }
  emailForm.addEventListener('submit', (event) => { event.preventDefault(); void sendCode(); });
  usernameForm.addEventListener('submit', (event) => { event.preventDefault(); void loginWithUsername(); });
  registrationForm.addEventListener('submit', (event) => { event.preventDefault(); void sendRegistrationCode(); });
  verifyButton.addEventListener('click', () => void verifyCode());
  resendButton.addEventListener('click', () => { resetOtp(); void sendCode(); });
  select('[data-change-identifier]').addEventListener('click', resetOtp);
  select('[data-register-verify]').addEventListener('click', () => void completeRegistration());
  select('[data-register-resend-code]').addEventListener('click', () => { resetRegistration(); void sendRegistrationCode(); });
  select('[data-register-change]').addEventListener('click', resetRegistration);
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
  bindingButton.addEventListener('click', () => void createPurchaseBinding());
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
