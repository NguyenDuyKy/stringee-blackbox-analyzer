<script setup>
import { computed } from 'vue';
import { catMeta } from '../lib/eventMeta.js';

const props = defineProps({ result: Object });

const ov = computed(() => props.result.overview);
const sessions = computed(() => props.result.sessions);

const problem = computed(() => sessions.value.filter(s => s.diagnosis.status === 'error').length);
const warnS = computed(() => sessions.value.filter(s => s.diagnosis.status === 'warn').length);

const cards = computed(() => {
  const o = ov.value;
  return [
    { v: o.total.toLocaleString(), l: 'Tổng sự kiện' },
    { v: o.convCount, l: 'Hội thoại chat' },
    { v: o.callCount, l: 'Cuộc gọi' },
    { v: o.disconnects, l: 'Lần mất kết nối (disconnect)', cls: o.disconnects ? 'warn' : 'good' },
    { v: o.soundErrors, l: 'Lỗi âm thanh', cls: o.soundErrors ? 'alert' : 'good' },
    { v: o.ringFails, l: 'Chuông phát thất bại', cls: o.ringFails ? 'alert' : 'good' },
    { v: o.busyRejects, l: 'Gọi bị từ chối (bận)', cls: o.busyRejects ? 'alert' : 'good' },
    { v: problem.value, l: 'Phiên CÓ VẤN ĐỀ', cls: problem.value ? 'alert' : 'good' },
    { v: warnS.value, l: 'Phiên cần lưu ý', cls: warnS.value ? 'warn' : 'good' }
  ];
});

const catRows = computed(() => {
  const cats = Object.entries(ov.value.categories).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...cats.map(c => c[1]), 1);
  return cats.map(([cat, n]) => ({ cat, n, cm: catMeta(cat), pct: (n / max * 100).toFixed(1) }));
});

const dayRows = computed(() => {
  const days = Object.entries(ov.value.perDay);
  const max = Math.max(...days.map(d => d[1]), 1);
  return days.map(([day, n]) => ({ day, n, pct: (n / max * 100).toFixed(1) }));
});
</script>

<template>
  <div class="ov">
    <div class="cards">
      <div v-for="(c, i) in cards" :key="i" class="card" :class="c.cls">
        <div class="v">{{ c.v }}</div>
        <div class="l">{{ c.l }}</div>
      </div>
    </div>

    <div class="panel">
      <h3>📊 Sự kiện theo nhóm</h3>
      <div v-for="r in catRows" :key="r.cat" class="bar-row">
        <div class="name">{{ r.cm.icon }} {{ r.cm.label }} <span class="dim">({{ r.cat }})</span></div>
        <div class="track"><div class="fill" :style="{ width: r.pct + '%', background: r.cm.color }"></div></div>
        <div class="num">{{ r.n.toLocaleString() }}</div>
      </div>
    </div>

    <div class="panel">
      <h3>📅 Sự kiện theo ngày</h3>
      <div v-for="r in dayRows" :key="r.day" class="bar-row">
        <div class="name">{{ r.day }}</div>
        <div class="track"><div class="fill" :style="{ width: r.pct + '%', background: 'var(--accent)' }"></div></div>
        <div class="num">{{ r.n.toLocaleString() }}</div>
      </div>
    </div>
  </div>
</template>
