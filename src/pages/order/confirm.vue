<template>
  <view class="page">
    <view class="card addr" @click="pickAddr">
      <view v-if="addr" class="row" style="gap: 20rpx">
        <uni-icons type="location-filled" size="24" color="#FF5000" />
        <view class="f1"><view><text class="nm">{{ addr.name }}</text><text style="margin-left: 16rpx">{{ addr.phone }}</text><text v-if="addr.isDefault" class="tag s" style="margin-left: 12rpx">默认</text></view>
          <view class="t2" style="margin-top: 8rpx; line-height: 36rpx">{{ addr.region }} {{ addr.detail }}</view></view>
        <uni-icons type="right" size="14" color="#999" />
      </view>
      <view v-else class="row no-addr" style="gap: 16rpx"><uni-icons type="plus-filled" size="24" color="#FF5000" /><text class="f1" style="font-weight: 600">请添加收货地址</text><uni-icons type="right" size="14" color="#999" /></view>
      <view class="stripe"></view>
    </view>
    <view class="card">
      <view v-for="(i, k) in items" :key="k" class="row item">
        <image :src="img(i.product.images[0])" class="pimg" mode="aspectFill" />
        <view class="f1"><view class="name">{{ i.product.name }}</view><view class="t3" style="margin-top: 8rpx">{{ i.spec }}</view></view>
        <view style="text-align: right"><view class="price"><text class="y">¥</text>{{ i.product.price }}</view><view class="t3">×{{ i.qty }}</view></view>
      </view>
      <view class="kv"><text class="t2">商品金额</text><text>¥{{ money(goods) }}</text></view>
      <view class="kv"><text class="t2">配送服务</text><text>快递 免邮</text></view>
      <view class="kv"><text class="t2">店铺优惠</text><text style="color: #FF5000">{{ discount ? '-¥' + discount : '暂无可用' }}</text></view>
      <view class="kv"><text class="t2">订单备注</text><input v-model="remark" class="f1 rm" placeholder="选填，请先和商家协商一致" /></view>
    </view>
    <view class="card">
      <view v-for="m in methods" :key="m.t" class="row sp pm" @click="method = m.t">
        <view class="row" style="gap: 16rpx"><view class="mi" :style="{ background: m.c }"><uni-icons :type="m.i" size="16" color="#fff" /></view><text>{{ m.t }}</text></view>
        <view :class="['ck', { on: method === m.t }]"><uni-icons v-if="method === m.t" type="checkmarkempty" size="12" color="#fff" /></view>
      </view>
    </view>
    <view style="height: 160rpx"></view>
    <view class="bottom-bar"><text class="t2">共 {{ count }} 件</text><view class="f1" style="text-align: right; margin-right: 20rpx">实付 <text class="price"><text class="y">¥</text><text style="font-size: 40rpx">{{ money(goods - discount) }}</text></text></view><view class="btn submit-order" @click="submit">提交订单</view></view>
    <!-- 模拟收银台 -->
    <view v-if="cashier" class="mask">
      <view class="sheet">
        <view class="row sp"><uni-icons type="closeempty" size="22" color="#999" @click="cancelPay" /><text style="font-weight: 700; font-size: 32rpx">淘好物收银台</text><view style="width: 44rpx"></view></view>
        <view style="text-align: center; margin: 48rpx 0 12rpx"><text class="price" style="color: #1F1F1F; font-size: 64rpx"><text class="y">¥</text>{{ money(order.total) }}</text></view>
        <view class="t3" style="text-align: center">请在 15 分钟内完成支付 · {{ method }}</view>
        <view class="t3" style="text-align: center; margin-top: 8rpx">演示环境：模拟支付，不会真实扣款</view>
        <view class="btn lg confirm-pay" style="margin-top: 56rpx" @click="pay">确认支付</view>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
import { money } from '../../utils/format'
import { useShopStore } from '../../store'
const store = useShopStore()
const items = computed(() => store.checkout.items)
const addr = ref(null), remark = ref(''), method = ref('支付宝'), cashier = ref(false), order = ref(null)
const methods = [{ t: '支付宝', i: 'wallet', c: '#1677FF' }, { t: '微信支付', i: 'weixin', c: '#07C160' }, { t: '银行卡', i: 'compose', c: '#FF9500' }]
const goods = computed(() => items.value.reduce((t, i) => t + i.product.price * i.qty, 0))
const discount = computed(() => (goods.value >= 300 ? 50 : 0))
const count = computed(() => items.value.reduce((n, i) => n + i.qty, 0))
onShow(async () => {
  const list = await api.addresses()
  addr.value = list.find(a => a.id === store.addressId) || list.find(a => a.isDefault) || list[0] || null
})
const pickAddr = () => uni.navigateTo({ url: addr.value ? '/pages/address/list?select=1' : '/pages/address/edit' })
async function submit() {
  if (!items.value.length) return uni.showToast({ title: '没有待结算商品', icon: 'none' })
  if (!addr.value) return uni.showToast({ title: '请先添加收货地址', icon: 'none' })
  order.value = await api.orderCreate({ items: items.value.map(({ productId, spec, qty }) => ({ productId, spec, qty })), addressId: addr.value.id, remark: remark.value, fromCart: store.checkout.fromCart })
  store.setCheckout([], false); store.loadCart()
  cashier.value = true
}
async function pay() {
  uni.showLoading({ title: '支付中...' })
  await api.orderAct(order.value.id, 'pay', { method: method.value }).finally(() => uni.hideLoading())
  uni.redirectTo({ url: '/pages/pay/result?id=' + order.value.id })
}
const cancelPay = () => uni.showModal({ title: '确定放弃付款？', content: '订单会保留 15 分钟，超时将自动取消', cancelText: '继续支付', confirmText: '放弃', confirmColor: '#999',
  success: r => r.confirm && uni.redirectTo({ url: '/pages/order/detail?id=' + order.value.id }) })
</script>
<style lang="scss" scoped>
.addr { position: relative; overflow: hidden; padding-bottom: 32rpx; } .nm { font-size: 32rpx; font-weight: 700; }
.stripe { position: absolute; left: 0; right: 0; bottom: 0; height: 6rpx; background: repeating-linear-gradient(90deg, #FF5000 0 36rpx, #fff 36rpx 48rpx, #4A90E2 48rpx 84rpx, #fff 84rpx 96rpx); }
.item { gap: 20rpx; margin-bottom: 24rpx; } .pimg { width: 144rpx; height: 144rpx; border-radius: 16rpx; background: #EEE; } .name { font-size: 26rpx; line-height: 36rpx; }
.kv { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-top: 1rpx solid $line; font-size: 26rpx; }
.rm { text-align: right; margin-left: 40rpx; font-size: 26rpx; }
.pm { padding: 16rpx 0; } .mi { width: 44rpx; height: 44rpx; border-radius: 10rpx; display: flex; align-items: center; justify-content: center; }
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 999; display: flex; align-items: flex-end; }
.sheet { background: #fff; width: 100%; border-radius: 32rpx 32rpx 0 0; padding: 32rpx 40rpx calc(48rpx + env(safe-area-inset-bottom)); box-sizing: border-box; }
</style>
