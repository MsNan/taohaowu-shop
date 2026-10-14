<template>
  <view class="empty">
    <view class="ill"><uni-icons :type="icon" size="64" color="#FFB38A" /></view>
    <view class="txt">{{ text }}</view>
    <view v-if="btn" class="btn sm" style="width: 240rpx; margin: 32rpx auto 0" @click="$emit('action')">{{ btn }}</view>
  </view>
</template>
<script setup>
defineProps({ icon: { type: String, default: 'info' }, text: String, btn: String })
defineEmits(['action'])
</script>
<style lang="scss" scoped>
.empty { text-align: center; padding: 120rpx 0 60rpx; }
.ill { width: 240rpx; height: 240rpx; border-radius: 50%; background: $brand-light; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
.txt { color: $text-3; margin-top: 28rpx; font-size: 28rpx; }
</style>
