// 管理后台接口 + 静态页面（/admin）
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import path from 'node:path'
import { has, EDITION, FEATURE_TABLE } from './edition.js'

export function mountAdmin(app, { db, ok, fail, findP, nid, SECRET, express, dir }) {
  const ADMIN_USER = process.env.ADMIN_USER || 'admin'
  let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  if (!ADMIN_PASSWORD) {
    if (process.env.NODE_ENV === 'production') { ADMIN_PASSWORD = crypto.randomBytes(9).toString('base64url'); console.warn('[admin] 未设置 ADMIN_PASSWORD，本次随机密码：' + ADMIN_PASSWORD) }
    else { ADMIN_PASSWORD = 'admin123'; console.warn('[admin] 开发模式默认账号 admin / admin123，生产环境请设置 ADMIN_PASSWORD') }
  }
  app.use('/admin', express.static(path.join(dir, 'admin')))
  const A = '/api/admin'
  const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y) }
  app.post(A + '/login', (req, res) => {
    const { username, password } = req.body || {}
    if (!safeEq(username, ADMIN_USER) || !safeEq(password, ADMIN_PASSWORD)) return fail(res, '账号或密码错误', 401)
    ok(res, { token: jwt.sign({ admin: username }, SECRET, { expiresIn: '12h' }), edition: EDITION })
  })
  const guard = (req, res, next) => {
    try { const p = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), SECRET); if (!p.admin) throw 0; next() } catch { fail(res, '请先登录后台', 401) }
  }
  const need = f => (req, res, next) => has(f) ? next() : fail(res, '该功能属于付费版，请配置授权后使用', 402)
  app.use(A, (req, res, next) => (req.path === '/login' ? next() : guard(req, res, next)))
  app.get(A + '/edition', (req, res) => ok(res, { edition: EDITION, table: FEATURE_TABLE }))

  // 数据概览
  const paid = o => !['待付款', '已取消'].includes(o.status)
  app.get(A + '/dashboard', (req, res) => {
    const os = db.data.orders, d = {
      products: db.data.products.length, onSale: db.data.products.filter(p => p.onSale !== false).length,
      users: db.data.users.length, orders: os.length, paidOrders: os.filter(paid).length,
      revenue: Math.round(os.filter(paid).reduce((t, o) => t + o.total, 0) * 100) / 100,
      toShip: os.filter(o => o.status === '待发货').length, afterSales: db.data.afterSales.filter(a => a.status === '待商家处理').length,
      rewards: db.data.rewards.length, rewardAmount: Math.round(db.data.rewards.reduce((t, r) => t + r.amount, 0) * 100) / 100
    }
    if (has('admin.dashboard.charts')) {
      const days = [...Array(7)].map((_, i) => { const t = new Date(); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() - 6 + i); return t })
      d.trend = days.map(t => { const e = +t + 864e5, l = os.filter(o => paid(o) && o.createdAt >= +t && o.createdAt < e); return { day: `${t.getMonth() + 1}/${t.getDate()}`, orders: l.length, amount: Math.round(l.reduce((s, o) => s + o.total, 0) * 100) / 100 } })
      const byCat = {}; os.filter(paid).forEach(o => o.items.forEach(i => { const c = findP(i.productId)?.categoryId; const n = db.data.categories.find(x => x.id === c)?.name || '其他'; byCat[n] = (byCat[n] || 0) + i.price * i.qty }))
      d.byCategory = Object.entries(byCat).map(([name, v]) => ({ name, amount: Math.round(v * 100) / 100 })).sort((a, b) => b.amount - a.amount)
      const top = {}; os.filter(paid).forEach(o => o.items.forEach(i => (top[i.name] = (top[i.name] || 0) + i.qty)))
      d.topProducts = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }))
    }
    ok(res, d)
  })

  // 通用 CRUD
  function crud(name, coll, { validate, defaults = {} }) {
    const L = () => db.data[coll]
    app.get(`${A}/${name}`, (req, res) => {
      let l = L(); const { q, categoryId } = req.query
      if (q) l = l.filter(x => JSON.stringify(x).toLowerCase().includes(String(q).toLowerCase()))
      if (categoryId) l = l.filter(x => x.categoryId === Number(categoryId))
      ok(res, l)
    })
    app.post(`${A}/${name}`, async (req, res) => {
      const e = validate(req.body); if (e) return fail(res, e)
      const x = { ...defaults, ...req.body, id: Math.max(0, ...L().map(i => i.id)) + 1 }; L().push(x); await db.write(); ok(res, x)
    })
    app.put(`${A}/${name}/:id`, async (req, res) => {
      const x = L().find(i => i.id === Number(req.params.id)); if (!x) return fail(res, '不存在', 404)
      const e = validate({ ...x, ...req.body }); if (e) return fail(res, e)
      Object.assign(x, req.body, { id: x.id }); await db.write(); ok(res, x)
    })
    app.delete(`${A}/${name}/:id`, async (req, res) => { db.data[coll] = L().filter(i => i.id !== Number(req.params.id)); await db.write(); ok(res, true) })
  }
  const num = v => typeof v === 'number' && isFinite(v) && v >= 0
  app.use(`${A}/products`, (req, res, next) => { if (req.body?.price !== undefined) req.body.price = Number(req.body.price); if (req.body?.originalPrice !== undefined) req.body.originalPrice = Number(req.body.originalPrice); if (req.body?.categoryId !== undefined) req.body.categoryId = Number(req.body.categoryId); if (req.body?.stock !== undefined) req.body.stock = Number(req.body.stock); next() })
  crud('products', 'products', {
    defaults: { onSale: true, stock: 999, sales: 0, shop: '官方旗舰店', images: ['/images/p1_1.jpg'], specs: [], desc: '' },
    validate: p => !p.name ? '请填写商品名称' : !num(Number(p.price)) ? '价格不正确' : !db.data.categories.some(c => c.id === Number(p.categoryId)) ? '请选择分类' : null
  })
  crud('categories', 'categories', { defaults: { icon: '🛍️' }, validate: c => (!c.name ? '请填写分类名称' : null) })
  crud('banners', 'banners', { defaults: { title: '' }, validate: b => (!b.image ? '请填写图片地址' : null) })
  app.post(`${A}/products-batch`, need('admin.products.batch'), async (req, res) => {
    const { ids = [], onSale } = req.body; db.data.products.forEach(p => { if (ids.includes(p.id)) p.onSale = !!onSale }); await db.write(); ok(res, ids.length)
  })

  // 订单
  app.get(`${A}/orders`, (req, res) => {
    const { status, q } = req.query
    ok(res, db.data.orders.filter(o => (!status || o.status === status) && (!q || o.id.includes(q) || o.address?.name?.includes(q) || o.address?.phone?.includes(q)))
      .map(o => ({ ...o, userPhone: db.data.users.find(u => u.id === o.uid)?.phone })))
  })
  app.get(`${A}/orders/:id`, (req, res) => { const o = db.data.orders.find(o => o.id === req.params.id); o ? ok(res, { ...o, afterSale: db.data.afterSales.find(a => a.orderId === o.id) }) : fail(res, '订单不存在', 404) })
  app.post(`${A}/orders/:id/ship`, async (req, res) => {
    const o = db.data.orders.find(o => o.id === req.params.id); if (!o) return fail(res, '订单不存在', 404)
    if (o.status !== '待发货') return fail(res, `当前状态「${o.status}」不可发货`)
    const { company = '顺丰速运', no } = req.body || {}; if (!no) return fail(res, '请填写运单号')
    o.status = '待收货'; o.shippedAt = Date.now(); o.express = { company, no }; o.timeline.push({ t: Date.now(), s: `商家已发货 · ${company} ${no}` }); await db.write(); ok(res, o)
  })
  const csv = rows => '\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  app.get(`${A}/orders-export`, need('admin.export.csv'), (req, res) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename=orders.csv')
    res.send(csv([['订单号', '状态', '金额', '收货人', '电话', '地址', '商品', '下单时间'], ...db.data.orders.map(o => [o.id, o.status, o.total, o.address?.name, o.address?.phone, (o.address?.region || '') + (o.address?.detail || ''), o.items.map(i => `${i.name}x${i.qty}`).join('; '), new Date(o.createdAt).toLocaleString('zh-CN')])]))
  })

  // 售后（付费）
  app.get(`${A}/aftersales`, need('admin.aftersale'), (req, res) => ok(res, db.data.afterSales))
  app.post(`${A}/aftersales/:id`, need('admin.aftersale'), async (req, res) => {
    const a = db.data.afterSales.find(a => a.id === Number(req.params.id)); if (!a) return fail(res, '不存在', 404)
    const { action } = req.body; if (!['同意', '拒绝'].includes(action)) return fail(res, '操作不正确')
    a.status = action === '同意' ? '已同意' : '已拒绝'; a.handledAt = Date.now()
    const o = db.data.orders.find(o => o.id === a.orderId); if (o) { o.afterSaleStatus = a.status; o.timeline.push({ t: Date.now(), s: `售后${a.status}` }); if (action === '同意' && a.type !== '换货') o.status = '已退款' }
    await db.write(); ok(res, a)
  })

  // 用户
  app.get(`${A}/users`, (req, res) => ok(res, db.data.users.map(u => ({ ...u, orders: db.data.orders.filter(o => o.uid === u.id).length, spent: Math.round(db.data.orders.filter(o => o.uid === u.id && paid(o)).reduce((t, o) => t + o.total, 0) * 100) / 100 }))))
  app.post(`${A}/users/:id/toggle`, need('admin.users.disable'), async (req, res) => { const u = db.data.users.find(u => u.id === Number(req.params.id)); if (!u) return fail(res, '不存在', 404); u.disabled = !u.disabled; await db.write(); ok(res, u) })

  // 打赏记录
  app.get(`${A}/rewards`, (req, res) => ok(res, db.data.rewards))
  app.post(`${A}/rewards/:id`, need('admin.rewards.manage'), async (req, res) => {
    const r = db.data.rewards.find(r => r.id === Number(req.params.id)); if (!r) return fail(res, '不存在', 404)
    const { status } = req.body; if (!['已到账', '未到账', '待核对'].includes(status)) return fail(res, '状态不正确')
    r.status = status; await db.write(); ok(res, r)
  })
  app.get(`${A}/rewards-export`, need('admin.export.csv'), (req, res) => {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename=rewards.csv')
    res.send(csv([['ID', '渠道', '金额', '昵称', '留言', '状态', '时间'], ...db.data.rewards.map(r => [r.id, r.channel, r.amount, r.nickname, r.message, r.status, new Date(r.createdAt).toLocaleString('zh-CN')])]))
  })
}
