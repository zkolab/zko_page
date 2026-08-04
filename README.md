# 苍虬 AI 编程手柄

苍虬 AI 编程手柄的静态产品落地页，用于部署到 GitHub Pages。项目不需要构建步骤，浏览器可直接加载页面文件。

## 文件结构

- `index.html`：页面结构、文案和购买链接的备用地址
- `account.html`：CloudBase 验证码登录、钱包、充值和 AutoClipboard 授权页面
- `account.js` / `account-config.js`：账户交互与公开的 CloudBase 环境/函数配置
- `styles.css`：页面样式、响应式布局与动效
- `script.js`：移动菜单、渐入增强和购买链接配置
- `assets/images/`：页面图片资源
- `assets/vendor/`：固定版本、自托管的 CloudBase Web SDK 及许可证
- `docs/account-desktop-auth-contract.md`：网页、CloudBase 后端与桌面端的接口契约
- `tests/site.test.mjs`：自动化站点检查

## 本地预览

普通产品页面可以直接用浏览器打开。账户页必须通过 HTTP(S) 访问，不能使用 `file://`，否则 CloudBase 的域名校验和网络请求无法正常工作。

推荐在项目根目录启动静态服务器：

```bash
python -m http.server 8000
```

然后访问 <http://localhost:8000>。Windows 用户也可以使用 Python Launcher：

```bash
py -m http.server 8000
```

如果没有 `python` 或 `py` 命令，可使用环境随附或本机安装的任意 Python 3 来运行同一模块。

账户页地址为 <http://localhost:8000/account.html>。免费体验套餐不能新增自有身份验证安全域名，因此正式账户页部署到 CloudBase 自带安全域名；`zkolab.com/account.html` 会保留查询参数并自动跳转过去。升级到支持自有安全域名的套餐后，可只修改 `account-config.js` 和桌面端账户入口切回自有域名。

## 自动化测试

测试需要 Node.js 18 或更高版本；如果没有 `node` 命令，请先安装当前的 Node.js LTS 版本。

```bash
node --test tests/site.test.mjs
```

运行后，当前测试应全部通过。

## 部署到 GitHub Pages

以下步骤从当前本地仓库开始：

1. 在 GitHub 新建一个空的公开仓库，不要初始化 README、License 或 `.gitignore`。
2. 在改动分支名前，先查看当前分支和工作区状态：

   ```bash
   git branch --show-current
   git status
   ```

   本项目的工作整合完成后，如果当前分支就是准备首次部署的分支，并且本地尚不存在 `main`，可用非强制方式将当前分支改名：

   ```bash
   git branch -m main
   ```

   如果 `main` 已存在，不要改名或覆盖它；应先有意识地切换到 `main`，或将本项目分支合并进去。以下步骤假定最终要部署的完整内容已经位于 `main`。

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
git status --short
git add README.md
# 或按实际修改明确暂存，例如：
git add index.html styles.css script.js
git add assets/images/要更新的图片.webp
git diff --cached
git commit -m "描述本次更新"
git push
```

只暂存本次确实要发布的路径；不要无意中加入项目根目录下的编号源图片或文案文本。确认 `git diff --cached` 内容正确后再提交。推送后 GitHub Pages 会自动重新部署。

## 维护说明

- 当前购买地址为 <https://m.tb.cn/h.802lN7o?tk=phNwgK0gm5B>。修改购买地址时，必须同时更新 `script.js` 中的 `PURCHASE_URL` 和 `index.html` 中各购买按钮的备用 `href`，保持两处一致。
- Windows 直接下载入口默认使用 Gitee，GitHub 作为备用。发布新 Windows 安装包后，必须同时更新 `script.js` 中的 `AUTOCLIPBOARD_WINDOWS_VERSION`、三个公开页面中的备用 `href` 和 `tests/site.test.mjs` 中的版本断言；不要使用可能指向无 EXE Release 的 `latest/download`。
- 页面文案在 `index.html` 中维护，图片放在 `assets/images/`，样式在 `styles.css` 中维护。
- 账户页公开配置只允许包含环境 ID、区域、函数名和回调协议。CloudBase 管理凭据、支付商户私钥、APIv3 key、平台证书和桌面 refresh token 禁止进入本仓库。
- 全站右上角账户区展示头像、显示名称和用户名；账户中心把“注册账号”和“登录已有账号”明确分开。注册时一次填写邮箱、用户名和密码，邮箱验证码通过后由 CloudBase Auth 创建账户；已有用户可使用用户名密码或邮箱验证码登录。姓名与头像仍在个人资料中单独设置，业务数据库不保存密码。
- `account-bridge.html` 只向 `zkolab.com` / `www.zkolab.com` 返回不含邮箱和 Token 的显示资料，用于跨域同步右上角登录状态；账户写操作仍只在 CloudBase 托管账户页执行。
- 网页账户与授权依赖 `zko-account-api` 云函数；桌面端使用公开的 `zko-desktop-auth` HTTP 函数完成一次性 code + PKCE 换取会话。接口契约见 `docs/account-desktop-auth-contract.md`。
- 产品展示页明确不展示商品售价；账户页的充值金额不属于商品定价。
- `m.tb.cn` 是短链接域名；当前外链会根据设备、浏览器和 App 状态打开或重定向到闲鱼商品页面，也可能尝试唤起闲鱼 App。

## 常见问题

- 页面显示 404：检查 Pages 是否选择 `main` 分支和 `/ (root)`，保存后再等待几分钟。
- 图片无法显示：检查路径、文件名和字母大小写；GitHub Pages 区分大小写。
- 仍看到旧内容：执行浏览器硬刷新后重试。
- 自定义域名配置不在本项目说明范围内。
