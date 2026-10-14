<template>
  <view>
    <view class="head" :style="{ paddingTop: sbh + 'px' }">
      <view class="row sp brand"><text class="logo">淘好物</text><view class="row loc"><uni-icons type="location" size="14" color="#fff" /><text>杭州</text></view></view>
      <view class="search" @click="toSearch">
        <uni-icons type="search" size="16" color="#999" /><text class="ph">无线耳机 新品立减</text><view class="go">搜索</view>
      </view>
      <scroll-view scroll-x class="chan"><text v-for="(c, i) in chans" :key="c" :class="['ch', { on: i === 0 }]" @click="i && goCat(i)">{{ c }}</text></scroll-view>
    </view>
    <swiper class="banner" autoplay circular indicator-dots indicator-color="rgba(255,255,255,.5)" indicator-active-color="#fff">
      <swiper-item v-for="b in banners" :key="b.id" @click="toDetail(b.productId)"><image :src="img(b.image)" mode="aspectFill" class="bimg" /></swiper-item>
    </swiper>
    <view class="card grid">
      <view v-for="g in grid" :key="g.name" class="cell" @click="g.id ? goCat(g.id) : toSearch()">
        <view class="gi"><uni-icons :type="g.icon" size="24" color="#FF5000" /></view><text>{{ g.name }}</text>
      </view>
    </view>
    <view class="card row sk" @click="toSearch">
      <uni-icons type="fire-filled" size="18" color="#FF5000" /><text class="skt">限时秒杀</text><text class="cd">{{ countdown }}</text>
      <text class="t3" style="margin-left: auto">更多</text><uni-icons type="right" size="12" color="#999" />
    </view>
    <view class="sec-title">— 猜你喜欢 —</view>
    <view class="feed"><product-card v-for="p in products" :key="p.id" :p="p" /></view>
    <view class="t3" style="text-align: center; padding: 20rpx 0 40rpx">— 已经到底啦 —</view>
  </view>
</template>
<script setup>
import { ref, onUnmounted } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
import { useShopStore } from '../../store'
import ProductCard from '../../components/product-card.vue'
const store = useShopStore()
const sbh = uni.getSystemInfoSync().statusBarHeight || 0
const banners = ref([]), products = ref([]), grid = ref([])
const chans = ['推荐', '手机', '女装', '美妆', '家电', '食品', '家居', '运动', '母婴']
const ICON = { 1: 'phone', 2: 'shop', 3: 'heart', 4: 'videocam', 5: 'gift', 6: 'home', 7: 'flag', 8: 'star' }
async function load() {
  const d = await api.home()
  banners.value = d.banners; products.value = d.products
  grid.value = [...d.categories.map(c => ({ id: c.id, name: c.name, icon: ICON[c.id] })), { name: '领券中心', icon: 'wallet' }, { name: '限时秒杀', icon: 'fire' }]
}
onLoad(load)
onShow(() => store.loadCart())
const toSearch = () => uni.navigateTo({ url: '/pages/search/search' })
const toDetail = id => uni.navigateTo({ url: '/pages/detail/detail?id=' + id })
const goCat = id => { uni.setStorageSync('cat-pick', id); uni.switchTab({ url: '/pages/category/category' }) }
// 秒杀倒计时
const end = Date.now() + 2 * 3600e3 + 15 * 60e3
const countdown = ref('')
const tick = () => { const s = Math.max(0, Math.floor((end - Date.now()) / 1000)); const p = n => String(n).padStart(2, '0'); countdown.value = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}` }
tick(); const timer = setInterval(tick, 1000); onUnmounted(() => clearInterval(timer))
</script>
<style lang="scss" scoped>
.head { background: linear-gradient(135deg, #FF8A00, #FF5000); color: #fff; }
.brand { padding: 16rpx 28rpx 8rpx; } .logo { font-size: 40rpx; font-weight: 800; letter-spacing: 2rpx; } .loc { font-size: 24rpx; gap: 4rpx; }
.search { margin: 8rpx 24rpx 16rpx; height: 72rpx; border-radius: 36rpx; background: #fff; display: flex; align-items: center; padding: 0 8rpx 0 28rpx; }
.ph { color: $text-3; font-size: 26rpx; margin-left: 12rpx; flex: 1; }
.go { background: $grad; color: #fff; border-radius: 30rpx; padding: 10rpx 28rpx; font-size: 26rpx; }
.chan { white-space: nowrap; padding: 0 28rpx 18rpx; box-sizing: border-box; }
.ch { display: inline-block; margin-right: 36rpx; font-size: 28rpx; opacity: .85; padding-bottom: 6rpx; }
.ch.on { opacity: 1; font-weight: 700; border-bottom: 4rpx solid #fff; }
.banner { height: 260rpx; margin: 20rpx 24rpx 0; border-radius: 24rpx; overflow: hidden; transform: translateZ(0); }
.bimg { width: 100%; height: 260rpx; }
.grid { display: flex; flex-wrap: wrap; padding: 24rpx 0 8rpx; }
.cell { width: 20%; display: flex; flex-direction: column; align-items: center; font-size: 22rpx; margin-bottom: 20rpx; }
.gi { width: 80rpx; height: 80rpx; border-radius: 28rpx; background: $brand-light; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx; }
.sk { padding: 20rpx 24rpx; gap: 12rpx; } .skt { color: $brand; font-weight: 700; } .cd { background: $text-1; color: #fff; font-size: 22rpx; padding: 2rpx 10rpx; border-radius: 6rpx; font-family: Arial; }
</style>
