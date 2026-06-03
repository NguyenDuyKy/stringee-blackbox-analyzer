<script setup>
import { ref, shallowRef, provide, computed } from 'vue';
import { analyze } from './lib/analyzer.js';
import { fmtDateTime } from './lib/format.js';
import Dropzone from './components/Dropzone.vue';
import OverviewView from './components/OverviewView.vue';
import SessionsView from './components/SessionsView.vue';
import AllEventsView from './components/AllEventsView.vue';
import EventModal from './components/EventModal.vue';

const result = shallowRef(null);   // { events, overview, sessions }
const fileName = ref('');
const tab = ref('overview');
const modalEvent = ref(null);

provide('openModal', (e) => { modalEvent.value = e; });

function loadFile({ name, content }) {
  result.value = analyze(content);
  fileName.value = name;
  tab.value = 'overview';
}

const timeSpan = computed(() => {
  if (!result.value) return '';
  const o = result.value.overview;
  return `${fmtDateTime(o.minTs)} → ${fmtDateTime(o.maxTs)}`;
});

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'sessions', label: 'Phiên (chat/cuộc gọi)' },
  { key: 'all', label: 'Toàn bộ sự kiện' }
];
</script>

<template>
  <Dropzone v-if="!result" @loaded="loadFile" />

  <div v-else class="app">
    <header class="topbar">
      <div class="brand">📦 BlackBox <span>Analyzer</span></div>
      <div class="file-chip">📄 {{ fileName }}</div>
      <div class="file-chip time-chip">🕒 {{ timeSpan }}</div>
      <div class="top-stats">
        <span class="ts"><b>{{ result.overview.total.toLocaleString() }}</b> sự kiện</span>
        <span class="ts"><b>{{ result.overview.convCount }}</b> chat</span>
        <span class="ts"><b>{{ result.overview.callCount }}</b> cuộc gọi</span>
        <span class="ts">Agent: <b>{{ result.overview.accounts.join(', ') || '—' }}</b></span>
      </div>
      <div class="top-actions">
        <Dropzone as-button @loaded="loadFile" />
      </div>
    </header>

    <nav class="tabs">
      <button v-for="t in TABS" :key="t.key" class="tab" :class="{ active: tab === t.key }" @click="tab = t.key">
        {{ t.label }}
      </button>
    </nav>

    <main class="main">
      <div class="view" v-show="tab === 'overview'">
        <OverviewView :result="result" />
      </div>
      <div class="view" v-show="tab === 'sessions'">
        <SessionsView :sessions="result.sessions" />
      </div>
      <div class="view" v-show="tab === 'all'">
        <AllEventsView :events="result.events" :overview="result.overview" />
      </div>
    </main>
  </div>

  <EventModal :event="modalEvent" @close="modalEvent = null" />
</template>
