const puppeteer = require('/workspace/shop-app/node_modules/puppeteer-core')
const OUT = '/workspace/shop-test/', URL = 'http://localhost:3000/'
const results = []
;(async () => {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--no-proxy-server', '--lang=zh-CN'] })
  const pg = await b.newPage()
  await pg.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const errs = []; pg.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url())); pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()))
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  let n = 0
  const shot = async (name, ok = true, note = '') => { await sleep(700); const f = `${String(++n).padStart(2, '0')}_${name}.png`; await pg.screenshot({ path: OUT + f }); results.push({ step: f, ok, note }); console.log(ok ? 'PASS' : 'FAIL', f, note) }
  const text = () => pg.evaluate(() => document.body.innerText)
  const waitText = (t, to = 8000) => pg.waitForFunction(t => document.body.innerText.includes(t), { timeout: to }, t)
  const clickText = async (t, sel = '*') => {
    const ok = await pg.evaluate((t, sel) => {
      const els = [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed')
      const hit = els.filter(e => e.innerText && e.innerText.trim() === t).sort((a, b) => a.innerText.length - b.innerText.length || b.compareDocumentPosition(a) & 2 ? 1 : -1)
      const el = hit[hit.length - 1] || hit[0]; if (!el) return false; el.click(); return true
    }, t, sel)
    if (!ok) throw new Error('找不到可点击文本：' + t)
    await sleep(600)
  }
  const click = async s => { await pg.waitForSelector(s, { visible: true }); await pg.$eval(s, e => e.click()); await sleep(600) }
  const type = async (s, v, blur = true) => { await pg.waitForSelector(s + ' input, ' + s + ' textarea'); const h = await pg.$(s + ' input') || await pg.$(s + ' textarea'); await h.click(); await h.type(v, { delay: 20 }); if (blur) { await h.evaluate(e => e.blur()); await sleep(400) } }
  const step = async (name, fn) => { try { const note = await fn(); await shot(name, true, note || '') } catch (e) { await shot(name, false, e.message); throw e } }
  try {
    await step('首页浏览', async () => { await pg.goto(URL, { waitUntil: 'networkidle0' }); await waitText('猜你喜欢'); await pg.evaluate(() => window.scrollTo(0, 0)) })
    await step('搜索历史', async () => { await click('.search'); await waitText('热门搜索'); await clickText('耳机', '.chip'); await waitText('综合'); await pg.evaluate(() => history.back()); await sleep(800); await click('.search'); await waitText('搜索历史') })
    await step('搜索结果', async () => { await type('.ipt', '手机', false); await pg.keyboard.press('Enter'); await waitText('人付款'); const t = await text(); if (!t.includes('旗舰5G智能手机')) throw new Error('结果不含手机'); return '关键词「手机」' })
    await step('商品详情', async () => { await pg.evaluate(() => [...document.querySelectorAll('.pc')].find(e => e.innerText.includes('旗舰5G智能手机')).click()); await sleep(800); await waitText('立即购买'); await waitText('商品详情') })
    await step('选择规格', async () => { await click('.add-cart'); await waitText('购买数量'); await clickText('雾霾蓝', '.opt'); await clickText('＋', '.sheet .b'); await sleep(300) })
    await step('加入购物车', async () => { await click('.spec-ok'); await waitText('已加入购物车', 3000) })
    await step('购物车_游客', async () => { await pg.goto(URL + '#/pages/cart/cart', { waitUntil: 'networkidle0' }); await waitText('结算'); const t = await text(); if (!t.includes('雾霾蓝')) throw new Error('购物车无商品'); return '游客购物车 2 件' })
    await step('登录页', async () => { await click('.checkout'); await waitText('获取验证码') })
    await step('登录_验证码', async () => { await type('.phone', '13800138000'); await clickText('获取验证码', '.get'); await waitText('开发模式验证码'); const code = await pg.evaluate(() => document.querySelector('.dev').innerText.match(/\d{6}/)[0]); await type('.code', code); await click('.agree'); return '验证码 ' + code })
    await step('登录后购物车合并', async () => { await click('.login-btn'); await sleep(1500); await waitText('结算'); const t = await text(); if (!t.includes('雾霾蓝')) throw new Error('合并失败'); return '游客车已合并到账号' })
    await step('确认订单_无地址', async () => { await click('.checkout'); await waitText('请添加收货地址') })
    await step('新增地址', async () => { await click('.no-addr'); await waitText('详细地址'); await type('.a-name', '张三'); await type('.a-phone', '13800138000'); await type('.a-region', '浙江省 杭州市 余杭区'); await type('.a-detail', '文一西路 969 号 淘好物园区 3 号楼') })
    await step('确认订单', async () => { await click('.save-addr'); await sleep(1200); await waitText('文一西路'); await waitText('提交订单') })
    await step('收银台', async () => { await click('.submit-order'); await waitText('淘好物收银台') })
    await step('支付成功', async () => { await click('.confirm-pay'); await waitText('支付成功'); return (await text()).match(/订单号 (TB\d+)/)?.[0] })
    await step('订单详情_待发货', async () => { await click('.view-order'); await waitText('订单跟踪'); await waitText('待发货') })
    await step('订单列表', async () => { await pg.goto(URL + '#/pages/order/list', { waitUntil: 'networkidle0' }); await waitText('实付'); const t = await text(); if (!t.includes('待发货')) throw new Error('无待发货订单') })
    await step('模拟发货_待收货', async () => { await click('.act-ship'); await sleep(800); await waitText('确认收货') })
    await step('售后申请', async () => { await click('.order'); await waitText('订单跟踪'); await click('.act-aftersale'); await waitText('售后类型'); await clickText('退货退款'); await clickText('商品质量问题', '.chip'); await type('.ta', '耳机有杂音，申请退货') })
    await step('售后已提交', async () => { await click('.submit-as'); await sleep(1500); await waitText('售后信息'); await waitText('待商家处理') })
    await step('我的', async () => { await pg.goto(URL + '#/pages/my/my', { waitUntil: 'networkidle0' }); await waitText('淘友8000') })
    await step('分类', async () => { await pg.goto(URL + '#/pages/category/category', { waitUntil: 'networkidle0' }); await waitText('家用电器'); await clickText('家用电器', '.li'); await waitText('空调') })
  } finally {
    require('fs').writeFileSync(OUT + 'results.json', JSON.stringify({ results, errors: [...new Set(errs)] }, null, 1))
    console.log('page errors:', [...new Set(errs)].slice(0, 10))
    await b.close()
  }
})()
