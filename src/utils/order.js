import { api } from '../api/request'
// 按订单状态返回操作按钮
export function orderButtons(o) {
  const as = o.afterSaleStatus ? [] : [{ t: '申请售后', k: 'aftersale', c: 'g' }]
  switch (o.status) {
    case '待付款': return [{ t: '取消订单', k: 'cancel', c: 'g' }, { t: '立即付款', k: 'pay', c: '' }]
    case '待发货': return [...as, { t: '模拟发货', k: 'ship', c: 'o' }]
    case '待收货': return [...as, { t: '确认收货', k: 'confirm', c: 'o' }]
    case '已完成': return [...as, { t: '再买一单', k: 'rebuy', c: 'o' }]
    default: return [{ t: '再买一单', k: 'rebuy', c: 'o' }]
  }
}
const modal = (title, content) => new Promise(r => uni.showModal({ title, content, confirmColor: '#FF5000', success: x => r(x.confirm) }))
export async function doOrderAction(o, k) {
  if (k === 'aftersale') return uni.navigateTo({ url: '/pages/aftersale/apply?id=' + o.id })
  if (k === 'rebuy') return uni.navigateTo({ url: '/pages/detail/detail?id=' + o.items[0].productId })
  if (k === 'pay') { await api.orderAct(o.id, 'pay', { method: '支付宝' }); return uni.navigateTo({ url: '/pages/pay/result?id=' + o.id }) }
  if (k === 'cancel' && !(await modal('取消订单', '确定取消该订单吗？'))) return false
  if (k === 'confirm' && !(await modal('确认收货', '请确认已收到商品'))) return false
  await api.orderAct(o.id, k)
  uni.showToast({ title: { cancel: '订单已取消', ship: '已模拟发货', confirm: '交易完成' }[k], icon: 'none' })
  return true
}
