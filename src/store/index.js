import { defineStore } from 'pinia'
import { api } from '../api/request'

const get = (k, d) => { try { const v = uni.getStorageSync(k); return v === '' || v === undefined ? d : v } catch (e) { return d } }

export const useShopStore = defineStore('shop', {
  state: () => ({
    token: get('token', ''),
    user: get('user', null),
    guestCart: get('guestCart', []),   // 游客购物车：{key, productId, spec, qty, checked, product}
    serverCart: [],
    history: get('searchHistory', []),
    checkout: { items: [], fromCart: false },
    addressId: null
  }),
  getters: {
    loggedIn: s => !!s.token,
    cart(s) { return s.token ? s.serverCart : s.guestCart },
    cartCount() { return this.cart.reduce((n, i) => n + i.qty, 0) },
    checkedItems() { return this.cart.filter(i => i.checked) },
    checkedTotal() { return this.checkedItems.reduce((t, i) => t + i.product.price * i.qty, 0) }
  },
  actions: {
    persist() { uni.setStorageSync('guestCart', this.guestCart); uni.setStorageSync('searchHistory', this.history) },
    async loadCart() { if (this.token) this.serverCart = await api.cart().catch(() => this.serverCart) },
    async addToCart(product, spec, qty = 1) {
      if (this.token) { this.serverCart = await api.cartAdd({ productId: product.id, spec, qty }); return }
      const key = product.id + '|' + spec
      const f = this.guestCart.find(i => i.key === key)
      if (f) f.qty += qty
      else this.guestCart.push({ key, productId: product.id, spec, qty, checked: true, product })
      this.persist()
    },
    async setQty(key, qty) {
      qty = Math.max(1, qty)
      if (this.token) this.serverCart = await api.cartUpdate(key, { qty })
      else { const f = this.guestCart.find(i => i.key === key); if (f) f.qty = qty; this.persist() }
    },
    async toggle(key) {
      const f = this.cart.find(i => i.key === key); if (!f) return
      if (this.token) this.serverCart = await api.cartUpdate(key, { checked: !f.checked })
      else { f.checked = !f.checked; this.persist() }
    },
    async toggleAll(v) {
      if (this.token) this.serverCart = await api.cartAll(v)
      else { this.guestCart.forEach(i => (i.checked = v)); this.persist() }
    },
    async remove(key) {
      if (this.token) this.serverCart = await api.cartRemove(key)
      else { this.guestCart = this.guestCart.filter(i => i.key !== key); this.persist() }
    },
    async login(phone, code) {
      const r = await api.login(phone, code)
      this.token = r.token; this.user = r.user
      uni.setStorageSync('token', r.token); uni.setStorageSync('user', r.user)
      // 合并游客购物车
      if (this.guestCart.length) {
        this.serverCart = await api.cartMerge(this.guestCart.map(({ productId, spec, qty, checked }) => ({ productId, spec, qty, checked })))
        this.guestCart = []; this.persist()
      } else await this.loadCart()
    },
    logout() {
      this.token = ''; this.user = null; this.serverCart = []
      uni.removeStorageSync('token'); uni.removeStorageSync('user')
    },
    addHistory(kw) {
      kw = kw.trim(); if (!kw) return
      this.history = [kw, ...this.history.filter(h => h !== kw)].slice(0, 10); this.persist()
    },
    clearHistory() { this.history = []; this.persist() },
    setCheckout(items, fromCart) { this.checkout = { items, fromCart } },
    // 需要登录时跳转登录页，登录后返回
    requireLogin() {
      if (this.token) return true
      uni.navigateTo({ url: '/pages/login/login' }); return false
    }
  }
})
