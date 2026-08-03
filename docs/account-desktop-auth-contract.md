# ZKO 网页账户与 AutoClipboard 登录契约

本契约连接静态网站、CloudBase 和 AutoClipboard。产品页面与软件本地功能始终允许匿名使用；只有账户余额、充值和云端权益要求登录。

## 部署对象

- CloudBase 环境：`zkolab-dev-d8gzrr41k9b933d9e`
- 区域：`ap-shanghai`
- Web SDK：`@cloudbase/js-sdk@3.7.1`
- 已登录网页事件函数：`zko-account-api`
- 桌面会话 HTTP 函数：`zko-desktop-auth`
- HTTP 地址：`https://zkolab-dev-d8gzrr41k9b933d9e-1462162031.ap-shanghai.app.tcloudbase.com/desktop-auth`

`account-config.js` 只能包含这些公开标识。CloudBase 管理凭据、支付商户密钥、验证码和桌面 refresh token 都不得进入仓库、URL 或日志。

## 网页登录与账户资料

网页使用 CloudBase `signInWithOtp({ email, options: { shouldCreateUser: true } })` 发送验证码，再调用本次请求返回的 `verifyOtp({ token })` 完成登录或首次注册。匿名和手机号登录保持关闭。

邮箱验证码仍是首次注册和账户找回入口。用户登录后可绑定唯一用户名，并通过 CloudBase 的邮箱安全链接设置密码；此后网页可使用 `signInWithPassword({ username, password })` 登录。密码、验证码和密码重置令牌始终由 CloudBase Auth 管理，不进入业务表。

业务账户单独保存：

- `display_name`：网页右上角和 AutoClipboard 展示名称；
- `full_name`：用户自行填写的姓名或称呼；
- `username`：与 CloudBase Auth 同步的小写唯一用户名；
- `avatar_file_id`：CloudBase 存储中的头像文件 ID，页面只接收短期签名 URL。

`zkolab.com` 与免费 CloudBase 托管域名当前是不同 Origin。公开页面只通过受限 `postMessage` bridge 或显式返回链接接收不含邮箱和 Token 的头像、显示名称与用户名缓存；所有账户写操作仍在 CloudBase 托管账户页完成。

网页登录后调用 `zko-account-api`：

- `action=overview`：幂等创建业务账户与钱包并返回余额、最近账目和支付配置状态。
- `action=checkUsername`：在保存前检查业务用户名是否可用。
- `action=updateProfile`：更新显示名称、姓名、用户名和经过大小与格式校验的头像。
- `action=authorizeDesktop`：将当前 CloudBase 用户绑定到一次性桌面登录票据。
- `action=createRecharge`：只在支付宝或微信商户 API 真正配置后创建订单；当前 fail closed，不使用普通收款码伪造自动到账。

云函数必须从 CloudBase 调用上下文获取用户 UID，不接受前端提交的用户 ID。

## 浏览器拉起桌面软件

AutoClipboard 在本机生成：

- `state`：至少 256 bit 随机值；
- `verifier`：PKCE 随机值，只留在本机；
- `code_challenge = HEX(SHA256(verifier))`；
- `device_instance_hash = HEX(SHA256(device_instance_id))`。

随后打开：

```text
https://zkolab-dev-d8gzrr41k9b933d9e-1462162031.tcloudbaseapp.com/account.html?desktop=1&state=...&code_challenge=...&device=...
```

网站账户设置中的“登录 AutoClipboard”会先拉起 `autoclipboard://auth/start`。已安装的软件收到该命令后自行生成上述 state、verifier、challenge 和设备哈希，再打开账户网页；网站不会代替桌面端生成 verifier。

网页完成登录后调用 `zko-account-api` 签发两分钟有效、只能使用一次的随机 code，并拉起：

```text
autoclipboard://auth/callback?code=...&state=...
```

自定义协议只携带一次性 code 和 state，不携带 CloudBase access token、refresh token 或桌面会话。

## 桌面换取会话

AutoClipboard 向 `zko-desktop-auth` POST：

```json
{
  "action": "redeem",
  "code": "one-time-code",
  "state": "original-state",
  "verifier": "local-pkce-verifier",
  "deviceInstanceId": "local-random-instance-id"
}
```

后端原子条件消费 code，校验 state、PKCE、设备哈希、过期时间和未使用状态，然后签发 30 天桌面 refresh token。数据库只保存 token 的 SHA-256；客户端只把明文 token 写入系统凭据库。

桌面端用 `Authorization: Bearer <refreshToken>` 调用同一 HTTP 函数：

- `action=me`：读取账户与余额；
- `action=logout`：撤销当前桌面会话。

## 支付边界

支付宝电脑网站支付和微信 Native 支付需要各自的商户 API 权限、私钥/证书、回调验签和正式可访问的回调地址。现有个人或商家静态收款码只能人工收款，不能证明某个网站订单已支付，也不能自动给钱包入账。

正式开放充值前，后端必须验证支付平台签名、商户订单号、平台订单号、金额和币种，并通过现有幂等账本函数入账。
