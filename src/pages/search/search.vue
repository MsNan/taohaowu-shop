<template>
  <view>
    <view class="bar row">
      <view class="box row f1"><uni-icons type="search" size="16" color="#999" /><input v-model="kw" class="ipt f1" placeholder="搜索宝贝" confirm-type="search" :focus="!searched" @confirm="e => doSearch(e.detail.value)" @input="e => { if (!e.detail.value) searched = false }" /><uni-icons v-if="kw" type="clear" size="16" color="#C8C8C8" @click="kw = ''; searched = false" /></view>
      <text class="sbtn" @click="doSearch()">搜索</text>
    </view>
    <view v-if="!searched" class="pad">
      <view v-if="store.history.length">
        <view class="row sp hd"><text class="h">搜索历史</text><uni-icons type="trash" size="18" color="#999" @click="store.clearHistory()" /></view>
        <view class="tags"><text v-for="h in store.history" :key="h" class="chip" @click="doSearch(h)">{{ h }}</text></view>
      </view>
      <view class="row sp hd"><text class="h">热门搜索</text></view>
      <view class="tags"><text v-for="(h, i) in hot" :key="h" :class="['chip', { hot: i < 3 }]" @click="doSearch(h)">{{ h }}</text></view>
    </view>
    <view v-else>
      <view class="sorts row">
        <text v-for="s in sorts" :key="s.v" :class="['so', { on: sort === s.v }]" @click="setSort(s.v)">{{ s.t }}</text>
      </view>
      <view class="feed" style="padding-top: 20rpx"><product-card v-for="p in list" :key="p.id" :p="p" /></view>
      <empty-state v-if="!list.length" icon="search" text="没找到相关宝贝，换个词试试" />
    </view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { useShopStore } from '../../store'
import ProductCard from '../../components/product-card.vue'
import EmptyState from '../../components/empty-state.vue'
const store = useShopStore()
const kw = ref(''), searched = ref(false), list = ref([]), sort = ref('')
const hot = ['耳机', '手机', '空气炸锅', 'T恤', '口红', '跑步鞋', '坚果', '扫地机器人']
const sorts = [{ t: '综合', v: '' }, { t: '销量', v: 'sales' }, { t: '价格↑', v: 'price_asc' }, { t: '价格↓', v: 'price_desc' }]
async function doSearch(w) {
  if (w !== undefined) kw.value = w
  store.addHistory(kw.value)
  list.value = await api.products({ q: kw.value.trim(), sort: sort.value }); searched.value = true
}
const setSort = v => { sort.value = v; doSearch() }
onLoad(o => { if (o.q) doSearch(decodeURIComponent(o.q)) })
</script>
<style lang="scss" scoped>
.bar { background: #fff; padding: 16rpx 24rpx; gap: 20rpx; }
.box { height: 72rpx; border-radius: 36rpx; background: $bg; padding: 0 24rpx; gap: 12rpx; border: 2rpx solid $brand; }
.ipt { font-size: 28rpx; } .sbtn { color: $brand; font-weight: 600; }
.pad { padding: 0 24rpx; } .hd { margin: 36rpx 0 20rpx; } .h { font-weight: 700; }
.tags { display: flex; flex-wrap: wrap; gap: 20rpx; }
.chip { background: #fff; padding: 10rpx 28rpx; border-radius: 30rpx; font-size: 26rpx; color: $text-2; }
.chip.hot { color: $brand; background: $brand-light; }
.sorts { background: #fff; justify-content: space-around; height: 84rpx; }
.so { color: $text-2; font-size: 26rpx; } .so.on { color: $brand; font-weight: 700; }
</style>
