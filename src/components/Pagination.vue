<script setup>
import { computed } from 'vue';

const props = defineProps({
  total: { type: Number, required: true },
  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  compact: { type: Boolean, default: false }
});
const emit = defineEmits(['update:page', 'update:pageSize']);

const SIZES = [20, 50, 100];

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));
const from = computed(() => props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1);
const to = computed(() => Math.min(props.page * props.pageSize, props.total));

function go(p) {
  const np = Math.min(Math.max(1, p), pageCount.value);
  if (np !== props.page) emit('update:page', np);
}
function changeSize(e) {
  emit('update:pageSize', Number(e.target.value));
  emit('update:page', 1);
}
</script>

<template>
  <div class="pager" :class="{ compact }">
    <div class="pager-size">
      <span v-if="!compact">Hiển thị</span>
      <select class="input" :value="pageSize" @change="changeSize">
        <option v-for="s in SIZES" :key="s" :value="s">{{ s }}</option>
      </select>
      <span v-if="!compact">bản ghi / trang</span>
    </div>

    <div class="pager-info">{{ from.toLocaleString() }}–{{ to.toLocaleString() }} / {{ total.toLocaleString() }}</div>

    <div class="pager-nav">
      <button class="pg-btn" :disabled="page <= 1" @click="go(1)" title="Trang đầu">«</button>
      <button class="pg-btn" :disabled="page <= 1" @click="go(page - 1)" title="Trang trước">‹</button>
      <span class="pg-cur">{{ page }} / {{ pageCount }}</span>
      <button class="pg-btn" :disabled="page >= pageCount" @click="go(page + 1)" title="Trang sau">›</button>
      <button class="pg-btn" :disabled="page >= pageCount" @click="go(pageCount)" title="Trang cuối">»</button>
    </div>
  </div>
</template>
