<template>
  <view v-if="show" class="mask" @click="close" @touchmove.stop.prevent>
    <view class="sheet" @click.stop>
      <view class="top">
        <image :src="img(product.images[0])" class="thumb" mode="aspectFill" />
        <view class="f1">
          <view class="price"><text class="y">¥</text><text style="font-size: 44rpx">{{ product.price }}</text></view>
          <view class="t3" style="margin-top: 8rpx">库存 {{ stock }} 件 · 已选：{{ picked.join(' / ') }}</view>
        </view>
        <view class="close" @click="close"><uni-icons type="closeempty" size="22" color="#999" /></view>
      </view>
      <scroll-view scroll-y class="body">
        <view v-for="(s, si) in product.specs" :key="s.name">
          <view class="sub">{{ s.name }}</view>
          <view class="opts">
            <view v-for="o in s.options" :key="o" :class="['opt', { on: picked[si] === o }]" @click="pick(si, o)">{{ o }}</view>
          </view>
        </view>
        <view class="row sp" style="margin: 40rpx 0 20rpx">
          <text class="sub" style="margin: 0">购买数量</text>
          <view class="step"><view :class="['b', { dis: qty <= 1 }]" @click="qty > 1 && qty--">－</view><view class="n">{{ qty }}</view><view class="b" @click="qty++">＋</view></view>
        </view>
      </scroll-view>
      <view class="acts">
        <template v-if="mode === 'both'">
          <view class="btn y l" @click="emit('cart')">加入购物车</view><view class="btn r" @click="emit('buy')">立即购买</view>
        </template>
        <view v-else class="btn f1 spec-ok" @click="emit(mode)">确定</view>
      </view>
    </view>
  </view>
</template>
<script setup>
import { ref, watch } from 'vue'
import { img } from '../config'
const props = defineProps({ show: Boolean, product: Object, mode: { type: String, default: 'both' } })
const ev = defineEmits(['update:show', 'confirm'])
const picked = ref([]), qty = ref(1), stock = 865
watch(() => props.product, p => { if (p) picked.value = p.specs.map(s => s.options[0]) }, { immediate: true })
const pick = (i, o) => { picked.value[i] = o }
const close = () => ev('update:show', false)
const emit = action => { ev('confirm', { action, spec: picked.value.join(' / '), qty: qty.value }); close() }
</script>
<style lang="scss" scoped>
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 999; display: flex; align-items: flex-end; }
.sheet { background: #fff; width: 100%; border-radius: 32rpx 32rpx 0 0; padding: 32rpx 32rpx calc(24rpx + env(safe-area-inset-bottom)); box-sizing: border-box; }
.top { display: flex; align-items: flex-end; gap: 24rpx; position: relative; }
.thumb { width: 192rpx; height: 192rpx; border-radius: 20rpx; margin-top: -72rpx; border: 6rpx solid #fff; background: #EEE; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.08); }
.close { position: absolute; right: 0; top: 0; }
.body { max-height: 640rpx; }
.sub { font-weight: 600; margin: 36rpx 0 20rpx; }
.opts { display: flex; flex-wrap: wrap; gap: 20rpx; }
.opt { padding: 14rpx 32rpx; border-radius: 16rpx; font-size: 26rpx; background: $bg; border: 2rpx solid $bg; }
.opt.on { background: $brand-light; color: $brand; border-color: $brand; }
.acts { display: flex; margin-top: 24rpx; } .l { flex: 1; border-radius: 40rpx 0 0 40rpx; } .r { flex: 1; border-radius: 0 40rpx 40rpx 0; }
</style>
