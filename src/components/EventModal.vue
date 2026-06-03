<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { fmtTime, fmtDateTime } from '../lib/format.js';

const props = defineProps({ event: Object });
const emit = defineEmits(['close']);

const title = computed(() => props.event
  ? `${props.event.category} / ${props.event.event} — ${fmtTime(props.event.timestamp)}` : '');

const body = computed(() => {
  const e = props.event;
  if (!e) return '';
  return JSON.stringify({
    id: e.id, timestamp: e.timestamp, datetime: fmtDateTime(e.timestamp),
    category: e.category, event: e.event, data: e.data
  }, null, 2);
});

function onKey(ev) { if (ev.key === 'Escape') emit('close'); }
onMounted(() => document.addEventListener('keydown', onKey));
onUnmounted(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <div v-if="event" class="modal" @click.self="emit('close')">
    <div class="modal-box">
      <div class="modal-head">
        <span>{{ title }}</span>
        <button class="btn-ghost" @click="emit('close')">✕</button>
      </div>
      <pre class="modal-body">{{ body }}</pre>
    </div>
  </div>
</template>
