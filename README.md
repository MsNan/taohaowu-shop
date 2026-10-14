# 淘好物 —— uni-app 多端电商（前端 + 演示后端）

一套代码同时发布 **H5、微信小程序、Android、iOS**。前端基于 uni-app（Vue 3 + Vite）+ Pinia + uni-ui（uni-icons），后端为 Node.js + Express + lowdb（JSON 文件数据库）+ JWT。

## 功能一览
- 首页（搜索、轮播、金刚区、秒杀倒计时、商品流）、分类、搜索（历史/热搜/结果排序）
- 商品详情、规格选择弹层、加入购物车 / 立即购买
- 购物车（勾选、全选、数量、删除、满减提示）；**游客购物车登录后自动合并**
- 手机号 + 验证码登录（模拟短信，开发模式在页面上直接显示验证码）
- 收货地址列表 / 新增 / 编辑 / 默认地址
- 确认订单 → 模拟收银台支付 → 支付结果
- 订单列表 / 订单详情（状态：待付款 → 待发货 → 待收货 → 已完成；已取消），**未支付 15 分钟自动取消**
- 售后申请（仅退款 / 退货退款 / 换货）
- 我的（订单角标、工具入口、退出登录）

## 目录
```
src/                 前端（pages、components、store、api、utils）
  api/request.js     接口封装（自动带 JWT）
  config.js          接口地址（读取 .env 中的 VITE_API_BASE）
server/              后端
  index.js           Express 服务与全部 REST 接口
  seed.json          商品/分类/轮播种子数据
  public/images/     本地商品图片（离线可用）
  data/db.json       运行时自动生成的数据库文件（删除即重置）
```

## 一、启动后端
```bash
cd server
npm install
npm start            # 默认 http://localhost:3000
```
可选环境变量：`PORT`（端口）、`JWT_SECRET`（JWT 密钥，生产必须修改）、`PAY_TIMEOUT_MS`（未支付超时，默认 900000 = 15 分钟）、`NODE_ENV=production`（生产模式下不再返回验证码）。

模拟短信验证码会打印在后端控制台，开发模式下也会显示在登录页。

## 二、运行 H5
根目录 `.env` 中配置接口地址（默认 `VITE_API_BASE=http://localhost:3000`）。
```bash
npm install
npm run dev:h5       # 开发调试
npm run build:h5     # 产物：dist/build/h5
```
构建后后端会自动托管 `dist/build/h5`，直接访问 http://localhost:3000 即可使用完整 H5。

## 三、微信小程序
```bash
npm run build:mp-weixin      # 或 npm run dev:mp-weixin（监听修改）
```
1. 打开「微信开发者工具」→ 导入项目，目录选择 `dist/build/mp-weixin`（dev 模式为 `dist/dev/mp-weixin`）。
2. AppID 可使用测试号；正式发布请在 `src/manifest.json` → `mp-weixin.appid` 填写自己的小程序 AppID。
3. 本地调试请在开发者工具「详情 → 本地设置」勾选 **不校验合法域名**（项目已默认 `urlCheck: false`）。
4. 真机预览时手机无法访问 `localhost`，请把 `.env` 改为电脑局域网 IP（如 `http://192.168.1.10:3000`）后重新构建；正式上线必须使用已备案的 **HTTPS 域名**，并在小程序后台配置 request 与 downloadFile 合法域名。

## 四、Android / iOS App（HBuilderX）
1. 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)，「文件 → 打开目录」选择本项目根目录（HBuilderX 可识别 CLI 项目）。
2. 打开 `src/manifest.json`，在「基础配置」中点击「重新获取」生成 DCloud AppID，设置应用名称、图标、启动图。
3. 将 `.env` 中的 `VITE_API_BASE` 改为手机可访问的服务器地址（公网 HTTPS 域名或局域网 IP）。
4. 「运行 → 运行到手机或模拟器」可真机调试。
5. 「发行 → 原生 App-云打包」：
   - 需要登录 **DCloud 账号**（云打包有免费额度/排队）。
   - **Android**：可使用 DCloud 公共测试证书，或上传自己的 keystore，生成 APK。
   - **iOS**：必须拥有 **Apple 开发者账号**，提供证书（.p12）及密码、描述文件（.mobileprovision），生成 IPA；上架需通过 App Store 审核。
6. 也可执行 `npm run build:app` 生成 App 资源后使用离线打包 SDK（Android Studio / Xcode）。

## 五、部署后端
1. 服务器安装 Node.js 18+，上传项目（或仅 `server/` 与 `dist/build/h5`）。
2. `cd server && npm install --omit=dev`
3. 使用 pm2 守护：
   ```bash
   npm i -g pm2
   NODE_ENV=production JWT_SECRET=请换成随机长字符串 pm2 start index.js --name taohaowu
   ```
4. 用 Nginx 反向代理到 3000 端口并配置 HTTPS 证书，例如：
   ```nginx
   server {
     listen 443 ssl; server_name api.example.com;
     ssl_certificate /path/fullchain.pem; ssl_certificate_key /path/privkey.pem;
     location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
   }
   ```
5. 前端 `.env` 改为 `VITE_API_BASE=https://api.example.com` 后重新构建各端。
6. 注意：lowdb 为单文件数据库，仅适合演示/小流量；正式环境建议替换为 MySQL/PostgreSQL，并接入真实短信服务与微信/支付宝支付。

## 主要接口
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/home | 轮播、分类、商品 |
| GET | /api/products?q=&categoryId=&sort= | 商品搜索/筛选（sort: sales/price_asc/price_desc） |
| GET | /api/products/:id | 商品详情 |
| POST | /api/auth/sms | 发送验证码（模拟） |
| POST | /api/auth/login | 验证码登录，返回 JWT |
| GET/POST/PUT/DELETE | /api/cart[/:key] | 购物车 |
| POST | /api/cart/merge | 合并游客购物车 |
| GET/POST/PUT/DELETE | /api/addresses[/:id] | 收货地址 |
| POST/GET | /api/orders[/:id] | 创建/查询订单 |
| POST | /api/orders/:id/pay·cancel·ship·confirm | 模拟支付/取消/发货/确认收货 |
| POST | /api/orders/:id/aftersale | 申请售后 |

## 端到端测试
后端启动并构建 H5 后：`node tests/e2e.cjs（截图输出到 /workspace/shop-test，可修改脚本中的 OUT）`（puppeteer-core + 无头 Chrome，覆盖浏览→搜索→详情→规格→加购→登录→地址→下单→支付→订单→售后）。
