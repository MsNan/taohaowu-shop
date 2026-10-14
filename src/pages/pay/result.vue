<template>
  <view class="page">
    <view class="top">
      <view class="ok"><uni-icons type="checkmarkempty" size="40" color="#fff" /></view>
      <view class="st">支付成功</view>
      <view class="price amt"><text class="y">¥</text>{{ o ? money(o.total) : '' }}</view>
      <view class="t3" v-if="o">{{ o.payMethod }} · 订单号 {{ o.id }}</view>
      <view class="row" style="justify-content: center; gap: 24rpx; margin-top: 48rpx">
        <view class="btn g" style="width: 260rpx" @click="home">返回首页</view>
        <view class="btn o view-order" style="width: 260rpx" @click="view">查看订单</view>
      </view>
    </view>
    <view class="card row coupon"><uni-icons type="gift-filled" size="28" color="#FF5000" /><view class="f1" style="margin-left: 16rpx"><view style="color: #FF5000; font-weight: 700">恭喜获得 ¥10 无门槛券</view><view class="t3">已放入「我的-优惠券」，7天内有效</view></view><view class="btn sm" @click="home">去使用</view></view>
    <view class="sec-title">— 猜你喜欢 —</view>
    <view class="feed"><product-card v-for="p in rec" :key="p.id" :p="p" /></view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { money } from '../../utils/format'
import ProductCard from '../../components/product-card.vue'
const o = ref(null), rec = ref([])
onLoad(async q => { o.value = await api.order(q.id); rec.value = (await api.products({ sort: 'price_asc' })).slice(0, 4) })
const home = () => uni.switchTab({ url: '/pages/index/index' })
const view = () => uni.redirectTo({ url: '/pages/order/detail?id=' + o.value.id })
</script>
<style lang="scss" scoped>
.top { background: #fff; text-align: center; padding: 72rpx 0 56rpx; }
.ok { width: 144rpx; height: 144rpx; border-radius: 50%; background: $success; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
.st { font-size: 40rpx; font-weight: 700; margin-top: 32rpx; } .amt { color: $text-1; font-size: 60rpx; margin: 16rpx 0 12rpx; }
.coupon { background: $brand-light; box-shadow: none; }
</style>
