<template>
  <view v-if="o" class="page">
    <view class="card">
      <view v-for="(i, k) in o.items" :key="k" class="row" style="gap: 20rpx; margin-bottom: 12rpx">
        <image :src="img(i.image)" class="pimg" mode="aspectFill" /><view class="f1"><view style="font-size: 26rpx">{{ i.name }}</view><view class="t3">{{ i.spec }} ×{{ i.qty }}</view></view>
      </view>
    </view>
    <view class="card">
      <view class="h">售后类型</view>
      <view v-for="t in types" :key="t.t" class="row sp opt" @click="type = t.t">
        <view><view>{{ t.t }}</view><view class="t3">{{ t.d }}</view></view>
        <view :class="['ck', { on: type === t.t }]"><uni-icons v-if="type === t.t" type="checkmarkempty" size="12" color="#fff" /></view>
      </view>
    </view>
    <view class="card">
      <view class="h">申请原因</view>
      <view class="chips"><text v-for="r in reasons" :key="r" :class="['chip', { on: reason === r }]" @click="reason = r">{{ r }}</text></view>
      <view class="h" style="margin-top: 32rpx">问题描述</view>
      <textarea v-model="desc" class="ta" placeholder="请描述具体问题，有助于商家更快处理（选填）" maxlength="200" />
      <view class="row sp" style="margin-top: 24rpx"><text class="t2">退款金额</text><text class="price"><text class="y">¥</text>{{ money(o.total) }}</text></view>
    </view>
    <view style="padding: 32rpx 24rpx 60rpx"><view class="btn lg submit-as" @click="submit">提交申请</view></view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
import { money } from '../../utils/format'
const o = ref(null), type = ref('仅退款'), reason = ref(''), desc = ref('')
const types = [{ t: '仅退款', d: '未收到货，或与商家协商一致' }, { t: '退货退款', d: '已收到货，需要退还商品' }, { t: '换货', d: '商品有问题，需要更换' }]
const reasons = ['不想要了', '商品质量问题', '与描述不符', '发错货/漏发', '物流太慢', '其他']
onLoad(async q => { o.value = await api.order(q.id) })
async function submit() {
  if (!reason.value) return uni.showToast({ title: '请选择申请原因', icon: 'none' })
  await api.afterSale(o.value.id, { type: type.value, reason: reason.value, desc: desc.value })
  uni.showToast({ title: '已提交，等待商家处理', icon: 'none' })
  setTimeout(() => uni.redirectTo({ url: '/pages/order/detail?id=' + o.value.id }), 600)
}
</script>
<style lang="scss" scoped>
.pimg { width: 120rpx; height: 120rpx; border-radius: 12rpx; background: #EEE; }
.h { font-weight: 700; margin-bottom: 16rpx; } .opt { padding: 20rpx 0; border-top: 1rpx solid $line; font-size: 28rpx; }
.chips { display: flex; flex-wrap: wrap; gap: 20rpx; }
.chip { background: $bg; padding: 12rpx 28rpx; border-radius: 16rpx; font-size: 26rpx; border: 2rpx solid $bg; }
.chip.on { background: $brand-light; color: $brand; border-color: $brand; }
.ta { width: 100%; height: 180rpx; background: $bg; border-radius: 16rpx; padding: 20rpx; box-sizing: border-box; font-size: 26rpx; }
</style>
