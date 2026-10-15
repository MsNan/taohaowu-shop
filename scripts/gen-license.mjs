// 用法：LICENSE_SALT=你的私有盐 node scripts/gen-license.mjs 客户名
// 盐只保存在作者和付费用户的部署环境变量中，不要提交到仓库
import crypto from 'node:crypto'
const owner = process.argv[2], salt = process.env.LICENSE_SALT
if (!owner || !salt) { console.error('需要 LICENSE_SALT 环境变量和客户名参数'); process.exit(1) }
console.log('LICENSE_OWNER=' + owner)
console.log('LICENSE_KEY=TH-PRO-' + crypto.createHash('sha256').update(owner + ':' + salt).digest('hex').slice(0, 16).toUpperCase())
