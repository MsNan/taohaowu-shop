<template>
  <view class="page">
    <view class="card form">
      <view class="input-line"><text class="lb">收货人</text><input v-model="f.name" class="f1 a-name" placeholder="请输入姓名" /></view>
      <view class="input-line"><text class="lb">手机号</text><input v-model="f.phone" class="f1 a-phone" type="number" maxlength="11" placeholder="请输入手机号" /></view>
      <view class="input-line"><text class="lb">所在地区</text><input v-model="f.region" class="f1 a-region" placeholder="省 市 区，如：浙江省 杭州市 余杭区" /></view>
      <view class="input-line" style="height: auto; padding: 28rpx 0; align-items: flex-start"><text class="lb">详细地址</text><textarea v-model="f.detail" class="f1 a-detail" auto-height placeholder="街道、门牌号等" /></view>
      <view class="row sp" style="padding-top: 28rpx"><text>设为默认地址</text><switch :checked="f.isDefault" color="#FF5000" @change="e => (f.isDefault = e.detail.value)" style="transform: scale(.8)" /></view>
    </view>
    <view style="padding: 40rpx 24rpx"><view class="btn lg save-addr" @click="save">保存</view></view>
  </view>
</template>
<script setup>
import { reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '../../api/request'
const f = reactive({ id: null, name: '', phone: '', region: '', detail: '', isDefault: false })
onLoad(async o => {
  if (o.id) { uni.setNavigationBarTitle({ title: '编辑地址' }); Object.assign(f, (await api.addresses()).find(a => a.id === Number(o.id))) }
  else uni.setNavigationBarTitle({ title: '新增地址' })
})
async function save() {
  if (!f.name || !/^1\d{10}$/.test(f.phone) || !f.region || !f.detail) return uni.showToast({ title: '请完整填写正确的收货信息', icon: 'none' })
  await api.addressSave({ ...f })
  uni.showToast({ title: '已保存', icon: 'success' }); setTimeout(() => uni.navigateBack(), 400)
}
</script>
<style lang="scss" scoped>
.form { padding-top: 0; padding-bottom: 20rpx; } .lb { width: 160rpx; color: $text-2; font-size: 28rpx; flex-shrink: 0; }
</style>
