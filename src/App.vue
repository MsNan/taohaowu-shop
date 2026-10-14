<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useShopStore } from './store'
onLaunch(() => { useShopStore().loadCart() })
</script>
<style lang="scss">
page { background: $bg; color: $text-1; font-size: 28rpx; font-family: "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif; }
.price { color: $brand; font-weight: 700; font-family: "DIN Alternate", Arial, sans-serif; }
.price .y { font-size: 22rpx; margin-right: 2rpx; }
.t2 { color: $text-2; font-size: 24rpx; } .t3 { color: $text-3; font-size: 22rpx; }
.row { display: flex; align-items: center; } .sp { justify-content: space-between; } .f1 { flex: 1; min-width: 0; }
.card { background: #fff; border-radius: 24rpx; margin: 20rpx 24rpx; padding: 24rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.04); }
.btn { display: flex; align-items: center; justify-content: center; height: 80rpx; padding: 0 32rpx; border-radius: 40rpx; background: $grad; color: #fff; font-size: 30rpx; font-weight: 600; box-sizing: border-box; }
.btn.y { background: $grad-y; } .btn.o { background: #fff; color: $brand; border: 2rpx solid $brand; } .btn.g { background: #fff; color: #333; border: 2rpx solid #DDD; font-weight: 400; }
.btn.sm { height: 60rpx; font-size: 24rpx; padding: 0 28rpx; } .btn.lg { height: 96rpx; border-radius: 48rpx; font-size: 32rpx; }
.btn.disabled { opacity: .5; }
.tag { display: inline-block; font-size: 20rpx; line-height: 28rpx; padding: 0 8rpx; border-radius: 6rpx; border: 1rpx solid $brand; color: $brand; margin-right: 8rpx; vertical-align: 2rpx; }
.tag.s { background: $brand; color: #fff; }
.badge { position: absolute; top: -8rpx; right: -16rpx; background: $danger; color: #fff; font-size: 20rpx; min-width: 32rpx; height: 32rpx; line-height: 32rpx; border-radius: 16rpx; padding: 0 8rpx; text-align: center; box-sizing: border-box; }
.ck { width: 40rpx; height: 40rpx; border-radius: 50%; border: 3rpx solid #CCC; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-sizing: border-box; }
.ck.on { background: $brand; border-color: $brand; }
.step { display: flex; border: 1rpx solid #E5E5E5; border-radius: 12rpx; overflow: hidden; font-size: 26rpx; }
.step .b { width: 52rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; }
.step .b.dis { color: $text-4; } .step .n { width: 68rpx; height: 48rpx; line-height: 48rpx; text-align: center; border-left: 1rpx solid #E5E5E5; border-right: 1rpx solid #E5E5E5; }
.bottom-bar { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); display: flex; align-items: center; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,.05); z-index: 50; }
.feed { display: flex; flex-wrap: wrap; justify-content: space-between; padding: 0 24rpx; }
.sec-title { text-align: center; font-weight: 700; margin: 32rpx 0 20rpx; font-size: 30rpx; }
.input-line { height: 104rpx; border-bottom: 1rpx solid #E5E5E5; display: flex; align-items: center; font-size: 30rpx; }
</style>
