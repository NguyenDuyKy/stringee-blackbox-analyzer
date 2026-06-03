// Phân tích danh sách sự kiện -> tổng quan, các phiên (chat/call), chẩn đoán.
import { SOUND_CHECK_REASON, SIGNALING_DESC, SEVERITY_RANK, metaFor } from './eventMeta.js';

function getConvId(e) {
  const d = e.data || {};
  if (d.convId) return d.convId;
  if (Array.isArray(d.convIds) && d.convIds.length) return d.convIds[0];
  return null;
}
function getCallId(e) {
  return (e.data && e.data.callId) || null;
}

// Chuẩn hoá: thêm trường dùng nội bộ, đảm bảo có datetime đọc được.
function normalize(rawArray) {
  const events = [];
  for (let i = 0; i < rawArray.length; i++) {
    const e = rawArray[i];
    if (!e || typeof e !== 'object') continue;
    const ts = typeof e.timestamp === 'number' ? e.timestamp : null;
    events.push({
      _i: i,
      id: e.id,
      timestamp: ts,
      category: e.category || '(unknown)',
      event: e.event || '(unknown)',
      data: e.data || {},
      convId: getConvId(e),
      callId: getCallId(e)
    });
  }
  events.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0) || (a.id || 0) - (b.id || 0));
  return events;
}

function buildOverview(events) {
  const cats = {};
  const evs = {};
  const accounts = new Set();
  const convIds = new Set();
  const callIds = new Set();
  let disconnects = 0, soundErrors = 0, ringFails = 0, busyRejects = 0;
  let minTs = Infinity, maxTs = -Infinity;
  const perDay = {};

  for (const e of events) {
    cats[e.category] = (cats[e.category] || 0) + 1;
    const k = e.category + '/' + e.event;
    evs[k] = (evs[k] || 0) + 1;
    if (e.data.accountId) accounts.add(e.data.accountId);
    if (e.convId) convIds.add(e.convId);
    if (e.callId) callIds.add(e.callId);
    if (e.event === 'disconnect') disconnects++;
    if (e.category === 'SOUND_ERROR') soundErrors++;
    if (e.event === 'playNotification_false') ringFails++;
    if (e.event === 'incomingCall_rejected_busy') busyRejects++;
    if (e.timestamp) {
      if (e.timestamp < minTs) minTs = e.timestamp;
      if (e.timestamp > maxTs) maxTs = e.timestamp;
      const day = new Date(e.timestamp).toLocaleDateString('vi-VN');
      perDay[day] = (perDay[day] || 0) + 1;
    }
  }
  return {
    total: events.length,
    categories: cats,
    events: evs,
    accounts: [...accounts],
    convCount: convIds.size,
    callCount: callIds.size,
    disconnects, soundErrors, ringFails, busyRejects,
    minTs: minTs === Infinity ? null : minTs,
    maxTs: maxTs === -Infinity ? null : maxTs,
    perDay
  };
}

// Gom các phiên chat (theo convId) và cuộc gọi (theo callId).
function buildSessions(events, allEvents) {
  const chatMap = new Map();
  const callMap = new Map();

  for (const e of events) {
    if (e.convId && (e.category.startsWith('CHAT') || e.category.startsWith('POPUP') ||
        e.event === 'playChatRequestNotification_error' || e.category === 'SOUND_ERROR' ||
        e.event === 'initChatRequestAudio_created')) {
      if (!chatMap.has(e.convId)) chatMap.set(e.convId, []);
      chatMap.get(e.convId).push(e);
    }
    if (e.callId) {
      if (!callMap.has(e.callId)) callMap.set(e.callId, []);
      callMap.get(e.callId).push(e);
    }
  }

  const sessions = [];
  for (const [id, evs] of chatMap) sessions.push(makeSession('chat', id, evs, allEvents));
  for (const [id, evs] of callMap) sessions.push(makeSession('call', id, evs, allEvents));
  sessions.sort((a, b) => (a.startTs || 0) - (b.startTs || 0));
  return sessions;
}

function makeSession(type, id, evs, allEvents) {
  evs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0) || (a.id || 0) - (b.id || 0));
  const first = evs[0], last = evs[evs.length - 1];
  const s = {
    type, id,
    events: evs,
    startTs: first.timestamp,
    endTs: last.timestamp,
    accountId: pickField(evs, 'accountId'),
    customerName: pickField(evs, 'customerName'),
    fromNumber: pickField(evs, 'fromNumber'),
    fromAlias: pickField(evs, 'fromAlias'),
    toAlias: pickField(evs, 'toAlias'),
    transferredFrom: pickField(evs, 'from')
  };
  s.diagnosis = type === 'chat' ? diagnoseChat(s, allEvents) : diagnoseCall(s);
  return s;
}

function pickField(evs, key) {
  for (const e of evs) if (e.data && e.data[key] != null && e.data[key] !== '') return e.data[key];
  return null;
}

function has(evs, event) { return evs.some(e => e.event === event); }
function find(evs, event) { return evs.find(e => e.event === event); }

// Chẩn đoán luồng CHAT theo guide mục D/E.
function diagnoseChat(s, allEvents) {
  const evs = s.events;
  const notes = [];
  let status = 'ok';
  const bump = (sev) => { if (SEVERITY_RANK[sev] > SEVERITY_RANK[status]) status = sev; };

  const received = has(evs, 'incommingchat') || has(evs, 'transferChatRequest');
  if (!received) {
    bump('error');
    notes.push({ sev: 'error', text: 'Không thấy "incommingchat" → chat có thể chưa tới máy agent (kiểm tra disconnect/kết nối).' });
  } else if (has(evs, 'transferChatRequest')) {
    notes.push({ sev: 'info', text: 'Chat được CHUYỂN từ ' + (s.transferredFrom || 'bộ phận khác') + ' sang.' });
  } else {
    notes.push({ sev: 'ok', text: 'Máy agent đã nhận được chat (incommingchat).' });
  }

  const sc = find(evs, 'sound_check');
  if (sc) {
    const reason = sc.data.reason;
    const rm = SOUND_CHECK_REASON[reason] || { label: reason || '(không rõ)', severity: 'info' };
    bump(rm.severity);
    notes.push({ sev: rm.severity, text: 'Quyết định chuông (sound_check): ' + rm.label + '.' });
  } else if (received) {
    notes.push({ sev: 'info', text: 'Không có "sound_check" cho phiên này (có thể do phiên bản).' });
  }

  const rangTrue = has(evs, 'playNotification_true');
  const rangFalse = has(evs, 'playNotification_false');
  const soundErr = evs.find(e => e.category === 'SOUND_ERROR');
  // Nếu chuông ĐÃ từng kêu thành công thì các lỗi sau đó (AbortError do lần
  // phát lại 2s ngắt lần trước) thường lành tính -> chỉ "cần lưu ý", không "lỗi".
  const failSev = rangTrue ? 'warn' : 'error';

  if (rangTrue) {
    notes.push({ sev: 'ok', text: 'Chuông ĐÃ KÊU (playNotification_true).' });
  }
  if (rangFalse) {
    bump(failSev);
    notes.push({ sev: failSev, text: rangTrue
      ? 'Có lần phát chuông bị ngắt (playNotification_false) nhưng chuông vẫn kêu được — thường lành tính (lần phát lại ngắt lần trước).'
      : 'Phát chuông THẤT BẠI (playNotification_false) — thường do trình duyệt chặn âm thanh tự động.' });
  }
  if (soundErr) {
    bump(failSev);
    const em = soundErr.data.errorMessage || soundErr.data.errorName || '';
    notes.push({ sev: failSev, text: (rangTrue ? 'Cảnh báo âm thanh (lành tính): ' : 'Lỗi âm thanh: ') + em });
  }

  // chỉ kết luận "không kêu" khi đã will_play mà không có true và cũng không có lý do tắt
  if (received && sc && sc.data.reason === 'will_play' && !rangTrue && !rangFalse && !soundErr) {
    bump('warn');
    notes.push({ sev: 'warn', text: 'Đã "will_play" nhưng KHÔNG thấy playNotification_true → mắt xích cuối đứt, nên escalate Dev.' });
  }

  // disconnect ngay trước khi nhận chat
  const disc = nearestDisconnectBefore(s, allEvents);
  if (disc) {
    notes.push({ sev: 'warn', text: 'Có "disconnect" ~' + disc + 's trước thời điểm bắt đầu phiên.' });
  }

  return { status, label: statusLabel(status, 'chat'), notes };
}

function diagnoseCall(s) {
  const evs = s.events;
  const notes = [];
  let status = 'ok';
  const bump = (sev) => { if (SEVERITY_RANK[sev] > SEVERITY_RANK[status]) status = sev; };

  const received = has(evs, 'incomingCall_received') || has(evs, 'incomingCall2_received');
  if (!received) {
    bump('warn');
    notes.push({ sev: 'warn', text: 'Không thấy "incomingCall_received" trong nhóm này.' });
  } else {
    notes.push({ sev: 'ok', text: 'Có cuộc gọi đến (incomingCall_received).' });
  }

  if (has(evs, 'incomingCall_rejected_busy')) {
    bump('error');
    notes.push({ sev: 'error', text: 'Cuộc gọi bị TỪ CHỐI vì máy đang bận.' });
  }
  if (has(evs, 'getIncomingCall_emitted') || has(evs, 'freeVideoCall_getIncomingCall_emitted')) {
    notes.push({ sev: 'ok', text: 'Đã hiển thị màn hình cuộc gọi cho agent.' });
  }
  if (has(evs, 'answerCall_executed')) {
    notes.push({ sev: 'ok', text: 'Agent đã nhấc máy.' });
  }

  const states = evs.filter(e => e.event === 'signalingstate_change').map(e => e.data.description);
  if (states.length) {
    const lastState = states[states.length - 1];
    const sm = SIGNALING_DESC[lastState] || { label: lastState, severity: 'info' };
    notes.push({ sev: sm.severity, text: 'Trạng thái cuối: ' + sm.label + (states.length > 1 ? ' (chuỗi: ' + states.join(' → ') + ')' : '') });
    if (lastState === 'BUSY') bump('error');
  }

  return { status, label: statusLabel(status, 'call'), notes };
}

function statusLabel(status, type) {
  if (status === 'ok') return type === 'chat' ? 'Chuông kêu / luồng OK' : 'Luồng gọi OK';
  if (status === 'info') return 'Bình thường';
  if (status === 'warn') return 'Cần lưu ý';
  return 'Có vấn đề';
}

function nearestDisconnectBefore(s, allEvents) {
  if (!s.startTs) return null;
  let best = null;
  for (const e of allEvents) {
    if (e.event === 'disconnect' && e.timestamp <= s.startTs) {
      const gap = (s.startTs - e.timestamp) / 1000;
      if (gap <= 5) { if (best === null || gap < best) best = gap; }
    }
  }
  return best === null ? null : best.toFixed(1);
}

export function analyze(rawArray) {
  const events = normalize(rawArray);
  const overview = buildOverview(events);
  const sessions = buildSessions(events, events);
  return { events, overview, sessions };
}
