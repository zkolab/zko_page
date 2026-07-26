# ZKO 购买用户隐藏资料站设计

## 目标

为苍虬 AI 编程手柄的购买用户制作一套独立网页资料。资料面向第一次接触 AI、编程 Agent、Skills 和语音输入工具的普通用户，强调“照着步骤完成第一次任务”，不使用大段概念介绍。

资料站继续部署在现有 GitHub Pages 网站中，但不在公开官网、商城、使用说明、页脚或站点地图中提供入口。卖家向购买用户单独发送总纲页面链接。

## 已确认的约束

- 采用一份总纲和三份独立文档，不合并成一篇长文。
- 使用现有 GitHub Pages，不申请新的 `github.io` 站点。
- 使用隐藏目录降低普通访客和搜索引擎发现资料的概率。
- 当前仓库是公开仓库，因此隐藏目录不是严格访问控制；技术人员仍可能通过仓库源码发现文件。
- 页面内容以实操为主，每个工具都提供官方主页、官方文档和官方下载或控制台入口。
- 基础路线优先选择国内网络环境下容易使用的方案；进阶路线明确标注可能需要科学上网、海外账号或国际支付方式。
- 官方模型平台是 API 配置的默认推荐。第三方中转服务只能放在风险说明或进阶附录中，不作为新手默认方案。
- 示例不得包含真实 API Key、访问令牌、账号信息或其他敏感数据。

## 部署与访问设计

资料站使用以下固定目录：

```text
buyer-kit-7q4m9x2k6p8n3r5v/
```

目录内包含：

```text
buyer-kit-7q4m9x2k6p8n3r5v/
├── index.html
├── ai-guide.html
├── coding-workflow.html
├── openless-typeless.html
├── buyer-guide.css
└── buyer-guide.js
```

访问策略：

- 总纲入口为 `/buyer-kit-7q4m9x2k6p8n3r5v/index.html`。
- 公开页面不得链接到隐藏目录。
- 隐藏页面不得加入站点地图或公开下载区。
- 每个隐藏页面添加 `robots` 元信息：`noindex, nofollow, noarchive`。
- 根目录 `robots.txt` 禁止抓取该隐藏目录。
- 页面之间只使用相对链接互相导航。
- 如果链接泄露，通过重命名整个隐藏目录使旧链接失效；重命名时同步更新 `robots.txt`。

## 总体信息架构

### 总纲页面

总纲只负责帮助用户选路线，不重复三份文档的详细内容。页面包含：

1. 资料包用途和适合人群。
2. “第一次使用建议按这个顺序”的四步路线。
3. 三份文档入口卡片。
4. “国内直连”“可能需要科学上网”“需要 API Key”等标签解释。
5. API Key 安全提醒。
6. 常见问题入口和资料核对日期。

推荐阅读顺序：

1. 在《AI 使用指南》中配置 CC-Switch 和至少一个模型服务。
2. 选择一个 AI 工具并完成第一次任务。
3. 在《编程工作流心得》中学习 Skills 驱动的开发流程。
4. 在《OpenLess / Typeless》中配置语音输入和手柄联动。

### 页面公共导航

每个页面提供：

- 返回总纲。
- 上一篇和下一篇。
- 当前页面目录。
- 返回顶部。
- 资料核对日期。

不得提供返回公开官网的醒目导航，避免购买用户误以为资料入口属于公开站点导航体系；页尾可以使用普通文字标明“苍虬 AI 编程手柄购买用户资料”。

## 文档一：AI 使用指南

### 写作原则

- CC-Switch 必须放在最前面，作为进阶 AI 工具的统一配置入口。
- 不先讲模型、Agent、上下文等抽象概念；需要解释时只用一句通俗说明。
- 每条路线从下载或注册开始，以成功完成第一个任务结束。
- 每个选择都必须附官方链接，不引用聚合下载站作为主要入口。

### 第一章：先配置 CC-Switch

章节按以下顺序编写：

1. CC-Switch 能解决什么问题：统一保存并切换 Claude Code、Codex、Gemini CLI、OpenCode、OpenClaw 等工具的供应商配置。
2. 从官方站点或官方 GitHub Releases 下载对应系统版本。
3. 安装并首次启动。
4. 识别当前电脑上已经安装的 AI 工具。
5. 修改配置前备份现有配置。
6. 添加第一个供应商配置。
7. 填写 Base URL、API Key 和模型名称。
8. 测试连接并切换为当前配置。
9. 打开对应工具完成一次最小测试。
10. 配置错误时切回原配置或恢复备份。

必须引用：

- CC-Switch 唯一官方站点：<https://ccswitch.io>
- CC-Switch 官方仓库：<https://github.com/farion1231/cc-switch>
- CC-Switch 官方 Releases：<https://github.com/farion1231/cc-switch/releases/latest>

### 第二章：获取并保存 API Key

首批覆盖以下官方模型服务：

- DeepSeek。
- OpenAI。
- Anthropic Claude。
- Google Gemini。
- Kimi / Moonshot AI。
- 通义千问 / 阿里云百炼。
- 豆包 / 火山方舟。

每个服务使用同一模板：

1. 适合的用户和任务。
2. 国内是否可以直接访问。
3. 官方注册或控制台入口。
4. 是否需要实名认证、充值或绑定支付方式。
5. API Key 创建位置。
6. 创建后立即复制和安全保存。
7. 官方 Base URL。
8. 当前推荐模型名称。
9. CC-Switch 中对应的工具和配置位置。
10. 最小连接测试。
11. 成功标志。
12. 余额、权限、模型名或网络错误的快速排查。

DeepSeek 至少引用：

- API Key：<https://platform.deepseek.com/api_keys>
- 官方 API 文档：<https://api-docs.deepseek.com/>

其他模型服务的入口、Base URL 和模型名必须在实施时从各厂商官方文档重新核对，并在页面标注核对日期。不得根据第三方文章填写配置值。

### API Key 安全规则

页面必须明确说明：

- API Key 不是下载文件，而是在模型平台创建后复制的密钥。
- 页面示例统一使用 `YOUR_API_KEY_HERE` 等明显占位符。
- 不要把密钥发给他人、放入截图、聊天记录或公开仓库。
- 不要把密钥直接写入会提交到 Git 的项目文件。
- 建议在模型平台设置余额提醒、消费限额或低额充值。
- 怀疑泄露时立即删除旧 Key 并创建新 Key。
- 不引导用户在不可信网页中粘贴官方 API Key。

### 第三章：选择 AI 工具并完成第一次任务

首批工具选择：

#### 国内基础

- 腾讯 Marvis。
- 腾讯 CodeBuddy。
- TRAE 国内版。
- 通义灵码。
- DeepSeek 官方产品。

#### 进阶开发

- OpenAI Codex。
- Claude Code。
- Cursor。
- Gemini CLI。
- GitHub Copilot。
- OpenClaw。

每个工具使用统一短模板：

1. 它最适合完成什么。
2. 网络、账号和付费条件。
3. 官方主页、官方文档和官方下载入口。
4. 最短安装步骤。
5. 必要配置。
6. 一条可以直接复制的第一次任务。
7. 看到什么表示配置成功。
8. 最常见的两到三个问题。
9. 推荐的下一步工具或 Skill。

用户在选择卡片中先比较工具，展开后再阅读具体步骤。所有官方链接在实施时逐一核对，不使用名称相近的仿冒站点。

## 文档二：编程工作流心得

### 目标

把“AI 编程经验”改写成一套可以直接执行的开发流程，让用户知道什么时候调用哪个 Skill，以及调用后应该做什么。

### 第一次开发任务

使用一个小型静态网页任务贯穿全文，流程为：

1. 打开项目目录。
2. 告诉 AI 最终想实现什么。
3. 让 AI 阅读 `README.md`、`AGENTS.md` 和现有文件。
4. 使用 Brainstorming 明确需求和边界。
5. 使用 Writing Plans 拆分实施步骤。
6. 使用 Test-Driven Development 或适合任务的执行流程修改代码。
7. 出错时使用 Systematic Debugging。
8. 完成后使用 Verification Before Completion。
9. 查看 Git 改动并保存版本。
10. 需要时使用 Requesting Code Review 或 Finishing a Development Branch。

每一步提供一条可复制指令、用户需要回答的问题、成功标志和下一步入口。

### Skills 选择区

#### 开发流程与质量

- Superpowers Brainstorming。
- Writing Plans。
- Test-Driven Development。
- Systematic Debugging。
- Requesting / Receiving Code Review。
- Verification Before Completion。
- Finishing a Development Branch。

#### 办公与资料处理

- Documents。
- PDF。
- Spreadsheets。
- Presentations。

#### 设计与内容

- ImageGen。
- Visualize。

#### 浏览器与自动化

- Browser Control。
- 与当前 Codex 环境匹配的自动化能力。

#### Skill 管理

- Skill Installer。
- Skill Creator。

每个 Skill 只回答：

1. 什么时候用。
2. 怎样明确调用。
3. 调用后用户要提供什么。
4. 输出完成后下一步做什么。
5. 官方说明或官方仓库在哪里。

Codex Skills 章节至少引用：

- Codex Skills 官方指南：<https://developers.openai.com/codex/skills>
- OpenAI Skills 官方仓库：<https://github.com/openai/skills>
- Agent Skills 开放规范：<https://agentskills.io/specification>

页面说明 Codex 中可以使用 `/skills` 或 `$skill-name` 明确调用 Skill，并使用 `$skill-installer` 安装精选 Skill。Superpowers 的具体来源、安装方式和版本在实施时从其官方仓库核对。

### 与苍虬手柄联动

加入一段完整示例：

1. 使用语音输入描述任务。
2. 使用手柄宏键确认或发送。
3. AI 开始工作后，由 AutoClipboard 将 Agent 状态同步到手柄。
4. 用户根据灯环或小屏判断工作中、等待授权、完成或阻塞。
5. 使用宏键粘贴下一条指令、确认操作或继续工作。

不得把基础蓝牙宏描述成必须依赖 AutoClipboard；Agent 状态和深度联动才需要软件保持运行。

## 文档三：OpenLess / Typeless

### 产品范围

本页只介绍以下两个产品：

- OpenLess：<https://openless.top/>，官方仓库 <https://github.com/Open-Less/openless>。
- Typeless：<https://www.typeless.com/zh-cn>，官方下载页 <https://www.typeless.com/zh-cn/downloads>。

不得将 OpenTypeless 当成 OpenLess，也不得使用名称相近的非官方 Typeless 中文站作为主要来源。

### 页面结构

1. 两款工具分别适合谁。
2. 国内访问、账号、收费和平台支持标签。
3. 下载与安装。
4. 首次启动和麦克风、辅助功能等必要权限。
5. 设置按住说话或全局语音快捷键。
6. 完成第一次语音转文字。
7. 在聊天窗口、代码编辑器和 AI 编程工具中测试。
8. 配置苍虬手柄宏键触发或确认语音输入。
9. 配合 AutoClipboard 完成语音、粘贴、发送和状态反馈流程。
10. 两款工具的选择建议。
11. 麦克风无声音、快捷键冲突、文字未插入和网络失败的快速排查。

对比内容以实测和官方说明为依据，不凭空宣称识别准确率、速度倍数或隐私能力。

## 页面交互与视觉设计

延续现有官网的深色背景、青色强调色、卡片、圆角和清晰的大标题，但隐藏资料使用独立 CSS，避免修改公开页面样式时意外影响资料站。

公共组件包括：

- 路线选择卡片。
- “国内直连”“可能需要科学上网”“需要 API Key”“付费”标签。
- 官方链接组。
- 步骤列表。
- 成功标志。
- 安全提醒。
- 常见问题折叠面板。
- 命令、配置和提示词复制按钮。
- 上一篇、下一篇和返回总纲导航。

交互要求：

- JavaScript 只用于复制、移动目录和少量渐进增强；关闭 JavaScript 后正文仍可阅读。
- 复制成功后显示短暂中文提示。
- 长教程使用原生 `details` 折叠，不隐藏关键安全提醒。
- 外部链接使用新窗口并添加 `noopener noreferrer`。
- 不加载第三方统计、广告或跟踪脚本。
- 桌面、平板和手机均不得横向溢出。

## 内容维护规则

- 页面显示“官方资料核对日期”。初版日期为 2026-07-26。
- API Base URL、模型名、下载文件名和安装命令必须从官方来源核对。
- 容易变化的模型名不得写成永久不变的事实，应标明“以官方控制台当前可选模型为准”。
- 每个外部工具至少保留一个稳定的官方主页或官方仓库入口。
- 每次更新优先检查 CC-Switch、API 平台入口、Codex Skills、OpenLess 和 Typeless。
- 不在正文中加入返利链接、推广码或来源不明的中转站。

## 测试与验收

### 自动检查

- 公开的 `index.html`、`shop.html`、`guide.html` 和页脚中不得出现隐藏目录名。
- 隐藏目录包含总纲和三份独立文档。
- 四个 HTML 页面都包含 `noindex, nofollow, noarchive`。
- `robots.txt` 禁止抓取隐藏目录。
- 三份文档之间的相对链接均存在。
- 所有外部链接包含安全属性。
- 页面包含 CC-Switch、API Key、DeepSeek、Codex、OpenClaw、Superpowers、OpenLess 和 Typeless 等核心内容。
- 页面不得匹配常见真实密钥格式；示例只能使用明显占位符。
- 复制按钮和无 JavaScript 阅读降级正常。

### 浏览器验收

在 1440×900 和 390×844 下检查：

- 总纲入口和三张文档卡片。
- CC-Switch 第一章及供应商配置步骤。
- 工具和 Skill 选择卡片。
- OpenLess / Typeless 对比和手柄联动流程。
- 页面目录、折叠内容、复制反馈和上一篇/下一篇导航。
- 无横向溢出、损坏图片、控制台错误或不可见文字。

### 链接验收

- 官方链接逐一检查目标域名和页面标题。
- 对需要登录的控制台链接，只验证目标属于官方域名，不尝试创建账号或密钥。
- 对国内和海外网络条件分别给出准确标签，不承诺第三方服务的可用性。

## 非目标

- 不实现账号登录、购买凭证验证或真正的付费访问控制。
- 不为每位购买者生成不同链接。
- 不在网页中存储或代管用户 API Key。
- 不替用户注册模型账号、充值或创建密钥。
- 不推荐来源不明的破解软件、共享账号或低价密钥。
- 不修改公开官网现有内容和导航，除增加根目录 `robots.txt` 的隐藏路径规则外。
- 不把完整的 CC-Switch、Codex、OpenClaw 或各模型官方文档复制到资料站；只提供小白可执行的最短流程和官方链接。
