<script setup>
import { ref, computed, inject, watch } from 'vue';
import { metaFor, catMeta } from '../lib/eventMeta.js';
import { fmtTime, SEV_ICON } from '../lib/format.js';
import Pagination from './Pagination.vue';

const props = defineProps({ events: Array, overview: Object });
const openModal = inject('openModal');

const text = ref('');
const category = ref('');
const severity = ref('');
const fromTime = ref('');
const toTime = ref('');
const page = ref(1);
const pageSize = ref(50);
const listEl = ref(null);

const categories = computed(() => Object.keys(props.overview.categories).sort());

// ms -> "YYYY-MM-DDTHH:mm:ss" (giờ địa phương) cho input datetime-local
function toLocalInput(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// đặt sẵn khoảng = toàn bộ log để người dùng thấy biên và tự thu hẹp
fromTime.value = toLocalInput(props.overview.minTs);
toTime.value = toLocalInput(props.overview.maxTs);

const fromMs = computed(() => fromTime.value ? new Date(fromTime.value).getTime() : null);
const toMs = computed(() => toTime.value ? new Date(toTime.value).getTime() : null);

function resetTime() {
  fromTime.value = toLocalInput(props.overview.minTs);
  toTime.value = toLocalInput(props.overview.maxTs);
}

const filtered = computed(() => {
  const q = text.value.toLowerCase();
  const lo = fromMs.value, hi = toMs.value;
  return props.events.filter(e => {
    if (lo != null && e.timestamp != null && e.timestamp < lo) return false;
    if (hi != null && e.timestamp != null && e.timestamp > hi) return false;
    if (category.value && e.category !== category.value) return false;
    if (severity.value && metaFor(e).severity !== severity.value) return false;
    if (q) {
      const hay = (e.category + ' ' + e.event + ' ' + JSON.stringify(e.data)).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
});

const visible = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value).map(e => ({
    e, m: metaFor(e), cm: catMeta(e.category), exId: e.convId || e.callId || ''
  }));
});

watch([text, category, severity, fromTime, toTime], () => { page.value = 1; });
watch(filtered, () => {
  const max = Math.max(1, Math.ceil(filtered.value.length / pageSize.value));
  if (page.value > max) page.value = max;
});
// đổi trang -> cuộn danh sách lên đầu
watch([page, pageSize], () => { if (listEl.value) listEl.value.scrollTop = 0; });
</script>

<template>
  <div class="all">
    <div class="all-filters">
      <input v-model="text" class="input search-sm" type="text" placeholder="Tìm convId / callId / số / lỗi…" />
      <select v-model="category" class="input">
        <option value="">Mọi nhóm</option>
        <option v-for="c in categories" :key="c" :value="c">{{ catMeta(c).label }} ({{ c }})</option>
      </select>
      <select v-model="severity" class="input">
        <option value="">Mọi mức độ</option>
        <option value="error">⛔ Lỗi</option>
        <option value="warn">⚠️ Cần lưu ý</option>
        <option value="ok">✅ OK</option>
        <option value="info">ℹ️ Thông tin</option>
      </select>
      <div class="time-filter">
        <span class="tf-label">🕒 Từ</span>
        <input v-model="fromTime" class="input dt" type="datetime-local" step="1" :min="toLocalInput(overview.minTs)" :max="toLocalInput(overview.maxTs)" />
        <span class="tf-label">đến</span>
        <input v-model="toTime" class="input dt" type="datetime-local" step="1" :min="toLocalInput(overview.minTs)" :max="toLocalInput(overview.maxTs)" />
        <button class="btn-ghost" title="Khôi phục toàn bộ khoảng thời gian" @click="resetTime">↺</button>
      </div>
      <span class="all-count">{{ filtered.length.toLocaleString() }} sự kiện</span>
    </div>

    <div class="all-list" ref="listEl">
      <div v-for="r in visible" :key="r.e._i" :class="['all-row', 'sev-' + r.m.severity]" @click="openModal(r.e)">
        <span class="t">{{ fmtTime(r.e.timestamp) }}</span>
        <span class="c">{{ r.cm.icon }} {{ r.e.category }}</span>
        <span class="e">
          {{ SEV_ICON[r.m.severity] }} {{ r.m.label }}
          <small>{{ r.e.event }}<template v-if="r.exId"> · {{ r.exId }}</template></small>
        </span>
      </div>
      <div v-if="!filtered.length" class="empty-hint">Không có sự kiện phù hợp</div>
    </div>

    <Pagination v-if="filtered.length"
      :total="filtered.length" v-model:page="page" v-model:page-size="pageSize" />
  </div>
</template>
