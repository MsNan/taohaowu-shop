// 淘好物 演示后端：Express + lowdb(JSON 文件) + JWT
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { JSONFilePreset } from 'lowdb/node'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (await import('node:crypto')).randomBytes(32).toString('hex') : 'taohaowu-dev-secret')
const PAY_TIMEOUT_MS = Number(process.env.PAY_TIMEOUT_MS || 15 * 60 * 1000)
const DEV = process.env.NODE_ENV !== 'production'

const seed = JSON.parse(readFileSync(path.join(__dir, 'seed.json'), 'utf8'))
const dataDir = path.join(__dir, 'data'); if (!existsSync(dataDir)) mkdirSync(dataDir)
const db = await JSONFilePreset(path.join(dataDir, 'db.json'), {
  users: [], codes: {}, carts: {}, addresses: [], orders: [], afterSales: [], rewards: [], seq: 1
})
// 商品/分类/轮播首次启动时从 seed.json 导入数据库，之后由管理后台维护
db.data.products ||= seed.products.map(p => ({ onSale: true, stock: 999, ...p }))
db.data.categories ||= seed.categories
db.data.banners ||= seed.banners
db.data.rewards ||= []
if (db.data.seq < 1000) db.data.seq = 1000
await db.write()
const onSale = () => db.data.products.filter(p => p.onSale !== false)
const findP = id => db.data.products.find(p => p.id === Number(id))
const nid = () => db.data.seq++

const app = express()
app.use(cors()); app.use(express.json())
app.use('/images', express.static(path.join(__dir, 'public/images'), { maxAge: '7d' }))
const ok = (res, data) => res.json({ code: 0, data })
const fail = (res, msg, status = 400) => res.status(status).json({ code: status, message: msg })

function auth(req, res, next) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '')
  try { req.uid = jwt.verify(t, SECRET).uid; if (!req.uid || db.data.users.find(u => u.id === req.uid)?.disabled) throw 0; next() } catch { fail(res, '请先登录', 401) }
}

// 超时未支付自动取消
function sweep() {
  const now = Date.now(); let changed = false
  for (const o of db.data.orders) if (o.status === '待付款' && now > o.expireAt) { o.status = '已取消'; o.cancelReason = '超时未支付'; changed = true }
  if (changed) db.write()
}
setInterval(sweep, 10 * 1000)

// ---------- 商品 ----------
app.get('/api/home', (req, res) => ok(res, { banners: db.data.banners, categories: db.data.categories, products: onSale() }))
app.get('/api/categories', (req, res) => ok(res, db.data.categories))
app.get('/api/banners', (req, res) => ok(res, db.data.banners))
app.get('/api/products', (req, res) => {
  let list = onSale()
  const { q, categoryId, sort } = req.query
  if (q) list = list.filter(p => p.name.toLowerCase().includes(String(q).toLowerCase()) || p.shop.includes(q))
  if (categoryId) list = list.filter(p => p.categoryId === Number(categoryId))
  if (sort === 'sales') list = [...list].sort((a, b) => b.sales - a.sales)
  if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price)
  ok(res, list)
})
app.get('/api/products/:id', (req, res) => { const p = findP(req.params.id); p ? ok(res, p) : fail(res, '商品不存在', 404) })

// ---------- 登录 ----------
app.post('/api/auth/sms', async (req, res) => {
  const { phone } = req.body
  if (!/^1\d{10}$/.test(phone || '')) return fail(res, '手机号格式不正确')
  const code = String(Math.floor(100000 + Math.random() * 900000))
  db.data.codes[phone] = { code, exp: Date.now() + 5 * 60 * 1000 }; await db.write()
  console.log(`[模拟短信] ${phone} 验证码 ${code}`)
  ok(res, DEV ? { devCode: code } : {})
})
app.post('/api/auth/login', async (req, res) => {
  const { phone, code } = req.body
  const c = db.data.codes[phone]
  if (!c || c.code !== String(code) || Date.now() > c.exp) return fail(res, '验证码错误或已过期')
  delete db.data.codes[phone]
  let u = db.data.users.find(u => u.phone === phone)
  if (!u) { u = { id: nid(), phone, nickname: '淘友' + phone.slice(-4), createdAt: Date.now() }; db.data.users.push(u) }
  if (u.disabled) return fail(res, '账号已被禁用', 403)
  await db.write()
  ok(res, { token: jwt.sign({ uid: u.id }, SECRET, { expiresIn: '30d' }), user: u })
})
app.get('/api/me', auth, (req, res) => ok(res, db.data.users.find(u => u.id === req.uid)))

// ---------- 购物车 ----------
const cartOf = uid => (db.data.carts[uid] ||= [])
const cartView = uid => cartOf(uid).map(i => ({ ...i, product: findP(i.productId) })).filter(i => i.product)
app.get('/api/cart', auth, (req, res) => ok(res, cartView(req.uid)))
function addItem(uid, { productId, spec = '', qty = 1, checked = true }) {
  if (!findP(productId)) return
  const c = cartOf(uid), key = productId + '|' + spec
  const f = c.find(i => i.key === key)
  if (f) f.qty += Number(qty); else c.push({ key, productId: Number(productId), spec, qty: Number(qty), checked })
}
app.post('/api/cart', auth, async (req, res) => { addItem(req.uid, req.body); await db.write(); ok(res, cartView(req.uid)) })
app.post('/api/cart/merge', auth, async (req, res) => { (req.body.items || []).forEach(i => addItem(req.uid, i)); await db.write(); ok(res, cartView(req.uid)) })
app.put('/api/cart/:key', auth, async (req, res) => {
  const f = cartOf(req.uid).find(i => i.key === req.params.key)
  if (!f) return fail(res, '不存在', 404)
  if (req.body.qty !== undefined) f.qty = Math.max(1, Number(req.body.qty))
  if (req.body.checked !== undefined) f.checked = !!req.body.checked
  await db.write(); ok(res, cartView(req.uid))
})
app.put('/api/cart', auth, async (req, res) => { cartOf(req.uid).forEach(i => (i.checked = !!req.body.checked)); await db.write(); ok(res, cartView(req.uid)) })
app.delete('/api/cart/:key', auth, async (req, res) => { db.data.carts[req.uid] = cartOf(req.uid).filter(i => i.key !== req.params.key); await db.write(); ok(res, cartView(req.uid)) })

// ---------- 地址 ----------
const myAddr = uid => db.data.addresses.filter(a => a.uid === uid).sort((a, b) => b.isDefault - a.isDefault)
app.get('/api/addresses', auth, (req, res) => ok(res, myAddr(req.uid)))
app.post('/api/addresses', auth, async (req, res) => {
  const { name, phone, region, detail, isDefault } = req.body
  if (!name || !/^1\d{10}$/.test(phone || '') || !region || !detail) return fail(res, '请完整填写收货信息')
  const a = { id: nid(), uid: req.uid, name, phone, region, detail, isDefault: !!isDefault || myAddr(req.uid).length === 0 }
  if (a.isDefault) myAddr(req.uid).forEach(x => (x.isDefault = false))
  db.data.addresses.push(a); await db.write(); ok(res, a)
})
app.put('/api/addresses/:id', auth, async (req, res) => {
  const a = db.data.addresses.find(a => a.id === Number(req.params.id) && a.uid === req.uid)
  if (!a) return fail(res, '地址不存在', 404)
  if (req.body.isDefault) myAddr(req.uid).forEach(x => (x.isDefault = false))
  Object.assign(a, { ...req.body, id: a.id, uid: a.uid }); await db.write(); ok(res, a)
})
app.delete('/api/addresses/:id', auth, async (req, res) => {
  db.data.addresses = db.data.addresses.filter(a => !(a.id === Number(req.params.id) && a.uid === req.uid))
  const rest = myAddr(req.uid); if (rest.length && !rest.some(a => a.isDefault)) rest[0].isDefault = true
  await db.write(); ok(res, true)
})

// ---------- 订单 ----------
const myOrder = (uid, id) => db.data.orders.find(o => o.uid === uid && o.id === String(id))
app.post('/api/orders', auth, async (req, res) => {
  const { items, addressId, remark = '', fromCart } = req.body
  const addr = db.data.addresses.find(a => a.id === Number(addressId) && a.uid === req.uid)
  if (!addr) return fail(res, '请选择收货地址')
  if (!items?.length) return fail(res, '没有商品')
  const lines = items.map(i => { const p = findP(i.productId); return p && { productId: p.id, name: p.name, image: p.images[0], price: p.price, spec: i.spec, qty: Number(i.qty) } }).filter(Boolean)
  const goods = lines.reduce((t, i) => t + i.price * i.qty, 0)
  const discount = goods >= 300 ? 50 : 0
  const now = Date.now()
  const o = { id: 'TB' + now + Math.floor(Math.random() * 100), uid: req.uid, items: lines, goodsAmount: goods, discount, freight: 0,
    total: Math.round((goods - discount) * 100) / 100, address: { ...addr }, remark, status: '待付款', createdAt: now, expireAt: now + PAY_TIMEOUT_MS, timeline: [{ t: now, s: '订单已提交' }] }
  db.data.orders.unshift(o)
  if (fromCart) { const keys = new Set(items.map(i => i.productId + '|' + i.spec)); db.data.carts[req.uid] = cartOf(req.uid).filter(i => !keys.has(i.key)) }
  await db.write(); ok(res, o)
})
app.get('/api/orders', auth, (req, res) => { sweep(); const { status } = req.query; ok(res, db.data.orders.filter(o => o.uid === req.uid && (!status || o.status === status))) })
app.get('/api/orders/:id', auth, (req, res) => { sweep(); const o = myOrder(req.uid, req.params.id); o ? ok(res, { ...o, afterSale: db.data.afterSales.find(a => a.orderId === o.id) }) : fail(res, '订单不存在', 404) })
function transit(from, to, msg, extra) {
  return async (req, res) => {
    sweep(); const o = myOrder(req.uid, req.params.id)
    if (!o) return fail(res, '订单不存在', 404)
    if (!from.includes(o.status)) return fail(res, `当前状态「${o.status}」不可操作`)
    o.status = to; o.timeline.push({ t: Date.now(), s: msg }); extra?.(o, req); await db.write(); ok(res, o)
  }
}
app.post('/api/orders/:id/pay', auth, transit(['待付款'], '待发货', '支付成功（模拟）', (o, req) => { o.payMethod = req.body.method || '支付宝'; o.paidAt = Date.now() }))
app.post('/api/orders/:id/cancel', auth, transit(['待付款'], '已取消', '用户取消订单', o => (o.cancelReason = '用户取消')))
app.post('/api/orders/:id/ship', auth, transit(['待发货'], '待收货', '商家已发货（模拟）· 顺丰速运 SF1234567890', o => (o.shippedAt = Date.now())))
app.post('/api/orders/:id/confirm', auth, transit(['待收货'], '已完成', '已确认收货，交易完成'))

// ---------- 售后 ----------
app.post('/api/orders/:id/aftersale', auth, async (req, res) => {
  const o = myOrder(req.uid, req.params.id)
  if (!o) return fail(res, '订单不存在', 404)
  if (!['待发货', '待收货', '已完成'].includes(o.status)) return fail(res, '该订单不支持售后')
  if (db.data.afterSales.some(a => a.orderId === o.id)) return fail(res, '已提交过售后申请')
  const { type, reason, desc = '' } = req.body
  if (!type || !reason) return fail(res, '请选择售后类型和原因')
  const a = { id: nid(), orderId: o.id, uid: req.uid, type, reason, desc, amount: o.total, status: '待商家处理', createdAt: Date.now() }
  db.data.afterSales.push(a); o.afterSaleStatus = a.status; o.timeline.push({ t: Date.now(), s: `申请售后：${type}` })
  await db.write(); ok(res, a)
})
app.get('/api/aftersales', auth, (req, res) => ok(res, db.data.afterSales.filter(a => a.uid === req.uid)))

// ---------- 打赏 / 版本 / 管理后台 ----------
import { mountAdmin } from './admin.js'
import { EDITION, features } from './edition.js'
app.get('/api/edition', (req, res) => ok(res, { edition: EDITION, features }))
app.get('/api/reward/config', (req, res) => ok(res, { wechat: '/images/reward/wechat.jpg', alipay: '/images/reward/alipay.jpg', tip: '打赏全凭自愿，感谢支持！' }))
app.post('/api/rewards', async (req, res) => {
  const { channel, amount, nickname = '匿名', message = '' } = req.body || {}
  if (!['微信', '支付宝'].includes(channel)) return fail(res, '请选择打赏渠道')
  const amt = Math.round(Number(amount) * 100) / 100
  if (!(amt > 0 && amt <= 10000)) return fail(res, '金额不正确')
  const r = { id: nid(), channel, amount: amt, nickname: String(nickname).slice(0, 20), message: String(message).slice(0, 200), status: '待核对', createdAt: Date.now() }
  db.data.rewards.unshift(r); await db.write(); ok(res, r)
})
mountAdmin(app, { db, ok, fail, findP, nid, SECRET, express, dir: __dir })

app.get('/favicon.ico', (req, res) => res.status(204).end())
// 可选：同端口托管 H5 构建产物
const h5 = path.join(__dir, '../dist/build/h5')
if (existsSync(h5)) app.use(express.static(h5))
app.listen(PORT, () => console.log(`淘好物 server http://localhost:${PORT}`))
