<template>
  <view class="wrap">
    <view class="top"><view class="search row" @click="toSearch"><uni-icons type="search" size="16" color="#999" /><text class="t3" style="margin-left: 12rpx; font-size: 26rpx">搜索商品/品牌</text></view></view>
    <view class="main">
      <scroll-view scroll-y class="left">
        <view v-for="c in cats" :key="c.id" :class="['li', { on: c.id === cur }]" @click="cur = c.id">{{ c.name }}</view>
      </scroll-view>
      <scroll-view scroll-y class="right">
        <image v-if="banner" :src="img(banner)" class="cb" mode="aspectFill" />
        <view class="h">{{ curName }} · 热门商品</view>
        <view v-for="p in list" :key="p.id" class="item" @click="go(p.id)">
          <image :src="img(p.images[0])" mode="aspectFill" class="pimg" />
          <view class="info f1"><view class="name">{{ p.name }}</view><view class="t3">{{ p.shop }} · 月销 {{ p.sales }}</view>
            <view class="price"><text class="y">¥</text><text style="font-size: 32rpx">{{ p.price }}</text></view></view>
        </view>
        <empty-state v-if="!list.length" icon="info" text="该分类暂无商品" />
      </scroll-view>
    </view>
  </view>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
import EmptyState from '../../components/empty-state.vue'
const cats = ref([]), cur = ref(1), list = ref([]), banner = ref('')
const curName = computed(() => cats.value.find(c => c.id === cur.value)?.name || '')
onLoad(async () => { const d = await api.home(); cats.value = d.categories; banner.value = d.banners[1]?.image })
onShow(() => { const c = uni.getStorageSync('cat-pick'); if (c) { cur.value = Number(c); uni.removeStorageSync('cat-pick') } })
watch(cur, async v => { list.value = await api.products({ categoryId: v }) }, { immediate: true })
const go = id => uni.navigateTo({ url: '/pages/detail/detail?id=' + id })
const toSearch = () => uni.navigateTo({ url: '/pages/search/search' })
</script>
<style lang="scss" scoped>
.wrap { display: flex; flex-direction: column; height: calc(100vh - var(--window-top) - var(--window-bottom)); }
.top { background: #fff; padding: 12rpx 24rpx 20rpx; }
.search { height: 72rpx; border-radius: 36rpx; border: 2rpx solid $brand; padding: 0 28rpx; }
.main { flex: 1; display: flex; overflow: hidden; }
.left { width: 176rpx; background: $bg; height: 100%; }
.li { height: 104rpx; line-height: 104rpx; text-align: center; font-size: 26rpx; color: #555; }
.li.on { background: #fff; color: $brand; font-weight: 700; border-left: 6rpx solid $brand; }
.right { flex: 1; background: #fff; height: 100%; padding: 24rpx; box-sizing: border-box; }
.cb { width: 100%; height: 180rpx; border-radius: 20rpx; }
.h { font-weight: 700; margin: 28rpx 0 12rpx; }
.item { display: flex; padding: 20rpx 0; gap: 20rpx; }
.pimg { width: 160rpx; height: 160rpx; border-radius: 16rpx; background: #EEE; }
.info { display: flex; flex-direction: column; justify-content: space-between; } .name { font-size: 26rpx; line-height: 36rpx; }
</style>
