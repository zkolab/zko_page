(() => {
  'use strict';

  const config = globalThis.ZKO_ACCOUNT_CONFIG;
  const sdk = globalThis.cloudbase ?? globalThis.cloudbaseBundle?.default ?? globalThis.cloudbaseBundle;
  if (!config || !sdk?.init) return;
  const app = sdk.init({ env: config.cloudbase.envId, region: config.cloudbase.region });
  const auth = app.auth({ persistence: 'local' });
  const select = (selector) => document.querySelector(selector);
  const selectAll = (selector) => [...document.querySelectorAll(selector)];
  const workspace = select('[data-admin-workspace]');
  const adminState = select('[data-admin-state]');
  let overview = null;

  function setMessage(target, message, tone = '') {
    target.textContent = message;
    if (tone) target.dataset.type = tone;
    else delete target.dataset.type;
  }

  function callResult(response) {
    let value = response?.result ?? response;
    if (typeof value === 'string') {
      try { value = JSON.parse(value); } catch { return { ok: false, code: 'invalid_response' }; }
    }
    return value && typeof value === 'object' ? value : { ok: false, code: 'invalid_response' };
  }

  async function callAccountApi(data) {
    return callResult(await app.callFunction({ name: config.functions.accountApi, data, parse: true }));
  }

  function textCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = String(value ?? '');
    row.append(cell);
    return cell;
  }

  function replaceModelOptions(selectElement, models, selectedValue = '') {
    const normalized = Array.isArray(models) ? models.filter((model) => model?.id) : [];
    selectElement.replaceChildren();
    for (const model of normalized) {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.label || model.id;
      selectElement.append(option);
    }
    if (selectedValue && !normalized.some((model) => model.id === selectedValue)) {
      const option = document.createElement('option');
      option.value = selectedValue;
      option.textContent = `${selectedValue}（当前保存）`;
      selectElement.prepend(option);
    }
    if (selectedValue) selectElement.value = selectedValue;
  }

  function render() {
    const products = overview.products || [];
    const productSelect = select('[data-admin-products]');
    productSelect.replaceChildren();
    for (const product of products.filter((item) => item.active)) {
      const option = document.createElement('option');
      option.value = product.product_code;
      option.textContent = `${product.display_name}（${product.duration_days} 天）`;
      productSelect.append(option);
    }

    const orderRows = select('[data-order-rows]');
    orderRows.replaceChildren();
    for (const order of overview.orders || []) {
      const row = document.createElement('tr');
      textCell(row, new Date(order.created_at).toLocaleString('zh-CN'));
      textCell(row, `${order.channel} / ${order.external_order_no}`);
      textCell(row, order.user_id);
      textCell(row, order.product_code);
      textCell(row, order.status);
      orderRows.append(row);
    }

    const userRows = select('[data-user-rows]');
    userRows.replaceChildren();
    for (const user of overview.users || []) {
      const row = document.createElement('tr');
      textCell(row, `${user.displayName || user.username || user.email || '未命名'}\n${user.email || user.id}`);
      textCell(row, user.status);
      textCell(row, user.subscription?.active ? new Date(user.subscription.validUntil).toLocaleString('zh-CN') : '未开通 / 已失效');
      const actionCell = document.createElement('td');
      const button = document.createElement('button');
      button.className = 'button button--small button--light';
      button.type = 'button';
      button.textContent = '选择';
      button.addEventListener('click', () => {
        select('[data-entitlement-form] [name="targetUserId"]').value = user.id;
        setMessage(select('[data-entitlement-message]'), `已选择 ${user.displayName || user.email || user.id}`);
      });
      actionCell.append(button);
      row.append(actionCell);
      userRows.append(row);
    }

    for (const provider of overview.providers || []) {
      const form = select(`[data-provider-form="${provider.providerCode}"]`);
      if (!form) continue;
      form.elements.enabled.checked = provider.enabled;
      if (provider.providerCode === 'tencent_asr') {
        replaceModelOptions(form.elements.engineModelType, [
          { id: '16k_zh', label: '16k 中文普通话' },
          { id: '16k_en', label: '16k 英语' },
        ], provider.configuration.engineModelType || '16k_zh');
      }
      if (provider.providerCode === 'deepseek') {
        replaceModelOptions(form.elements.model, [], provider.configuration.model || 'deepseek-chat');
      }
      const status = select(`[data-provider-status="${provider.providerCode}"]`);
      const selectedModel = provider.providerCode === 'tencent_asr'
        ? provider.configuration.engineModelType : provider.configuration.model;
      status.textContent = provider.configured
        ? `${provider.enabled ? '已启用' : '已配置，当前停用'}${selectedModel ? ` · ${selectedModel}` : ''}`
        : '未配置';
      status.dataset.ready = String(provider.configured && provider.enabled);
    }
  }

  for (const button of selectAll('[data-provider-models]')) {
    button.addEventListener('click', async () => {
      const providerCode = button.dataset.providerModels;
      const form = select(`[data-provider-form="${providerCode}"]`);
      const message = select(`[data-provider-message="${providerCode}"]`);
      const modelSelect = providerCode === 'tencent_asr'
        ? form.elements.engineModelType : form.elements.model;
      const selectedValue = modelSelect.value;
      button.disabled = true;
      setMessage(message, providerCode === 'deepseek'
        ? '正在使用云端已保存的密钥拉取可用模型……'
        : '正在刷新腾讯云可用识别引擎……');
      try {
        const response = await callAccountApi({ action: 'adminListProviderModels', providerCode });
        if (!response.ok) throw new Error(response.message || response.code || 'provider_models_failed');
        replaceModelOptions(modelSelect, response.models, selectedValue);
        modelSelect.dataset.modelsLoaded = 'true';
        setMessage(message, `已获取 ${response.models.length} 个可用选项，请选择后保存并启用。`, 'success');
      } catch (error) {
        setMessage(message, `拉取失败：${error.message}`, 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  async function load(query = '') {
    const response = await callAccountApi({ action: 'adminOverview', query });
    if (!response.ok) throw new Error(response.code || 'admin_unavailable');
    overview = response;
    render();
  }

  select('[data-manual-order-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = select('[data-manual-order-message]');
    const values = new FormData(form);
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setMessage(message, '正在核对绑定码和订单幂等状态……');
    try {
      const response = await callAccountApi({
        action: 'adminGrantManualOrder', channel: 'goofish',
        bindingCode: values.get('bindingCode'), externalOrderNo: values.get('externalOrderNo'),
        productCode: values.get('productCode'), note: values.get('note'),
      });
      if (!response.ok) throw new Error(response.code || 'grant_failed');
      form.reset();
      setMessage(message, response.grant?.duplicate ? '该订单已经处理过，没有重复加时。' : '权益已发放并写入审计流水。', 'success');
      await load();
    } catch (error) {
      setMessage(message, `发放失败：${error.message}`, 'error');
    } finally {
      button.disabled = false;
    }
  });

  select('[data-user-search-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    await load(new FormData(event.currentTarget).get('query') || '');
  });

  select('[data-entitlement-form]').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const message = select('[data-entitlement-message]');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const response = await callAccountApi({
        action: 'adminAdjustEntitlement', targetUserId: values.get('targetUserId'),
        entitlementAction: values.get('entitlementAction'), days: Number(values.get('days') || 0),
        reason: values.get('reason'), idempotencyKey: crypto.randomUUID(),
      });
      if (!response.ok) throw new Error(response.code || 'adjust_failed');
      setMessage(message, '权益状态已更新并写入审计流水。', 'success');
      await load();
    } catch (error) {
      setMessage(message, `操作失败：${error.message}`, 'error');
    } finally {
      button.disabled = false;
    }
  });

  for (const form of selectAll('[data-provider-form]')) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const providerCode = form.dataset.providerForm;
      const message = select(`[data-provider-message="${providerCode}"]`);
      const values = new FormData(form);
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      const configuration = providerCode === 'tencent_asr'
        ? { engineModelType: values.get('engineModelType') }
        : { model: values.get('model') };
      let secret = null;
      if (providerCode === 'tencent_asr' && (values.get('appId') || values.get('secretId') || values.get('secretKey'))) {
        secret = { appId: values.get('appId'), secretId: values.get('secretId'), secretKey: values.get('secretKey') };
      }
      if (providerCode === 'deepseek' && values.get('apiKey')) secret = { apiKey: values.get('apiKey') };
      setMessage(message, values.get('enabled') === 'on'
        ? '正在验证所选模型并启用……'
        : '正在加密并保存云端配置……');
      try {
        const response = await callAccountApi({
          action: 'adminSetProviderConfig', providerCode,
          enabled: values.get('enabled') === 'on', configuration, secret,
        });
        if (!response.ok) throw new Error(response.code || 'provider_update_failed');
        for (const input of form.querySelectorAll('input[type="password"], input[name="appId"]')) input.value = '';
        overview.providers = response.providers;
        render();
        setMessage(message, values.get('enabled') === 'on'
          ? '所选模型已验证并启用；密钥原文已从页面清空。'
          : '配置已保存但尚未启用；请拉取并选择模型后启用。', 'success');
      } catch (error) {
        setMessage(message, `保存失败：${error.message}`, 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  (async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        location.replace('account.html');
        return;
      }
      await load();
      workspace.hidden = false;
      adminState.textContent = '管理员身份已验证';
      adminState.dataset.type = 'success';
    } catch (error) {
      adminState.textContent = error.message === 'admin_required' ? '当前账户没有管理员权限' : '管理服务暂时不可用';
      adminState.dataset.type = 'error';
    }
  })();
})();
