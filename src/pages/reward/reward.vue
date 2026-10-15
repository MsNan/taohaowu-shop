<template>
  <view class="wrap">
    <view class="card head">
      <view class="t">☕ 打赏支持</view>
      <view class="s">{{ cfg.tip || '打赏全凭自愿，感谢支持！' }}</view>
    </view>
    <view class="card">
      <view class="tabs">
        <view v-for="c in chs" :key="c" :class="['tab', ch === c && 'on']" @click="ch = c">{{ c }}</view>
      </view>
      <image v-if="cfg.wechat" class="qr" :src="img(ch === '微信' ? cfg.wechat : cfg.alipay)" mode="widthFix" show-menu-by-longpress />
      <view class="hint">长按/截图后用{{ ch }}扫一扫</view>
    </view>
    <view class="card">
      <view class="lab">打赏后可以留个言（选填，便于作者核对）</view>
      <view class="amts"><view v-for="a in amts" :key="a" :class="['amt', amount == a && 'on']" @click="amount = a">¥{{ a }}</view></view>
      <input class="ipt" v-model="amount" type="digit" placeholder="其他金额" />
      <input class="ipt" v-model="nickname" placeholder="昵称（选填）" maxlength="20" />
      <textarea class="ipt ta" v-model="message" placeholder="想对作者说的话（选填）" maxlength="200" />
      <view class="btn" @click="submit">我已打赏，提交记录</view>
      <view v-if="edition" class="ed">当前版本：{{ edition.edition === 'pro' ? '付费版' : '免费版' }}</view>
    </view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { img } from '../../config'
const cfg = ref({}), edition = ref(null), chs = ['微信', '支付宝'], ch = ref('微信')
const amts = [2, 6.66, 9.9, 18.8, 66], amount = ref(6.66), nickname = ref(''), message = ref('')
onLoad(async () => { cfg.value = await api.rewardConfig(); edition.value = await api.edition().catch(() => null) })
async function submit() {
  await api.rewardSubmit({ channel: ch.value, amount: Number(amount.value), nickname: nickname.value || '匿名', message: message.value })
  uni.showToast({ title: '感谢支持！', icon: 'success' }); message.value = ''
}
</script>
<style lang="scss" scoped>
.wrap { padding: 24rpx; }
.card { background: #fff; border-radius: 20rpx; padding: 32rpx; margin-bottom: 24rpx; }
.head { background: linear-gradient(135deg, #FF8A00, #FF5000); color: #fff; } .t { font-size: 40rpx; font-weight: 700; } .s { opacity: .9; margin-top: 8rpx; font-size: 26rpx; }
.tabs { display: flex; gap: 20rpx; margin-bottom: 24rpx; } .tab { flex: 1; text-align: center; padding: 16rpx; border-radius: 40rpx; background: #f5f5f5; } .tab.on { background: #FF5000; color: #fff; }
.qr { width: 460rpx; display: block; margin: 0 auto; border-radius: 12rpx; } .hint { text-align: center; color: #999; font-size: 24rpx; margin-top: 12rpx; }
.lab { color: #666; font-size: 26rpx; margin-bottom: 16rpx; } .amts { display: flex; flex-wrap: wrap; gap: 16rpx; margin-bottom: 16rpx; }
.amt { padding: 12rpx 28rpx; border: 2rpx solid #eee; border-radius: 12rpx; } .amt.on { border-color: #FF5000; color: #FF5000; }
.ipt { border: 2rpx solid #eee; border-radius: 12rpx; padding: 16rpx; margin-bottom: 16rpx; height: 44rpx; } .ta { height: 120rpx; width: auto; }
.btn { background: #FF5000; color: #fff; text-align: center; padding: 24rpx; border-radius: 48rpx; font-weight: 700; }
.ed { text-align: center; color: #bbb; font-size: 22rpx; margin-top: 16rpx; }
</style>
