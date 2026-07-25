# ZKO 使用说明新手化改写设计

## 目标

根据本地 `D:\document\kki\handle\Communist-Manifesto-Releases` 的中文 README、完整用户指南、平台安装说明和最新 Release 附件，重写官网 `guide.html`。页面首先帮助普通用户把手柄用起来，再解释常用操作和排障；完整技术细节继续交给发布仓库文档。

## 信息依据与纠错原则

- Windows 与 Ubuntu 已经过成熟测试，作为正式支持平台展示。
- macOS 已提供 DMG 安装包，但仍处于测试阶段；页面必须清楚标注，不把它描述成与 Windows、Ubuntu 相同的成熟度。
- Windows 安装包格式为 `AutoClipboardSetup-<version>.exe`。
- Ubuntu 安装包格式为 `auto-clipboard_<version>_<arch>.deb`。
- macOS 安装包格式为 `AutoClipboard-<version>-macOS.dmg`。
- CH343 驱动只作为 Windows Type-C 串口识别问题的处理入口，不让 Ubuntu 或 macOS 用户误以为日常蓝牙连接必须安装该驱动。
- 蓝牙键盘宏与 AutoClipboard BLE/GATT 软件会话是两条不同链路；“宏键能输入但软件未连接”不等于蓝牙配对失败。
- 基础蓝牙宏不依赖 AutoClipboard；Agent 状态、Profile 快开、IMU、深度配置等功能需要软件保持运行。
- 固件刷写不是首次使用步骤。页面只保留安全提醒并引导到完整发布仓库文档。

## 页面信息架构

### 1. 首屏

标题改为更直接的“第一次使用，从这里开始”。说明普通用户只需完成下载、蓝牙配对和一次按键测试。首屏继续保留 Gitee 与 GitHub 两个正式发布入口。

首屏下方新增三平台状态卡：

- Windows：成熟测试，下载 `.exe`。
- Ubuntu：成熟测试，下载 `.deb`。
- macOS：测试中，下载 `.dmg`，遇到兼容性问题时反馈版本和现象。

状态卡只描述支持成熟度和文件选择，不堆叠安装器内部实现。

### 2. 新手快速开始

将首次使用改为六步：

1. 按操作系统下载 AutoClipboard。
2. 安装并启动软件。
3. 给手柄充电并唤醒。
4. 在系统蓝牙设置中连接完整名称 `CommunistKB-XXXX`。
5. 等待小屏从 `PAIR` 变成 `LINK`。
6. 在纯文本输入框测试宏键，再启动 AutoClipboard 使用完整功能。

每一步只回答“现在做什么”和“看到什么算成功”，避免使用 bootstrap、GATT、Hook 等新手不需要立即理解的术语。

### 3. 按系统安装

独立增加“选择你的系统”章节，用三个平级卡片说明：

- Windows：运行 `.exe` 安装包；只有 Type-C 串口不识别时才查看 CH343 驱动。
- Ubuntu：安装 `.deb`；正常情况下优先使用系统图形蓝牙设置。只有设备名称无法显示时，才去完整文档查看 `bluetoothctl` 兜底流程。
- macOS：打开 `.dmg` 并把应用放入应用程序目录；明确当前仍在测试，出现问题时保留 macOS 版本、AutoClipboard 版本和截图。

提供“文件名怎么选”简表，防止用户下载固件包或 Skill 压缩包当成桌面软件。

### 4. 连接与日常操作

保留并简化以下内容：

- 认识硬件：Type-C、小屏、波轮、中键、四枚宏键、灯环。
- 看懂 `PAIR`、`WAIT`、`LINK`。
- 首次蓝牙配对。
- 连接第二台或第三台电脑。
- 正常页面与 Settings 中波轮/中键的不同作用。
- AutoClipboard 能做什么，以及哪些功能离不开它。

技术名词第一次出现时先用中文解释。例如：Profile 写成“使用场景配置（Profile）”，Agent Hook/Bridge 写成“把编程助手状态发送给 AutoClipboard 的连接配置”。

### 5. 故障排查

改为按用户现象组织的短答案：

- 搜不到手柄。
- 已配对但宏键不能输入。
- 宏键能输入，但 AutoClipboard 显示未连接。
- 没有 Agent 状态。
- Windows 插入 Type-C 后没有 COM 端口。
- Ubuntu 蓝牙列表只有无名地址。
- macOS 测试版出现启动或连接问题。

每项先给 2～4 个低风险检查，再引导到发布仓库完整指南。不得建议用户把删配对、重置蓝牙或刷固件作为第一步。

## 视觉与响应式设计

沿用现有深色首屏、大标题、卡片和青色强调色，不重新设计全站。新增组件仅包括：

- `.platform-status-grid` 与 `.platform-status-card`：三平台支持状态。
- `.platform-guide-grid` 与 `.platform-guide-card`：按系统安装。
- `.support-badge`：成熟测试或测试中标签。
- `.plain-language-note`：面向新手的重要说明。

桌面端使用三列，平板变为单列或两列，移动端统一单列。所有卡片必须无横向溢出，标签不能只依赖颜色传达状态。

## 测试与验收

自动化测试必须验证：

- 页面同时出现 Windows、Ubuntu、macOS。
- Windows 和 Ubuntu 明确标注“成熟测试”。
- macOS 明确标注“测试中”，且不得声称三个系统成熟度相同。
- 三种桌面软件安装包格式正确。
- CH343 被明确限制为 Windows 串口驱动场景。
- 快速开始包含下载、安装、配对、`PAIR`、`LINK` 和纯文本宏键测试。
- 页面解释基础宏与 AutoClipboard 完整功能的区别。
- 现有 Gitee、GitHub、驱动链接和外部链接安全属性继续有效。

浏览器验收覆盖 1440×900 与 390×844，检查三平台卡片、快速步骤、目录、移动菜单、故障排查和新样式；要求无横向溢出、无控制台错误、无损坏图片。

## 非目标

- 不修改发布仓库 README 或安装包。
- 不实现自动识别操作系统或自动下载。
- 不在网页中复制完整的高级固件维护、Agent Bridge 或 `bluetoothctl` 技术流程。
- 不改变商城和首页内容。
