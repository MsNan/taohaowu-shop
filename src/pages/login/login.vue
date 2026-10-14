<template>
  <view class="page">
    <view class="logo-wrap"><view class="logo">淘</view><view class="bn">淘好物</view><view class="t3" style="font-size: 26rpx; margin-top: 8rpx">好物不贵，淘得开心</view></view>
    <view class="form">
      <view class="input-line"><text style="margin-right: 32rpx">+86</text><input v-model="phone" class="f1 phone" type="number" maxlength="11" placeholder="请输入手机号" placeholder-class="ph" /></view>
      <view class="input-line"><input v-model="code" class="f1 code" type="number" maxlength="6" placeholder="请输入验证码" placeholder-class="ph" />
        <text :class="['get', { dis: cd > 0 }]" @click="send">{{ cd > 0 ? cd + 's 后重发' : '获取验证码' }}</text></view>
      <view v-if="devCode" class="dev">开发模式验证码：<text style="font-weight: 700">{{ devCode }}</text>（生产环境通过短信发送）</view>
      <view :class="['btn', 'lg', 'login-btn', { disabled: !canLogin }]" style="margin-top: 64rpx" @click="submit">登录</view>
      <view class="row agree" @click="agree = !agree">
        <view :class="['ck', { on: agree }]" style="width: 30rpx; height: 30rpx"><uni-icons v-if="agree" type="checkmarkempty" size="10" color="#fff" /></view>
        <text style="margin-left: 10rpx">我已阅读并同意<text class="link">《用户协议》</text>和<text class="link">《隐私政策》</text></text>
      </view>
    </view>
    <view class="other"><view class="t3">—— 其他登录方式 ——</view>
      <view class="row" style="justify-content: center; gap: 72rpx; margin-top: 28rpx">
        <view v-for="o in others" :key="o.t" class="oi" @click="tip"><view class="oc" :style="{ background: o.c }"><uni-icons :type="o.i" size="22" color="#fff" /></view><text>{{ o.t }}</text></view>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref, computed } from 'vue'
import { api } from '../../api/request'
import { useShopStore } from '../../store'
const store = useShopStore()
const phone = ref(''), code = ref(''), agree = ref(false), cd = ref(0), devCode = ref('')
const others = [{ t: '微信', i: 'weixin', c: '#07C160' }, { t: '支付宝', i: 'wallet', c: '#1677FF' }, { t: 'Apple', i: 'person', c: '#1F1F1F' }]
const canLogin = computed(() => /^1\d{10}$/.test(phone.value) && code.value.length === 6)
async function send() {
  if (cd.value > 0) return
  if (!/^1\d{10}$/.test(phone.value)) return uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
  const r = await api.sms(phone.value)
  devCode.value = r.devCode || ''
  uni.showToast({ title: '验证码已发送', icon: 'none' })
  cd.value = 60; const t = setInterval(() => { if (--cd.value <= 0) clearInterval(t) }, 1000)
}
async function submit() {
  if (!canLogin.value) return uni.showToast({ title: '请填写手机号和6位验证码', icon: 'none' })
  if (!agree.value) return uni.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
  await store.login(phone.value, code.value)
  uni.showToast({ title: '登录成功', icon: 'success' })
  setTimeout(() => (getCurrentPages().length > 1 ? uni.navigateBack() : uni.switchTab({ url: '/pages/my/my' })), 500)
}
const tip = () => uni.showToast({ title: '演示版暂仅支持手机号登录', icon: 'none' })
</script>
<style lang="scss" scoped>
.page { background: #fff; min-height: 100vh; }
.logo-wrap { text-align: center; padding-top: 80rpx; }
.logo { width: 152rpx; height: 152rpx; margin: 0 auto; border-radius: 44rpx; background: linear-gradient(135deg, #FF8A00, #FF5000); color: #fff; font-size: 76rpx; font-weight: 800; line-height: 152rpx; box-shadow: 0 16rpx 40rpx rgba(255,80,0,.3); }
.bn { font-size: 48rpx; font-weight: 800; margin-top: 32rpx; }
.form { padding: 72rpx 64rpx 0; } :deep(.ph) { color: $text-4; }
.get { color: $brand; font-size: 28rpx; } .get.dis { color: $text-3; }
.dev { margin-top: 20rpx; background: $brand-light; color: $brand; font-size: 24rpx; padding: 14rpx 20rpx; border-radius: 12rpx; }
.agree { margin-top: 32rpx; font-size: 24rpx; color: $text-3; } .link { color: #4A6FA5; }
.other { text-align: center; margin-top: 140rpx; padding-bottom: 60rpx; font-size: 24rpx; color: $text-2; }
.oi { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.oc { width: 92rpx; height: 92rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
</style>
