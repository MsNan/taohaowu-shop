<template>
  <view>
    <view class="head" :style="{ paddingTop: sbh + 'px' }">
      <view class="row user" @click="!store.loggedIn && login()">
        <view class="avatar">淘</view>
        <view class="f1">
          <view class="nick">{{ store.user ? store.user.nickname : '登录 / 注册' }}<text v-if="store.user" class="vip">88VIP</text></view>
          <view class="sub">{{ store.user ? '手机号 ' + mask(store.user.phone) : '登录后享受更多会员权益' }}</view>
        </view>
        <uni-icons type="gear" size="22" color="#fff" />
      </view>
      <view class="row stats"><view v-for="s in stats" :key="s[1]"><view class="sv">{{ s[0] }}</view><text>{{ s[1] }}</text></view></view>
    </view>
    <view class="card oc">
      <view class="row sp" @click="go('/pages/order/list')"><text style="font-weight: 700; font-size: 30rpx">我的订单</text><view class="row"><text class="t3">全部</text><uni-icons type="right" size="12" color="#999" /></view></view>
      <view class="row icons">
        <view v-for="t in otabs" :key="t.t" class="ic" @click="go('/pages/order/list?status=' + (t.s || ''))">
          <view style="position: relative"><uni-icons :type="t.i" size="26" color="#333" /><text v-if="counts[t.s]" class="badge">{{ counts[t.s] }}</text></view><text>{{ t.t }}</text>
        </view>
      </view>
    </view>
    <view class="card tools">
      <view v-for="t in tools" :key="t.t" class="ic" @click="t.u ? go(t.u) : soon()"><uni-icons :type="t.i" size="24" color="#FF5000" /><text>{{ t.t }}</text></view>
    </view>
    <view v-if="store.loggedIn" style="padding: 0 24rpx"><view class="btn g logout" @click="logout">退出登录</view></view>
    <view class="sec-title">— 猜你喜欢 —</view>
    <view class="feed"><product-card v-for="p in rec" :key="p.id" :p="p" /></view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { useShopStore } from '../../store'
import ProductCard from '../../components/product-card.vue'
const store = useShopStore()
const sbh = uni.getSystemInfoSync().statusBarHeight || 0
const counts = ref({}), rec = ref([])
const stats = [['28', '收藏夹'], ['16', '关注店铺'], ['132', '足迹'], ['5', '优惠券']]
const otabs = [{ t: '待付款', i: 'wallet', s: '待付款' }, { t: '待发货', i: 'gift', s: '待发货' }, { t: '待收货', i: 'paperplane', s: '待收货' }, { t: '已完成', i: 'checkbox', s: '已完成' }, { t: '退款/售后', i: 'loop', s: '' }]
const tools = [{ t: '收货地址', i: 'location', u: '/pages/address/list' }, { t: '优惠券', i: 'wallet' }, { t: '红包', i: 'gift' }, { t: '我的评价', i: 'star' }, { t: '客服中心', i: 'headphones' }, { t: '发票助手', i: 'paperclip' }, { t: '收藏', i: 'heart' }, { t: '账号安全', i: 'locked' }]
onLoad(async () => { rec.value = (await api.products({ sort: 'sales' })).slice(4, 8) })
onShow(async () => {
  if (!store.loggedIn) { counts.value = {}; return }
  const os = await api.orders().catch(() => [])
  const c = {}; os.forEach(o => (c[o.status] = (c[o.status] || 0) + 1)); counts.value = c
})
const mask = p => p.slice(0, 3) + '****' + p.slice(7)
const login = () => uni.navigateTo({ url: '/pages/login/login' })
const go = u => { if (store.requireLogin()) uni.navigateTo({ url: u }) }
const soon = () => uni.showToast({ title: '功能开发中', icon: 'none' })
const logout = () => uni.showModal({ title: '提示', content: '确定退出登录？', confirmColor: '#FF5000', success: r => { if (r.confirm) { store.logout(); counts.value = {} } } })
</script>
<style lang="scss" scoped>
.head { background: linear-gradient(135deg, #FF8A00, #FF5000); color: #fff; padding-bottom: 100rpx; }
.user { padding: 40rpx 36rpx 24rpx; gap: 28rpx; }
.avatar { width: 124rpx; height: 124rpx; border-radius: 50%; background: #fff; color: $brand; font-size: 56rpx; font-weight: 800; text-align: center; line-height: 124rpx; border: 4rpx solid rgba(255,255,255,.6); }
.nick { font-size: 38rpx; font-weight: 700; } .vip { font-size: 20rpx; background: $text-1; color: #FFD591; padding: 2rpx 12rpx; border-radius: 16rpx; margin-left: 12rpx; vertical-align: 6rpx; }
.sub { font-size: 24rpx; opacity: .85; margin-top: 8rpx; }
.stats { justify-content: space-around; text-align: center; font-size: 22rpx; } .sv { font-size: 36rpx; font-weight: 700; }
.oc { margin-top: -80rpx; } .icons { justify-content: space-around; margin-top: 28rpx; }
.ic { display: flex; flex-direction: column; align-items: center; font-size: 24rpx; gap: 8rpx; }
.tools { display: flex; flex-wrap: wrap; padding: 32rpx 0 8rpx; } .tools .ic { width: 25%; margin-bottom: 28rpx; }
</style>
