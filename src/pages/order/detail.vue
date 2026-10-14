<template>
  <view v-if="o" class="page">
    <view class="head">
      <view class="st">{{ o.status }}<text v-if="o.afterSaleStatus" style="font-size: 26rpx"> · 售后：{{ o.afterSaleStatus }}</text></view>
      <view class="sd">{{ statusDesc }}</view>
    </view>
    <view class="card row" style="gap: 20rpx; margin-top: -40rpx">
      <uni-icons type="location-filled" size="22" color="#FF5000" />
      <view class="f1"><view><text style="font-weight: 700">{{ o.address.name }}</text><text style="margin-left: 16rpx">{{ o.address.phone }}</text></view><view class="t2" style="margin-top: 8rpx">{{ o.address.region }} {{ o.address.detail }}</view></view>
    </view>
    <view class="card">
      <view v-for="(i, k) in o.items" :key="k" class="row item" @click="toDetail(i.productId)">
        <image :src="img(i.image)" class="pimg" mode="aspectFill" />
        <view class="f1"><view class="name">{{ i.name }}</view><view class="t3">{{ i.spec }}</view></view>
        <view style="text-align: right; font-size: 26rpx">¥{{ i.price }}<view class="t3">×{{ i.qty }}</view></view>
      </view>
      <view class="kv"><text class="t2">商品总额</text><text>¥{{ money(o.goodsAmount) }}</text></view>
      <view class="kv"><text class="t2">店铺优惠</text><text>-¥{{ money(o.discount) }}</text></view>
      <view class="kv"><text class="t2">运费</text><text>¥0.00</text></view>
      <view class="kv"><text style="font-weight: 700">实付款</text><text class="price"><text class="y">¥</text>{{ money(o.total) }}</text></view>
    </view>
    <view v-if="o.afterSale" class="card">
      <view style="font-weight: 700; margin-bottom: 12rpx">售后信息</view>
      <view class="kv"><text class="t2">售后类型</text><text>{{ o.afterSale.type }}</text></view>
      <view class="kv"><text class="t2">申请原因</text><text>{{ o.afterSale.reason }}</text></view>
      <view class="kv"><text class="t2">退款金额</text><text>¥{{ money(o.afterSale.amount) }}</text></view>
      <view class="kv"><text class="t2">处理进度</text><text style="color: #FF5000">{{ o.afterSale.status }}</text></view>
    </view>
    <view class="card">
      <view style="font-weight: 700; margin-bottom: 12rpx">订单信息</view>
      <view class="kv"><text class="t2">订单编号</text><text>{{ o.id }}</text></view>
      <view class="kv"><text class="t2">下单时间</text><text>{{ fmtTime(o.createdAt) }}</text></view>
      <view v-if="o.payMethod" class="kv"><text class="t2">支付方式</text><text>{{ o.payMethod }}</text></view>
      <view v-if="o.remark" class="kv"><text class="t2">订单备注</text><text>{{ o.remark }}</text></view>
    </view>
    <view class="card">
      <view style="font-weight: 700; margin-bottom: 12rpx">订单跟踪</view>
      <view v-for="(t, k) in [...o.timeline].reverse()" :key="k" class="tl row"><view :class="['dot', { on: k === 0 }]"></view><view class="f1"><view :style="{ color: k === 0 ? '#FF5000' : '#666' }">{{ t.s }}</view><view class="t3">{{ fmtTime(t.t) }}</view></view></view>
    </view>
    <view style="height: 160rpx"></view>
    <view class="bottom-bar" style="justify-content: flex-end; gap: 16rpx">
      <view v-for="b in orderButtons(o)" :key="b.k" :class="['btn', 'sm', b.c, 'act-' + b.k]" @click="act(b.k)">{{ b.t }}</view>
    </view>
  </view>
</template>
<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
import { money, fmtTime } from '../../utils/format'
import { orderButtons, doOrderAction } from '../../utils/order'
const id = ref(''), o = ref(null), now = ref(Date.now())
const load = async () => { if (id.value) o.value = await api.order(id.value) }
onLoad(q => { id.value = q.id })
onShow(load)
const t = setInterval(() => (now.value = Date.now()), 1000); onUnmounted(() => clearInterval(t))
const statusDesc = computed(() => {
  const x = o.value
  if (x.status === '待付款') { const s = Math.max(0, Math.floor((x.expireAt - now.value) / 1000)); return `请在 ${Math.floor(s / 60)}分${String(s % 60).padStart(2, '0')}秒 内完成支付，超时订单将自动取消` }
  return { 待发货: '商家正在打包，请耐心等待', 待收货: '包裹正在路上，请注意查收', 已完成: '交易已完成，感谢您的支持', 已取消: '订单已取消：' + (x.cancelReason || '') }[x.status]
})
const toDetail = pid => uni.navigateTo({ url: '/pages/detail/detail?id=' + pid })
const act = async k => { if (await doOrderAction(o.value, k)) load() }
</script>
<style lang="scss" scoped>
.head { background: linear-gradient(135deg, #FF8A00, #FF5000); color: #fff; padding: 40rpx 40rpx 80rpx; }
.st { font-size: 40rpx; font-weight: 700; } .sd { font-size: 24rpx; opacity: .9; margin-top: 12rpx; }
.item { gap: 20rpx; margin-bottom: 20rpx; } .pimg { width: 144rpx; height: 144rpx; border-radius: 16rpx; background: #EEE; } .name { font-size: 26rpx; line-height: 36rpx; }
.kv { display: flex; justify-content: space-between; padding: 14rpx 0; font-size: 26rpx; }
.tl { align-items: flex-start; gap: 20rpx; padding: 12rpx 0; font-size: 26rpx; }
.dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #DDD; margin-top: 12rpx; } .dot.on { background: $brand; }
</style>
