<template>
  <view>
    <view class="tabs row"><text v-for="t in tabs" :key="t" :class="['tb', { on: cur === t }]" @click="setTab(t)">{{ t }}</text></view>
    <view style="height: 88rpx"></view>
    <view v-for="o in list" :key="o.id" class="card order" @click="detail(o.id)">
      <view class="row sp"><view class="row" style="gap: 8rpx"><uni-icons type="shop" size="16" color="#333" /><text style="font-weight: 700">{{ o.items[0] && shopName(o) }}</text></view>
        <text :style="{ color: STATUS_COLOR[o.status], fontSize: '26rpx' }">{{ o.afterSaleStatus ? '售后中 · ' : '' }}{{ o.status }}</text></view>
      <view v-for="(i, k) in o.items" :key="k" class="row item">
        <image :src="img(i.image)" class="pimg" mode="aspectFill" />
        <view class="f1"><view class="name">{{ i.name }}</view><view class="t3">{{ i.spec }}</view></view>
        <view style="text-align: right; font-size: 26rpx">¥{{ i.price }}<view class="t3">×{{ i.qty }}</view></view>
      </view>
      <view v-if="o.status === '待付款'" class="t3" style="text-align: right">{{ left(o) }}</view>
      <view style="text-align: right; font-size: 26rpx; margin-top: 8rpx">实付 <text style="font-weight: 700">¥{{ money(o.total) }}</text></view>
      <view class="row" style="justify-content: flex-end; gap: 16rpx; margin-top: 20rpx">
        <view v-for="b in orderButtons(o)" :key="b.k" :class="['btn', 'sm', b.c, 'act-' + b.k]" @click.stop="act(o, b.k)">{{ b.t }}</view>
      </view>
    </view>
    <empty-state v-if="loaded && !list.length" icon="list" text="还没有相关订单哦" btn="去首页看看" @action="home" />
  </view>
</template>
<script setup>
import { ref, onUnmounted } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
import { money, STATUS_COLOR } from '../../utils/format'
import { orderButtons, doOrderAction } from '../../utils/order'
import EmptyState from '../../components/empty-state.vue'
const tabs = ['全部', '待付款', '待发货', '待收货', '已完成', '已取消']
const cur = ref('全部'), list = ref([]), loaded = ref(false), now = ref(Date.now())
const load = async () => { list.value = await api.orders(cur.value === '全部' ? '' : cur.value); loaded.value = true }
onLoad(o => { if (o.status) cur.value = o.status })
onShow(load)
const setTab = t => { cur.value = t; load() }
const detail = id => uni.navigateTo({ url: '/pages/order/detail?id=' + id })
const home = () => uni.switchTab({ url: '/pages/index/index' })
const shopName = () => '淘好物官方旗舰店'
const act = async (o, k) => { if (await doOrderAction(o, k)) load() }
const t = setInterval(() => (now.value = Date.now()), 1000); onUnmounted(() => clearInterval(t))
const left = o => { const s = Math.max(0, Math.floor((o.expireAt - now.value) / 1000)); return `剩余 ${Math.floor(s / 60)}分${String(s % 60).padStart(2, '0')}秒 自动关闭` }
</script>
<style lang="scss" scoped>
.tabs { position: fixed; top: var(--window-top); left: 0; right: 0; height: 88rpx; background: #fff; justify-content: space-around; z-index: 10; }
.tb { color: #555; font-size: 28rpx; padding: 18rpx 0 12rpx; border-bottom: 6rpx solid transparent; }
.tb.on { color: $brand; font-weight: 700; border-bottom-color: $brand; }
.item { gap: 20rpx; margin: 20rpx 0; } .pimg { width: 144rpx; height: 144rpx; border-radius: 16rpx; background: #EEE; } .name { font-size: 26rpx; line-height: 36rpx; }
</style>
