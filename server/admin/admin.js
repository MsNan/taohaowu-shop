// 淘好物管理后台（原生 JS，无需构建）
const $ = s => document.querySelector(s), app = $('#app')
let token = localStorage.getItem('admin_token'), edition = { edition: 'free', table: {} }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const money = n => '¥' + Number(n || 0).toFixed(2), dt = t => t ? new Date(t).toLocaleString('zh-CN') : '-'
const toast = m => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 2000) }
async function api(url, opt = {}) {
  const r = await fetch('/api/admin' + url, { method: opt.method || 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: opt.body && JSON.stringify(opt.body) })
  const j = await r.json().catch(() => ({}))
  if (r.status === 401 && url !== '/login') { logout(); throw new Error('登录已过期') }
  if (j.code !== 0) { toast(j.message || '请求失败'); throw new Error(j.message) }
  return j.data
}
const isPro = f => edition.table[f] !== 'pro' || edition.edition === 'pro'
const lockBox = name => `<div class="lock">🔒 「${name}」属于<b>付费版</b>功能。<br>部署时设置 EDITION=pro 与有效的 LICENSE_KEY 后解锁，详见 README「免费版 / 付费版」。</div>`
async function download(path, name) {
  const r = await fetch('/api/admin' + path, { headers: { Authorization: 'Bearer ' + token } })
  if (!r.ok) return toast((await r.json()).message)
  const a = document.createElement('a'); a.href = URL.createObjectURL(await r.blob()); a.download = name; a.click()
}
function logout() { token = null; localStorage.removeItem('admin_token'); render() }
const menus = [['dashboard', '📊 数据概览'], ['products', '📦 商品管理'], ['categories', '🗂 分类管理'], ['banners', '🖼 轮播管理'], ['orders', '🧾 订单管理'], ['aftersales', '↩️ 售后处理', 'admin.aftersale'], ['users', '👥 用户管理'], ['rewards', '💰 打赏记录']]
const cats = { list: [] }

function loginView() {
  app.innerHTML = `<form class="login" id="lf"><h1>淘好物后台</h1><input name="username" placeholder="账号" value="admin"><input name="password" type="password" placeholder="密码"><button class="p">登录</button><p style="color:#999;font-size:12px">开发环境默认 admin / admin123，生产环境请设置 ADMIN_PASSWORD</p></form>`
  $('#lf').onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target); const d = await api('/login', { method: 'POST', body: Object.fromEntries(f) }); token = d.token; localStorage.setItem('admin_token', token); location.hash = '#dashboard'; render() }
}
async function render() {
  if (!token) return loginView()
  edition = await api('/edition').catch(() => edition); if (!token) return
  cats.list = await api('/categories').catch(() => [])
  const page = (location.hash || '#dashboard').slice(1)
  app.innerHTML = `<div class="layout"><nav class="side"><h1>淘好物 · 后台</h1>${menus.map(([k, t, f]) => `<a href="#${k}" class="${k === page ? 'on' : ''}">${t}${f && edition.table[f] === 'pro' ? '<span class="pro">PRO</span>' : ''}</a>`).join('')}<a href="javascript:void 0" id="lo">🚪 退出登录</a></nav>
  <main class="main"><div class="top"><h2>${(menus.find(m => m[0] === page) || menus[0])[1]}</h2><span class="badge ${edition.edition}">${edition.edition === 'pro' ? '付费版 PRO' : '免费版 FREE'}</span></div><div id="view">加载中…</div></main></div>`
  $('#lo').onclick = logout
  await (views[page] || views.dashboard)($('#view'))
}
window.onhashchange = render

function modal(title, fields, data, onSave) {
  const m = document.createElement('div'); m.className = 'modal'
  m.innerHTML = `<form><h3>${title}</h3>${fields.map(f => `<label><span>${f.label}</span>${f.type === 'select' ? `<select name="${f.name}">${f.options.map(o => `<option value="${o[0]}" ${String(data[f.name]) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>` : f.type === 'textarea' ? `<textarea name="${f.name}" rows="3">${esc(data[f.name])}</textarea>` : `<input name="${f.name}" type="${f.type || 'text'}" step="any" value="${esc(f.get ? f.get(data) : data[f.name])}">`}</label>`).join('')}<div style="text-align:right"><button type="button" id="mc">取消</button><button class="p">保存</button></div></form>`
  document.body.appendChild(m); m.querySelector('#mc').onclick = () => m.remove()
  m.querySelector('form').onsubmit = async e => { e.preventDefault(); const o = {}; fields.forEach(f => { const v = e.target[f.name].value; o[f.name] = f.set ? f.set(v) : f.type === 'number' ? Number(v) : v }); await onSave(o); m.remove(); toast('已保存'); render() }
}

const views = {
  async dashboard(el) {
    const d = await api('/dashboard')
    const c = [['累计营收', money(d.revenue)], ['已支付订单', d.paidOrders], ['全部订单', d.orders], ['待发货', d.toShip], ['待处理售后', d.afterSales], ['注册用户', d.users], ['在售商品', d.onSale + ' / ' + d.products], ['打赏笔数 / 金额', d.rewards + ' / ' + money(d.rewardAmount)]]
    let h = `<div class="cards">${c.map(([k, v]) => `<div class="card"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('')}</div>`
    if (d.trend) {
      const max = Math.max(1, ...d.trend.map(t => t.amount))
      h += `<div class="grid2"><div class="card"><b>近 7 天成交额</b><div class="chart" style="margin-bottom:20px">${d.trend.map(t => `<div style="height:${(t.amount / max) * 100}%"><b>${t.amount ? Math.round(t.amount) : ''}</b><span>${t.day}</span></div>`).join('')}</div></div>
      <div class="card"><b>分类销售额</b>${d.byCategory.map(x => `<div style="display:flex;justify-content:space-between;padding:4px 0"><span>${esc(x.name)}</span><span>${money(x.amount)}</span></div>`).join('') || '<p>暂无</p>'}<br><b>热销 TOP5</b>${d.topProducts.map(x => `<div style="display:flex;justify-content:space-between;padding:4px 0"><span>${esc(x.name)}</span><span>${x.qty} 件</span></div>`).join('') || '<p>暂无</p>'}</div></div>`
    } else h += lockBox('趋势图表 / 分类销售 / 热销排行')
    el.innerHTML = h
  },
  async products(el) {
    const q = sessionStorage.pq || '', list = await api('/products?q=' + encodeURIComponent(q))
    const catName = id => cats.list.find(c => c.id === id)?.name || '-'
    el.innerHTML = `<div class="bar"><input id="q" placeholder="搜索商品" value="${esc(q)}"><button id="s">搜索</button><button class="p" id="add">+ 新增商品</button>${isPro('admin.products.batch') ? '<button id="bon">批量上架</button><button id="boff">批量下架</button>' : '<span class="badge pro">批量上下架：付费版</span>'}</div>
    <table><tr><th><input type="checkbox" id="all"></th><th>图片</th><th>名称</th><th>分类</th><th>价格</th><th>库存</th><th>销量</th><th>状态</th><th>操作</th></tr>${list.map(p => `<tr><td><input type="checkbox" class="ck" value="${p.id}"></td><td><img src="${esc(p.images?.[0])}"></td><td>${esc(p.name)}</td><td>${esc(catName(p.categoryId))}</td><td>${money(p.price)}</td><td>${p.stock ?? '-'}</td><td>${p.sales}</td><td>${p.onSale !== false ? '✅ 在售' : '⛔ 下架'}</td><td><button data-e="${p.id}">编辑</button><button data-t="${p.id}">${p.onSale !== false ? '下架' : '上架'}</button><button class="d" data-d="${p.id}">删除</button></td></tr>`).join('')}</table>`
    $('#s').onclick = () => { sessionStorage.pq = $('#q').value; render() }
    const fields = [{ name: 'name', label: '商品名称' }, { name: 'categoryId', label: '分类', type: 'select', options: cats.list.map(c => [c.id, c.name]) }, { name: 'price', label: '售价', type: 'number' }, { name: 'originalPrice', label: '原价', type: 'number' }, { name: 'stock', label: '库存', type: 'number' }, { name: 'shop', label: '店铺' },
      { name: 'images', label: '图片地址（多个用英文逗号分隔）', get: d => (d.images || []).join(','), set: v => v.split(',').map(s => s.trim()).filter(Boolean) }, { name: 'desc', label: '描述', type: 'textarea' }]
    $('#add').onclick = () => modal('新增商品', fields, { categoryId: cats.list[0]?.id, stock: 999, images: ['/images/p1_1.jpg'] }, d => api('/products', { method: 'POST', body: d }))
    el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const p = list.find(x => x.id == b.dataset.e); modal('编辑商品', fields, p, d => api('/products/' + p.id, { method: 'PUT', body: d })) })
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = async () => { const p = list.find(x => x.id == b.dataset.t); await api('/products/' + p.id, { method: 'PUT', body: { onSale: p.onSale === false } }); render() })
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { if (confirm('确定删除该商品？')) { await api('/products/' + b.dataset.d, { method: 'DELETE' }); render() } })
    $('#all').onchange = e => el.querySelectorAll('.ck').forEach(c => (c.checked = e.target.checked))
    const batch = async on => { const ids = [...el.querySelectorAll('.ck:checked')].map(c => Number(c.value)); if (!ids.length) return toast('请先勾选商品'); await api('/products-batch', { method: 'POST', body: { ids, onSale: on } }); toast('已处理 ' + ids.length + ' 个'); render() }
    if ($('#bon')) { $('#bon').onclick = () => batch(true); $('#boff').onclick = () => batch(false) }
  },
  async categories(el) {
    const list = cats.list, f = [{ name: 'name', label: '分类名称' }, { name: 'icon', label: '图标（emoji）' }]
    el.innerHTML = `<div class="bar"><button class="p" id="add">+ 新增分类</button></div><table><tr><th>ID</th><th>图标</th><th>名称</th><th>商品数</th><th>操作</th></tr>${list.map(c => `<tr><td>${c.id}</td><td style="font-size:22px">${esc(c.icon)}</td><td>${esc(c.name)}</td><td id="n${c.id}">-</td><td><button data-e="${c.id}">编辑</button><button class="d" data-d="${c.id}">删除</button></td></tr>`).join('')}</table>`
    const ps = await api('/products'); list.forEach(c => ($('#n' + c.id).textContent = ps.filter(p => p.categoryId === c.id).length))
    $('#add').onclick = () => modal('新增分类', f, { icon: '🛍️' }, d => api('/categories', { method: 'POST', body: d }))
    el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const c = list.find(x => x.id == b.dataset.e); modal('编辑分类', f, c, d => api('/categories/' + c.id, { method: 'PUT', body: d })) })
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { if (ps.some(p => p.categoryId == b.dataset.d)) return toast('该分类下还有商品，不能删除'); if (confirm('确定删除？')) { await api('/categories/' + b.dataset.d, { method: 'DELETE' }); render() } })
  },
  async banners(el) {
    const list = await api('/banners'), f = [{ name: 'title', label: '标题' }, { name: 'image', label: '图片地址' }, { name: 'productId', label: '跳转商品 ID', type: 'number' }]
    el.innerHTML = `<div class="bar"><button class="p" id="add">+ 新增轮播</button></div><table><tr><th>ID</th><th>图片</th><th>标题</th><th>跳转商品</th><th>操作</th></tr>${list.map(b => `<tr><td>${b.id}</td><td><img src="${esc(b.image)}" style="width:120px"></td><td>${esc(b.title)}</td><td>${b.productId ?? '-'}</td><td><button data-e="${b.id}">编辑</button><button class="d" data-d="${b.id}">删除</button></td></tr>`).join('')}</table>`
    $('#add').onclick = () => modal('新增轮播', f, { image: '/images/banner1.jpg' }, d => api('/banners', { method: 'POST', body: d }))
    el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { const x = list.find(i => i.id == b.dataset.e); modal('编辑轮播', f, x, d => api('/banners/' + x.id, { method: 'PUT', body: d })) })
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { if (confirm('确定删除？')) { await api('/banners/' + b.dataset.d, { method: 'DELETE' }); render() } })
  },
  async orders(el) {
    const st = sessionStorage.os || '', list = await api('/orders?status=' + encodeURIComponent(st))
    el.innerHTML = `<div class="bar"><select id="st">${['', '待付款', '待发货', '待收货', '已完成', '已取消', '已退款'].map(s => `<option ${s === st ? 'selected' : ''} value="${s}">${s || '全部状态'}</option>`).join('')}</select>${isPro('admin.export.csv') ? '<button id="ex">导出 CSV</button>' : '<span class="badge pro">导出 CSV：付费版</span>'}</div>
    <table><tr><th>订单号</th><th>用户</th><th>商品</th><th>金额</th><th>收货人</th><th>状态</th><th>下单时间</th><th>操作</th></tr>${list.map(o => `<tr><td>${o.id}</td><td>${esc(o.userPhone)}</td><td>${o.items.map(i => esc(i.name) + ' ×' + i.qty).join('<br>')}</td><td>${money(o.total)}</td><td>${esc(o.address?.name)} ${esc(o.address?.phone)}</td><td>${o.status}${o.afterSaleStatus ? '<br><small>售后:' + o.afterSaleStatus + '</small>' : ''}</td><td>${dt(o.createdAt)}</td><td>${o.status === '待发货' ? `<button class="p" data-s="${o.id}">发货</button>` : ''}${o.express ? `<small>${esc(o.express.company)} ${esc(o.express.no)}</small>` : ''}</td></tr>`).join('') || '<tr><td colspan="8">暂无订单</td></tr>'}</table>`
    $('#st').onchange = e => { sessionStorage.os = e.target.value; render() }
    if ($('#ex')) $('#ex').onclick = () => download('/orders-export', 'orders.csv')
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => modal('订单发货 ' + b.dataset.s, [{ name: 'company', label: '快递公司', type: 'select', options: [['顺丰速运', '顺丰速运'], ['中通快递', '中通快递'], ['圆通速递', '圆通速递'], ['京东物流', '京东物流']] }, { name: 'no', label: '运单号' }], { company: '顺丰速运' }, d => api(`/orders/${b.dataset.s}/ship`, { method: 'POST', body: d })))
  },
  async aftersales(el) {
    if (!isPro('admin.aftersale')) return (el.innerHTML = lockBox('售后审核'))
    const list = await api('/aftersales')
    el.innerHTML = `<table><tr><th>ID</th><th>订单号</th><th>类型</th><th>原因</th><th>说明</th><th>金额</th><th>状态</th><th>操作</th></tr>${list.map(a => `<tr><td>${a.id}</td><td>${a.orderId}</td><td>${esc(a.type)}</td><td>${esc(a.reason)}</td><td>${esc(a.desc)}</td><td>${money(a.amount)}</td><td>${a.status}</td><td>${a.status === '待商家处理' ? `<button class="p" data-a="${a.id}" data-v="同意">同意</button><button class="d" data-a="${a.id}" data-v="拒绝">拒绝</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="8">暂无售后</td></tr>'}</table>`
    el.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => { await api('/aftersales/' + b.dataset.a, { method: 'POST', body: { action: b.dataset.v } }); render() })
  },
  async users(el) {
    const list = await api('/users'), can = isPro('admin.users.disable')
    el.innerHTML = `<table><tr><th>ID</th><th>昵称</th><th>手机号</th><th>订单数</th><th>消费金额</th><th>注册时间</th><th>状态</th><th>操作</th></tr>${list.map(u => `<tr><td>${u.id}</td><td>${esc(u.nickname)}</td><td>${esc(u.phone)}</td><td>${u.orders}</td><td>${money(u.spent)}</td><td>${dt(u.createdAt)}</td><td>${u.disabled ? '⛔ 已禁用' : '✅ 正常'}</td><td>${can ? `<button data-u="${u.id}">${u.disabled ? '启用' : '禁用'}</button>` : '<span class="badge pro">禁用：付费版</span>'}</td></tr>`).join('') || '<tr><td colspan="8">暂无用户</td></tr>'}</table>`
    el.querySelectorAll('[data-u]').forEach(b => b.onclick = async () => { await api(`/users/${b.dataset.u}/toggle`, { method: 'POST' }); render() })
  },
  async rewards(el) {
    const list = await api('/rewards'), can = isPro('admin.rewards.manage'), total = list.reduce((t, r) => t + r.amount, 0)
    el.innerHTML = `<div class="cards"><div class="card"><div class="v">${list.length}</div><div class="k">打赏笔数（用户自报）</div></div><div class="card"><div class="v">${money(total)}</div><div class="k">合计金额</div></div><div class="card"><div class="v">${money(list.filter(r => r.status === '已到账').reduce((t, r) => t + r.amount, 0))}</div><div class="k">已核对到账</div></div></div>
    <div class="card" style="margin-bottom:12px"><b>当前收款码</b><div class="qr" style="margin-top:8px"><div><img src="/images/reward/wechat.jpg"><div>微信</div></div><div><img src="/images/reward/alipay.jpg"><div>支付宝</div></div></div><small style="color:#888">替换 server/public/images/reward/ 下的 wechat.jpg / alipay.jpg 即可更换。个人收款码无法自动回调，记录为用户自报，请对照账单核对。</small></div>
    <div class="bar">${isPro('admin.export.csv') ? '<button id="ex">导出 CSV</button>' : '<span class="badge pro">导出 / 核对状态：付费版</span>'}</div>
    <table><tr><th>ID</th><th>渠道</th><th>金额</th><th>昵称</th><th>留言</th><th>时间</th><th>状态</th>${can ? '<th>核对</th>' : ''}</tr>${list.map(r => `<tr><td>${r.id}</td><td>${r.channel}</td><td>${money(r.amount)}</td><td>${esc(r.nickname)}</td><td>${esc(r.message)}</td><td>${dt(r.createdAt)}</td><td>${r.status}</td>${can ? `<td><button data-r="${r.id}" data-v="已到账">已到账</button><button class="d" data-r="${r.id}" data-v="未到账">未到账</button></td>` : ''}</tr>`).join('') || '<tr><td colspan="8">暂无打赏</td></tr>'}</table>`
    if ($('#ex')) $('#ex').onclick = () => download('/rewards-export', 'rewards.csv')
    el.querySelectorAll('[data-r]').forEach(b => b.onclick = async () => { await api('/rewards/' + b.dataset.r, { method: 'POST', body: { status: b.dataset.v } }); render() })
  }
}
render()
