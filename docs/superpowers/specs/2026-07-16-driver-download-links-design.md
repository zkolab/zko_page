# 驱动下载入口设计

## 目标

将 `CH343SER.EXE` 作为附件加入 `Lijinzh/Communist-Manifesto-Releases` 当前最新的 `v0.3.48` Release，并在 `shenqiqishi/zko_page` 的“软件协同”区域提供清晰的相关文件入口。

## 发布方式

- 不创建独立的驱动版本，避免把 AutoClipboard 的版本列表拆散。
- 将 `CH343SER.EXE` 附加到现有 `v0.3.48` Release。
- 页面链接指向该 Release 页面，用户可在 Assets 中下载镜像文件。
- 同时保留沁恒官方驱动下载页，方便用户核对版本和获取官方说明。

## 页面设计

在现有“软件协同”内容中新增“相关文件”卡片，包含两个外部链接：

1. `GitHub Release 下载`：指向 AutoClipboard `v0.3.48` Release。
2. `沁恒官方驱动页`：指向 `https://www.wch.cn/downloads/CH343SER_EXE.html`。

两个链接均在新窗口打开，并使用 `rel="noopener noreferrer"`。文案会明确 GitHub Release 内含 `CH343SER.EXE` 镜像，官方页面用于查看驱动说明和最新版本。

## 验证标准

- Release API 显示 `v0.3.48` 包含名为 `CH343SER.EXE` 的附件。
- 页面测试覆盖两个准确的外部链接和安全属性。
- 现有站点测试全部通过。
- 推送后 GitHub Pages 返回成功状态，并能在已部署 HTML 中找到两个链接。
