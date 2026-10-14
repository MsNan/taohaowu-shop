<template>
  <view v-if="p" class="page">
    <view class="float row sp" :style="{ top: sbh + 8 + 'px' }">
      <view class="fb" @click="back"><uni-icons type="left" size="20" color="#fff" /></view>
      <view class="fb" @click="toCart"><uni-icons type="cart" size="20" color="#fff" /></view>
    </view>
    <swiper class="imgs" circular @change="e => (cur = e.detail.current)">
      <swiper-item v-for="(im, i) in p.images" :key="i"><image :src="img(im)" mode="aspectFill" class="img" @click="preview(i)" /></swiper-item>
    </swiper>
    <view class="pi-wrap"><text class="pi">{{ cur + 1 }}/{{ p.images.length }}</text></view>
    <view class="pbar row sp">
      <view><text style="font-size: 24rpx">到手价 ¥</text><text class="big">{{ p.price }}</text><text class="orig">¥{{ p.originalPrice }}</text></view>
      <view class="pr">限时直降<br />包邮 · 7天无理由</view>
    </view>
    <view class="card first">
      <view class="title"><text class="tag s">{{ p.shop.includes('官方') ? '天猫' : '优选' }}</text>{{ p.name }}</view>
      <view style="margin-top: 16rpx"><text class="tag">满300减50</text><text class="tag">24期免息</text><text class="tag">7天无理由</text></view>
      <view class="t3" style="margin-top: 16rpx">月销 {{ salesText(p.sales) }} · 浙江杭州 · 快递 免运费</view>
    </view>
    <view class="card">
      <view class="row sp line" @click="open('both')"><view class="row"><text class="t3 lbl">已选</text><text>{{ chosen }}</text></view><uni-icons type="right" size="14" color="#999" /></view>
      <view class="row sp line bt"><view class="row"><text class="t3 lbl">保障</text><text>正品保证 · 极速退款 · 运费险</text></view><uni-icons type="right" size="14" color="#999" /></view>
    </view>
    <view class="card row" style="gap: 20rpx">
      <view class="shop-logo">{{ p.shop[0] }}</view>
      <view class="f1"><view style="font-weight: 700">{{ p.shop }}</view><view class="t3">宝贝描述 4.9 · 服务 4.9 · 物流 4.8</view></view>
      <view class="btn o sm">进店</view>
    </view>
    <view class="card">
      <view style="font-weight: 700; margin-bottom: 16rpx">商品详情</view>
      <view class="t2" style="line-height: 40rpx">{{ p.desc }}</view>
      <image v-for="(im, i) in p.images" :key="'d' + i" :src="img(im)" mode="widthFix" class="dimg" />
    </view>
    <view class="bottom-bar">
      <view class="ic"><uni-icons type="shop" size="22" color="#666" /><text>店铺</text></view>
      <view class="ic"><uni-icons type="chat" size="22" color="#666" /><text>客服</text></view>
      <view class="ic" @click="toCart"><view style="position: relative"><uni-icons type="cart" size="22" color="#666" /><text v-if="store.cartCount" class="badge">{{ store.cartCount }}</text></view><text>购物车</text></view>
      <view class="row f1" style="margin-left: 12rpx">
        <view class="btn y l f1 add-cart" @click="open('cart')">加入购物车</view>
        <view class="btn r f1 buy-now" @click="open('buy')">立即购买</view>
      </view>
    </view>
    <spec-popup v-model:show="show" :product="p" :mode="mode" @confirm="onConfirm" />
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
import { salesText } from '../../utils/format'
import { useShopStore } from '../../store'
import SpecPopup from '../../components/spec-popup.vue'
const store = useShopStore()
const sbh = uni.getSystemInfoSync().statusBarHeight || 0
const p = ref(null), cur = ref(0), show = ref(false), mode = ref('both'), chosen = ref('请选择 颜色 规格')
onLoad(async o => { p.value = await api.product(o.id || 1) })
const open = m => { mode.value = m; show.value = true }
const back = () => (getCurrentPages().length > 1 ? uni.navigateBack() : uni.switchTab({ url: '/pages/index/index' }))
const toCart = () => uni.switchTab({ url: '/pages/cart/cart' })
const preview = i => uni.previewImage({ urls: p.value.images.map(img), current: i })
async function onConfirm({ action, spec, qty }) {
  chosen.value = `${spec}，${qty}件`
  if (action === 'cart') {
    await store.addToCart(p.value, spec, qty)
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  } else if (action === 'buy') {
    store.setCheckout([{ productId: p.value.id, spec, qty, product: p.value }], false)
    if (store.requireLogin()) uni.navigateTo({ url: '/pages/order/confirm' })
  }
}
</script>
<style lang="scss" scoped>
.page { padding-bottom: 140rpx; }
.float { position: fixed; left: 24rpx; right: 24rpx; z-index: 20; }
.fb { width: 64rpx; height: 64rpx; border-radius: 50%; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
.imgs, .img { width: 750rpx; height: 750rpx; background: #EEE; }
.pi-wrap { position: relative; } .pi { position: absolute; right: 24rpx; bottom: 24rpx; background: rgba(0,0,0,.4); color: #fff; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }
.pbar { background: linear-gradient(90deg, #FF5000, #FF8A00); color: #fff; padding: 16rpx 24rpx; }
.big { font-size: 56rpx; font-weight: 700; font-family: Arial; } .orig { opacity: .8; font-size: 24rpx; margin-left: 12rpx; text-decoration: line-through; }
.pr { text-align: right; font-size: 22rpx; line-height: 32rpx; }
.first { margin-top: 0; border-radius: 0 0 24rpx 24rpx; }
.title { font-size: 32rpx; font-weight: 600; line-height: 44rpx; }
.line { padding: 8rpx 0; font-size: 26rpx; } .bt { border-top: 1rpx solid $line; margin-top: 16rpx; padding-top: 24rpx; } .lbl { width: 80rpx; font-size: 26rpx; }
.shop-logo { width: 80rpx; height: 80rpx; border-radius: 16rpx; background: $text-1; color: #fff; text-align: center; line-height: 80rpx; font-weight: 700; }
.dimg { width: 100%; margin-top: 16rpx; border-radius: 12rpx; display: block; }
.ic { display: flex; flex-direction: column; align-items: center; font-size: 20rpx; color: #666; width: 84rpx; }
.l { border-radius: 40rpx 0 0 40rpx; padding: 0; } .r { border-radius: 0 40rpx 40rpx 0; padding: 0; }
</style>
