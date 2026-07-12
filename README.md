# 苍虬 AI 编程手柄

苍虬 AI 编程手柄的静态产品落地页，用于部署到 GitHub Pages。项目不需要构建步骤，浏览器可直接加载页面文件。

## 文件结构

- `index.html`：页面结构、文案和购买链接的备用地址
- `styles.css`：页面样式、响应式布局与动效
- `script.js`：移动菜单、渐入增强和购买链接配置
- `assets/images/`：页面图片资源
- `tests/site.test.mjs`：自动化站点检查

## 本地预览

最简单的方式是直接用浏览器打开 `index.html`。

推荐在项目根目录启动静态服务器：

```bash
python -m http.server 8000
```

然后访问 <http://localhost:8000>。如果没有 `python` 命令，可使用环境随附或本机安装的任意 Python 3 来运行同一模块。

## 自动化测试

```bash
node --test tests/site.test.mjs
```

项目完成后应显示全部 11 项测试通过。

## 部署到 GitHub Pages

以下步骤从当前本地仓库开始：

1. 在 GitHub 新建一个空的公开仓库，不要初始化 README、License 或 `.gitignore`。
2. 确保本地分支名为 `main`：

   ```bash
   git branch -M main
   ```

3. 添加远程仓库：

   ```bash
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   ```

4. 推送代码：

   ```bash
   git push -u origin main
   ```

5. 打开 GitHub 仓库的 **Settings → Pages**，在 **Build and deployment** 中将 **Source** 设为 **Deploy from a branch**，选择分支 **main**、目录 **/ (root)**，然后点击 **Save**。
6. 等待部署完成，访问 `https://<用户名>.github.io/<仓库名>/`。如果仓库名就是 `<用户名>.github.io`（用户主页仓库），地址为 `https://<用户名>.github.io/`。

后续更新时运行：

```bash
git add .
git commit -m "描述本次更新"
git push
```

推送后 GitHub Pages 会自动重新部署。

## 维护说明

- 修改购买地址时，必须同时更新 `script.js` 中的 `PURCHASE_URL` 和 `index.html` 中各购买按钮的备用 `href`，保持两处一致。
- 页面文案在 `index.html` 中维护，图片放在 `assets/images/`，样式在 `styles.css` 中维护。
- 页面明确不展示价格；维护时不要添加价格信息。
- 外部闲鱼移动端购买链接可能因设备和浏览器不同而跳转，或尝试打开对应 App。

## 常见问题

- 页面显示 404：检查 Pages 是否选择 `main` 分支和 `/ (root)`，保存后再等待几分钟。
- 图片无法显示：检查路径、文件名和字母大小写；GitHub Pages 区分大小写。
- 仍看到旧内容：执行浏览器硬刷新后重试。
- 自定义域名配置不在本项目说明范围内。
