<script setup>
import { computed, inject, ref } from 'vue';
import { metaFor, catMeta, SOUND_CHECK_REASON, SIGNALING_DESC } from '../lib/eventMeta.js';
import { fmtTime, fmtDateTime, SEV_ICON } from '../lib/format.js';

const props = defineProps({ session: Object });
const openModal = inject('openModal');
const copied = ref(false);

const who = computed(() => {
  const s = props.session;
  return s.type === 'chat' ? (s.customerName || '(không tên)') : (s.fromAlias || s.fromNumber || '(số ẩn)');
});

const meta = computed(() => {
  const s = props.session;
  return [
    ['Loại', s.type === 'chat' ? '💬 Hội thoại chat' : '📞 Cuộc gọi'],
    [s.type === 'chat' ? 'convId' : 'callId', s.id],
    ['Agent (accountId)', s.accountId || '—'],
    [s.type === 'chat' ? 'Khách' : 'Số gọi', who.value],
    ['Bắt đầu', fmtDateTime(s.startTs)],
    ['Số sự kiện', s.events.length]
  ];
});

const eventStats = computed(() => {
  const map = new Map();
  for (const e of props.session.events) {
    const key = e.category + '/' + e.event;
    if (!map.has(key)) {
      const m = metaFor(e);
      map.set(key, { key, category: e.category, event: e.event, label: m.label, severity: m.severity, count: 0 });
    }
    map.get(key).count++;
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
});

const timeline = computed(() => {
  let prevTs = null;
  return props.session.events.map(e => {
    const m = metaFor(e);
    const cm = catMeta(e.category);
    let gap = '';
    if (prevTs != null && e.timestamp != null) {
      const g = (e.timestamp - prevTs) / 1000;
      if (g >= 1) gap = `+${g.toFixed(1)}s`;
    }
    prevTs = e.timestamp;
    return { e, m, cm, gap, extra: extraFields(e) };
  });
});

function extraFields(e) {
  const d = e.data || {};
  const parts = [];
  const add = (k, v) => { if (v !== undefined && v !== null && v !== '') parts.push({ k, v: String(v) }); };
  if (e.event === 'sound_check') {
    const r = SOUND_CHECK_REASON[d.reason];
    add('reason', d.reason + (r ? ' — ' + r.label : ''));
  }
  if (e.event === 'signalingstate_change') {
    const s = SIGNALING_DESC[d.description];
    add('trạng thái', (d.description || '') + (s ? ' (' + s.label + ')' : ''));
  }
  if (e.event === 'chatRequestData_changed') add('newLength', d.newLength);
  if (e.event === 'authen_result') add('success', String(d.success));
  if (d.errorMessage) add('lỗi', d.errorMessage);
  if (d.errorName) add('errorName', d.errorName);
  if (e.category === 'CALL_INCOMING' || e.category === 'CALL_RINGING') {
    add('từ', d.fromAlias || d.fromNumber); add('đến', d.toAlias || d.toNumber);
  }
  if (e.event === 'transferChatRequest') add('chuyển từ', d.from);
  return parts;
}

function copyReport() {
  const s = props.session;
  const d = s.diagnosis;
  const last = s.events[s.events.length - 1];
  const m = last ? metaFor(last) : null;
  const txt =
`- Agent (accountId): ${s.accountId || '...'}
- Thời điểm: ${fmtDateTime(s.startTs)}
- Loại: ${s.type === 'chat' ? 'Chat đến' : 'Cuộc gọi đến'}
- ${s.type === 'chat' ? 'convId' : 'callId'}: ${s.id}
- Kết luận tự động: ${d.label}
- Ghi chú: ${d.notes.map(n => n.text).join(' | ')}
- Mắt xích cuối thấy trong log: ${m ? m.label + ' (' + last.event + ')' : '—'}`;
  navigator.clipboard.writeText(txt).then(() => {
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  });
}
</script>

<template>
  <div :class="['diag', session.diagnosis.status]">
    <h2>{{ SEV_ICON[session.diagnosis.status] }} {{ session.diagnosis.label }}</h2>
    <div class="sub">Kết luận tự động dựa trên luồng kỳ vọng (theo tài liệu Support)</div>
    <ul>
      <li v-for="(n, i) in session.diagnosis.notes" :key="i">
        <span class="ic">{{ SEV_ICON[n.sev] }}</span><span>{{ n.text }}</span>
      </li>
    </ul>
  </div>

  <div class="sess-meta">
    <div v-for="(m, i) in meta" :key="i"><span>{{ m[0] }}:</span> {{ m[1] }}</div>
  </div>

  <div class="ev-stats">
    <h3>📊 Thống kê sự kiện trong phiên ({{ eventStats.length }} loại · {{ session.events.length }} sự kiện)</h3>
    <div class="es-grid">
      <div v-for="s in eventStats" :key="s.key" :class="['es-row', 'sev-' + s.severity]">
        <span class="es-ic">{{ SEV_ICON[s.severity] }}</span>
        <span class="es-label">{{ s.label }}</span>
        <span class="es-code">{{ s.category }} / {{ s.event }}</span>
        <span :class="['es-count', 'badge-' + s.severity]">×{{ s.count }}</span>
      </div>
    </div>
  </div>

  <button class="btn-ghost btn-report" @click="copyReport">
    {{ copied ? '✓ Đã copy!' : '📋 Copy mẫu báo cáo gửi Dev' }}
  </button>

  <h3 style="margin-bottom:12px">🕒 Timeline ({{ session.events.length }} sự kiện)</h3>
  <div class="tl">
    <div v-for="(t, i) in timeline" :key="i" class="tl-item">
      <div class="tl-node" :style="{ borderColor: t.cm.color }">{{ t.cm.icon }}</div>
      <div :class="['tl-card', 'sev-' + t.m.severity]" @click="openModal(t.e)">
        <div class="tl-head">
          <span class="tl-time">{{ fmtTime(t.e.timestamp) }}</span>
          <span class="tl-label">{{ t.m.label }}</span>
          <span class="tl-cat">{{ t.e.category }} / {{ t.e.event }}</span>
          <span v-if="t.gap" class="tl-gap">{{ t.gap }}</span>
        </div>
        <div class="tl-desc">{{ t.m.desc }}</div>
        <div v-if="t.extra.length" class="tl-extra">
          <span v-for="(kv, j) in t.extra" :key="j" class="kv"><b>{{ kv.k }}</b> {{ kv.v }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
