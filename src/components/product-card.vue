<template>
  <view class="pc" @click="go">
    <image :src="img(p.images[0])" mode="aspectFill" class="pimg" lazy-load />
    <view class="n"><text class="tag s">包邮</text>{{ p.name }}</view>
    <view class="r"><view class="price"><text class="y">¥</text><text class="v">{{ p.price }}</text></view><text class="t3">{{ salesText(p.sales) }}人付款</text></view>
  </view>
</template>
<script setup>
import { img } from '../config'
import { salesText } from '../utils/format'
const props = defineProps({ p: Object })
const go = () => uni.navigateTo({ url: '/pages/detail/detail?id=' + props.p.id })
</script>
<style lang="scss" scoped>
.pc { width: 343rpx; background: #fff; border-radius: 20rpx; overflow: hidden; margin-bottom: 16rpx; }
.pimg { width: 343rpx; height: 343rpx; display: block; background: #EEE; }
.n { padding: 16rpx 16rpx 8rpx; font-size: 26rpx; line-height: 36rpx; height: 72rpx; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.r { display: flex; justify-content: space-between; align-items: baseline; padding: 0 16rpx 20rpx; }
.v { font-size: 32rpx; }
</style>
