<template>
  <view class="page">
    <template v-if="store.cart.length">
      <view class="tip row" v-if="store.checkedTotal < 300"><uni-icons type="gift" size="16" color="#FF5000" /><text class="f1" style="margin-left: 8rpx">跨店满300减50，再凑 ¥{{ money(300 - store.checkedTotal) }} 即可享受</text></view>
      <view class="tip row" v-else><uni-icons type="checkbox-filled" size="16" color="#FF5000" /><text class="f1" style="margin-left: 8rpx">已享跨店满300减50</text></view>
      <view v-for="g in groups" :key="g.shop" class="card">
        <view class="row" style="gap: 16rpx; padding-bottom: 8rpx"><uni-icons type="shop" size="18" color="#333" /><text style="font-weight: 700">{{ g.shop }}</text><uni-icons type="right" size="12" color="#999" /></view>
        <view v-for="i in g.items" :key="i.key" class="item row">
          <view :class="['ck', { on: i.checked }]" @click="store.toggle(i.key)"><uni-icons v-if="i.checked" type="checkmarkempty" size="12" color="#fff" /></view>
          <image :src="img(i.product.images[0])" class="pimg" mode="aspectFill" @click="toDetail(i.productId)" />
          <view class="f1">
            <view class="name">{{ i.product.name }}</view>
            <text class="spec">{{ i.spec }}</text>
            <view class="row sp">
              <view class="price"><text class="y">¥</text><text style="font-size: 32rpx">{{ i.product.price }}</text></view>
              <view class="step"><view :class="['b', { dis: i.qty <= 1 }]" @click="i.qty > 1 && store.setQty(i.key, i.qty - 1)">－</view><view class="n">{{ i.qty }}</view><view class="b" @click="store.setQty(i.key, i.qty + 1)">＋</view></view>
            </view>
          </view>
          <view class="del" @click="del(i.key)"><uni-icons type="trash" size="16" color="#C8C8C8" /></view>
        </view>
      </view>
      <view style="height: 140rpx"></view>
      <view class="cbar row">
        <view class="row" @click="store.toggleAll(!allChecked)"><view :class="['ck', { on: allChecked }]"><uni-icons v-if="allChecked" type="checkmarkempty" size="12" color="#fff" /></view><text style="margin-left: 12rpx">全选</text></view>
        <view class="f1" style="text-align: right; margin-right: 20rpx">
          <view>合计：<text class="price"><text class="y">¥</text><text style="font-size: 36rpx">{{ money(payable) }}</text></text></view>
          <view class="t3" v-if="discount">已优惠 ¥{{ discount }}</view>
        </view>
        <view class="btn checkout" @click="checkout">结算({{ checkedCount }})</view>
      </view>
    </template>
    <empty-state v-else icon="cart" text="购物车空空如也～" btn="去逛逛" @action="goHome" />
    <view class="sec-title">— 猜你喜欢 —</view>
    <view class="feed"><product-card v-for="p in rec" :key="p.id" :p="p" /></view>
  </view>
</template>
<script setup>
import { ref, computed } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
import { money } from '../../utils/format'
import { useShopStore } from '../../store'
import ProductCard from '../../components/product-card.vue'
import EmptyState from '../../components/empty-state.vue'
const store = useShopStore()
const rec = ref([])
onLoad(async () => { rec.value = (await api.products({ sort: 'sales' })).slice(0, 4) })
onShow(() => store.loadCart())
const groups = computed(() => {
  const m = {}
  store.cart.forEach(i => (m[i.product.shop] ||= { shop: i.product.shop, items: [] }).items.push(i))
  return Object.values(m)
})
const allChecked = computed(() => store.cart.length > 0 && store.cart.every(i => i.checked))
const checkedCount = computed(() => store.checkedItems.reduce((n, i) => n + i.qty, 0))
const discount = computed(() => (store.checkedTotal >= 300 ? 50 : 0))
const payable = computed(() => store.checkedTotal - discount.value)
const goHome = () => uni.switchTab({ url: '/pages/index/index' })
const toDetail = id => uni.navigateTo({ url: '/pages/detail/detail?id=' + id })
const del = key => uni.showModal({ title: '提示', content: '确定删除该商品？', confirmColor: '#FF5000', success: r => r.confirm && store.remove(key) })
function checkout() {
  if (!store.checkedItems.length) return uni.showToast({ title: '请选择商品', icon: 'none' })
  store.setCheckout(store.checkedItems.map(i => ({ productId: i.productId, spec: i.spec, qty: i.qty, product: i.product })), true)
  if (store.requireLogin()) uni.navigateTo({ url: '/pages/order/confirm' })
}
</script>
<style lang="scss" scoped>
.page { padding-top: 4rpx; }
.tip { margin: 20rpx 24rpx 0; background: $brand-light; color: $brand; font-size: 24rpx; padding: 18rpx 24rpx; border-radius: 16rpx; }
.item { gap: 20rpx; padding: 20rpx 0; position: relative; }
.pimg { width: 176rpx; height: 176rpx; border-radius: 16rpx; background: #EEE; flex-shrink: 0; }
.name { font-size: 26rpx; line-height: 36rpx; height: 72rpx; overflow: hidden; padding-right: 40rpx; }
.spec { display: inline-block; background: $bg; color: #888; font-size: 22rpx; padding: 2rpx 12rpx; border-radius: 8rpx; margin: 8rpx 0 12rpx; }
.del { position: absolute; right: 0; top: 20rpx; }
.cbar { position: fixed; left: 0; right: 0; bottom: var(--window-bottom); height: 112rpx; background: #fff; padding: 0 24rpx; box-shadow: 0 -2rpx 0 #EEE; z-index: 50; }
.checkout { padding: 0 44rpx; }
</style>
