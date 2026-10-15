// 版本开关：EDITION=free（默认）| pro
// 付费版需同时提供 LICENSE_KEY，格式校验见 checkLicense。注意：开源代码中的离线校验只是“功能开关”，不是防破解手段。
import crypto from 'node:crypto'
const want = (process.env.EDITION || 'free').toLowerCase()
export function checkLicense(key = '', owner = process.env.LICENSE_OWNER || '') {
  // 授权码 = TH-PRO- + sha256(owner + ':' + LICENSE_SALT) 前 16 位（大写）；由作者用 scripts/gen-license.mjs 生成
  const salt = process.env.LICENSE_SALT || ''
  if (!owner || !salt || !key) return false
  const exp = 'TH-PRO-' + crypto.createHash('sha256').update(owner + ':' + salt).digest('hex').slice(0, 16).toUpperCase()
  return key === exp
}
export const EDITION = want === 'pro' && checkLicense(process.env.LICENSE_KEY) ? 'pro' : 'free'
if (want === 'pro' && EDITION !== 'pro') console.warn('[edition] LICENSE_KEY 无效，已回退为免费版')
// 功能清单：free=免费版可用；pro=仅付费版
export const FEATURE_TABLE = {
  'admin.login': 'free', 'admin.products': 'free', 'admin.categories': 'free', 'admin.banners': 'free',
  'admin.orders': 'free', 'admin.ship': 'free', 'admin.users': 'free', 'admin.rewards.list': 'free', 'admin.dashboard.basic': 'free',
  'front.reward': 'free',
  'admin.dashboard.charts': 'pro', 'admin.export.csv': 'pro', 'admin.aftersale': 'pro', 'admin.products.batch': 'pro',
  'admin.rewards.manage': 'pro', 'admin.users.disable': 'pro'
}
export const features = Object.fromEntries(Object.entries(FEATURE_TABLE).map(([k, v]) => [k, v === 'free' || EDITION === 'pro']))
export const has = f => !!features[f]
