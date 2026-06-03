<script setup>
import { ref, computed, watch } from 'vue';
import { fmtDateTime } from '../lib/format.js';
import SessionDetail from './SessionDetail.vue';
import Pagination from './Pagination.vue';

const props = defineProps({ sessions: Array });

const typeFilter = ref('all');
const text = ref('');
const problemOnly = ref(false);
const selected = ref(null);
const page = ref(1);
const pageSize = ref(20);

const TYPES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'chat', label: '💬 Chat' },
  { key: 'call', label: '📞 Gọi' }
];

const filtered = computed(() => {
  const q = text.value.toLowerCase();
  return props.sessions.filter(s => {
    if (typeFilter.value !== 'all' && s.type !== typeFilter.value) return false;
    if (problemOnly.value && !(s.diagnosis.status === 'error' || s.diagnosis.status === 'warn')) return false;
    if (q) {
      const hay = [s.id, s.customerName, s.fromNumber, s.fromAlias, s.toAlias, s.accountId].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
});

const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

// reset về trang 1 khi đổi bộ lọc, hoặc khi số trang co lại nhỏ hơn trang hiện tại
watch([typeFilter, text, problemOnly], () => { page.value = 1; });
watch(filtered, () => {
  const max = Math.max(1, Math.ceil(filtered.value.length / pageSize.value));
  if (page.value > max) page.value = max;
});

function who(s) {
  return s.type === 'chat' ? (s.customerName || '(không tên)') : (s.fromAlias || s.fromNumber || '(số ẩn)');
}
</script>

<template>
  <div class="sessions">
    <aside class="sidebar">
      <div class="sb-filters">
        <input v-model="text" class="input" type="text" placeholder="Tìm convId / callId / khách / số…" />
        <div class="seg">
          <button v-for="t in TYPES" :key="t.key" class="seg-btn"
                  :class="{ active: typeFilter === t.key }" @click="typeFilter = t.key">{{ t.label }}</button>
        </div>
        <label class="chk"><input type="checkbox" v-model="problemOnly" /> Chỉ phiên có vấn đề</label>
      </div>

      <div class="session-list">
        <div v-if="!filtered.length" class="empty-hint" style="margin-top:30px">Không có phiên phù hợp</div>
        <div v-for="s in paged" :key="s.type + s.id" class="sess-item"
             :class="{ active: selected && selected.type === s.type && selected.id === s.id }"
             @click="selected = s">
          <div class="sess-dot" :class="'dot-' + s.diagnosis.status"></div>
          <div class="sess-main">
            <div class="sess-title">{{ s.type === 'chat' ? '💬' : '📞' }} {{ who(s) }}</div>
            <div class="sess-sub">{{ fmtDateTime(s.startTs) }} · {{ s.events.length }} sự kiện</div>
            <div class="sess-sub" :title="s.id">{{ s.id }}</div>
            <span class="sess-badge" :class="'badge-' + s.diagnosis.status">{{ s.diagnosis.label }}</span>
          </div>
        </div>
      </div>

      <Pagination v-if="filtered.length" compact
        :total="filtered.length" v-model:page="page" v-model:page-size="pageSize" />
    </aside>

    <div class="detail">
      <SessionDetail v-if="selected" :session="selected" :key="selected.type + selected.id" />
      <div v-else class="empty-hint">← Chọn một phiên để xem timeline & chẩn đoán</div>
    </div>
  </div>
</template>
