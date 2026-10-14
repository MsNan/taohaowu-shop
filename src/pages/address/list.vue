<template>
  <view class="page">
    <view v-for="a in list" :key="a.id" class="card addr" @click="choose(a)">
      <view class="row"><text class="nm">{{ a.name }}</text><text class="t2" style="margin-left: 16rpx; font-size: 28rpx">{{ a.phone }}</text><text v-if="a.isDefault" class="tag s" style="margin-left: 12rpx">默认</text></view>
      <view class="t2 dt">{{ a.region }} {{ a.detail }}</view>
      <view class="row sp ops">
        <view class="row" @click.stop="setDefault(a)"><view :class="['ck', { on: a.isDefault }]" style="width: 32rpx; height: 32rpx"><uni-icons v-if="a.isDefault" type="checkmarkempty" size="10" color="#fff" /></view><text class="t2" style="margin-left: 10rpx">默认地址</text></view>
        <view class="row" style="gap: 32rpx"><text class="t2" @click.stop="edit(a.id)">编辑</text><text class="t2" @click.stop="del(a)">删除</text></view>
      </view>
    </view>
    <empty-state v-if="loaded && !list.length" icon="location" text="还没有收货地址" />
    <view style="height: 160rpx"></view>
    <view class="bottom-bar"><view class="btn lg f1 add-addr" @click="edit()">＋ 新增收货地址</view></view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { api } from '../../api/request'
import { useShopStore } from '../../store'
import EmptyState from '../../components/empty-state.vue'
const store = useShopStore()
const list = ref([]), loaded = ref(false), select = ref(false)
onLoad(o => (select.value = !!o.select))
onShow(async () => { list.value = await api.addresses(); loaded.value = true })
const edit = id => uni.navigateTo({ url: '/pages/address/edit' + (id ? '?id=' + id : '') })
const choose = a => { if (select.value) { store.addressId = a.id; uni.navigateBack() } }
const setDefault = async a => { await api.addressSave({ ...a, isDefault: true }); list.value = await api.addresses() }
const del = a => uni.showModal({ title: '提示', content: '确定删除该地址？', confirmColor: '#FF5000', success: async r => { if (r.confirm) { await api.addressRemove(a.id); list.value = await api.addresses() } } })
</script>
<style lang="scss" scoped>
.nm { font-size: 32rpx; font-weight: 700; } .dt { margin-top: 12rpx; line-height: 36rpx; font-size: 26rpx; }
.ops { border-top: 1rpx solid $line; margin-top: 20rpx; padding-top: 20rpx; }
</style>
