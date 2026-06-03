<script setup>
import { ref } from 'vue';

defineProps({ asButton: { type: Boolean, default: false } });
const emit = defineEmits(['loaded']);

const dragging = ref(false);
const error = ref('');
const fileInput = ref(null);

function pick() { fileInput.value.click(); }

async function handleFile(file) {
  if (!file) return;
  error.value = '';
  try {
    const text = await file.text();
    let raw = JSON.parse(text);
    if (!Array.isArray(raw)) {
      if (raw && Array.isArray(raw.logs)) raw = raw.logs;
      else throw new Error('File JSON phải là một mảng các sự kiện.');
    }
    emit('loaded', { name: file.name, content: raw });
  } catch (e) {
    error.value = '⚠️ ' + (e.message.includes('JSON') ? 'File không phải JSON hợp lệ: ' + e.message : e.message);
  }
}

function onInput(e) { handleFile(e.target.files[0]); e.target.value = ''; }
function onDrop(e) { dragging.value = false; handleFile(e.dataTransfer.files[0]); }
</script>

<template>
  <input ref="fileInput" type="file" accept=".json,application/json" style="display:none" @change="onInput" />

  <button v-if="asButton" class="btn-ghost" @click="pick">Mở file…</button>

  <div v-else class="dropzone" :class="{ drag: dragging }"
       @dragenter.prevent="dragging = true" @dragover.prevent="dragging = true"
       @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
    <div class="dz-inner">
      <div class="dz-icon">📂</div>
      <h1>Stringee BlackBox Analyzer</h1>
      <p>Phân tích log chat / cuộc gọi của agent</p>
      <button class="btn-primary" @click="pick">Chọn file log JSON…</button>
      <p class="dz-hint">hoặc kéo–thả file <code>stringee_blackbox_*.json</code> vào đây</p>
      <p class="dz-error">{{ error }}</p>
    </div>
  </div>
</template>
