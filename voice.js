(() => {
  const previews = {
    tech: {
      label: 'TECH_CLEAN',
      kicker: '技术清洗',
      title: '修复刷新 token 提前失效问题',
      body: '保留现有账户页面和交互；查明刷新 token 提前失效的原因，完成修复后运行相关测试并报告结果。',
    },
    standard: {
      label: 'STANDARD',
      kicker: '通用整理',
      title: '确认下周的交付安排',
      body: '请确认下周的交付时间。如计划发生变化，请同步新的时间以及需要配合的事项。',
    },
    chat: {
      label: 'CASUAL_CHAT',
      kicker: '日常聊天',
      title: '我晚一点到',
      body: '我这边还要十分钟，你们先开始，不用等我。到了我再跟上。',
    },
    ai: {
      label: 'AI_PROMPT',
      kicker: '目标',
      title: '修复登录 token 过期问题',
      body: '保留现有账户页面和交互；查明 token 提前失效的原因，完成修复后运行相关测试并报告结果。',
    },
    email: {
      label: 'BUSINESS_EMAIL',
      kicker: '邮件正文',
      title: '关于下周交付时间的确认',
      body: '你好，想与你确认下周的交付安排。若当前计划有变化，请告知新的时间和需要我方配合的事项，谢谢。',
    },
    document: {
      label: 'DOCUMENT',
      kicker: '文档与笔记',
      title: '语音功能发布说明',
      body: '本次更新加入实时语音识别、九种写作模式和个人热词。用户可以独立使用软件，也可以搭配字库手柄完成开始、结束与发送。',
    },
    notes: {
      label: 'MEETING_NOTES',
      kicker: '会议结论',
      title: '语音功能发布检查',
      body: '结论：先完成介绍页和跨平台说明。待办：检查下载版本、移动端布局与隐私表述；负责人以会议原文为准。',
    },
    translateZh: {
      label: 'TRANSLATE_ZH',
      kicker: '中文译文',
      title: '让工作流保持连续',
      body: '按下快捷键，自然说话，再按一次结束。AutoClipboard 会整理转写内容，并将文字输入当前光标。',
    },
    translateEn: {
      label: 'TRANSLATE_EN',
      kicker: 'English',
      title: 'Keep the workflow moving',
      body: 'Press the shortcut, speak naturally, and press it again to finish. AutoClipboard refines the transcript and inserts it at the current cursor.',
    },
  };

  const buttons = [...document.querySelectorAll('[data-voice-mode]')];
  const label = document.querySelector('[data-voice-mode-label]');
  const kicker = document.querySelector('[data-voice-preview-kicker]');
  const title = document.querySelector('[data-voice-preview-title]');
  const body = document.querySelector('[data-voice-preview-body]');

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const preview = previews[button.dataset.voiceMode];
      if (!preview) return;
      for (const item of buttons) {
        const selected = item === button;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      }
      if (label) label.textContent = preview.label;
      if (kicker) kicker.textContent = preview.kicker;
      if (title) title.textContent = preview.title;
      if (body) body.textContent = preview.body;
    });
  }
})();
