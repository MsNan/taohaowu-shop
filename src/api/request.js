import { API_BASE } from '../config'
export function request(url, { method = 'GET', data } = {}) {
  const token = uni.getStorageSync('token')
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE + '/api' + url, method, data,
      header: token ? { Authorization: 'Bearer ' + token } : {},
      success: r => {
        if (r.statusCode === 200 && r.data.code === 0) return resolve(r.data.data)
        const msg = r.data?.message || '请求失败'
        if (r.statusCode === 401) { uni.removeStorageSync('token') }
        uni.showToast({ title: msg, icon: 'none' }); reject(new Error(msg))
      },
      fail: e => { uni.showToast({ title: '网络开小差了', icon: 'none' }); reject(e) }
    })
  })
}
const q = o => '?' + Object.entries(o).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&')
export const api = {
  home: () => request('/home'),
  products: (p = {}) => request('/products' + q(p)),
  product: id => request('/products/' + id),
  sms: phone => request('/auth/sms', { method: 'POST', data: { phone } }),
  login: (phone, code) => request('/auth/login', { method: 'POST', data: { phone, code } }),
  cart: () => request('/cart'),
  cartAdd: d => request('/cart', { method: 'POST', data: d }),
  cartMerge: items => request('/cart/merge', { method: 'POST', data: { items } }),
  cartUpdate: (key, d) => request('/cart/' + encodeURIComponent(key), { method: 'PUT', data: d }),
  cartAll: checked => request('/cart', { method: 'PUT', data: { checked } }),
  cartRemove: key => request('/cart/' + encodeURIComponent(key), { method: 'DELETE' }),
  addresses: () => request('/addresses'),
  addressSave: a => (a.id ? request('/addresses/' + a.id, { method: 'PUT', data: a }) : request('/addresses', { method: 'POST', data: a })),
  addressRemove: id => request('/addresses/' + id, { method: 'DELETE' }),
  orderCreate: d => request('/orders', { method: 'POST', data: d }),
  orders: status => request('/orders' + q({ status })),
  order: id => request('/orders/' + id),
  orderAct: (id, act, data) => request(`/orders/${id}/${act}`, { method: 'POST', data }),
  afterSale: (id, d) => request(`/orders/${id}/aftersale`, { method: 'POST', data: d })
}
