// Bảng ý nghĩa từng loại sự kiện — dịch từ blackbox-log-guide-for-support.md (mục C).
// severity: ok | info | warn | error  -> dùng để tô màu & chấm điểm sức khỏe.

export const CATEGORY_META = {
  CHAT_CONNECTION: { label: 'Kết nối', color: '#3fb950', icon: '🔌' },
  CHAT_EVENT:      { label: 'Chat đến', color: '#58a6ff', icon: '💬' },
  CHAT_STORE:      { label: 'Lưu chat', color: '#58a6ff', icon: '🗄️' },
  CHAT_NOTIFY:     { label: 'Thông báo chat', color: '#a371f7', icon: '🔔' },
  CHAT_TRANSFER:   { label: 'Chuyển chat', color: '#d29922', icon: '↪️' },
  POPUP_WATCH:     { label: 'Theo dõi popup', color: '#79c0ff', icon: '👁️' },
  POPUP_SETTINGS:  { label: 'Quyết định chuông', color: '#bc8cff', icon: '⚙️' },
  POPUP_SOUND:     { label: 'Chuông chat', color: '#f0883e', icon: '🔊' },
  POPUP_SOUND_LOOP:{ label: 'Vòng lặp chuông', color: '#8b949e', icon: '🔁' },
  SOUND_PLAY:      { label: 'Âm thanh', color: '#56d4dd', icon: '🎵' },
  SOUND_ERROR:     { label: 'Lỗi âm thanh', color: '#f85149', icon: '⚠️' },
  CALL_INCOMING:   { label: 'Cuộc gọi đến', color: '#2ea043', icon: '📞' },
  CALL_RINGING:    { label: 'Đổ chuông gọi', color: '#1f6feb', icon: '📲' },
  CALL_ANSWERED:   { label: 'Đã nhấc máy', color: '#3fb950', icon: '✅' },
  CALL_ENDED:      { label: 'Kết thúc gọi', color: '#8b949e', icon: '⏹️' }
};

// key = "category/event"
export const EVENT_META = {
  // ── KẾT NỐI ──
  'CHAT_CONNECTION/authen_result':         { label: 'Kết quả đăng nhập', desc: 'success: true là OK.', severity: 'ok' },
  'CHAT_CONNECTION/checkStringeeChatAlready': { label: 'Kiểm tra kết nối chat', desc: 'Đang kiểm tra chat đã sẵn sàng chưa.', severity: 'info' },
  'CHAT_CONNECTION/stringeeChatConnected': { label: 'Đã kết nối chat', desc: 'Kết nối chat thành công.', severity: 'ok' },
  'CHAT_CONNECTION/requestNewToken':       { label: 'Xin token mới', desc: 'Phiên hết hạn, đang tự kết nối lại.', severity: 'info' },
  'CHAT_CONNECTION/disconnect':            { label: 'MẤT KẾT NỐI', desc: 'Nếu thấy ngay trước lúc mất chat/call → thường là nguyên nhân.', severity: 'warn' },

  // ── CHAT ĐẾN ──
  'CHAT_EVENT/incommingchat':              { label: 'Nhận được chat đến', desc: 'Máy agent ĐÃ nhận được chat. Không có dòng này = chat chưa tới máy.', severity: 'ok' },
  'CHAT_STORE/setChatRequestData':         { label: 'Chat lên màn hình', desc: 'Chat đã vào danh sách hiển thị.', severity: 'ok' },
  'CHAT_NOTIFY/notifyMe':                  { label: 'Bắn thông báo chat', desc: 'Hệ thống bắn popup góc màn hình.', severity: 'info' },
  'CHAT_TRANSFER/transferChatRequest':     { label: 'Chat được chuyển sang', desc: 'Chat chuyển từ agent/bộ phận khác sang.', severity: 'info' },

  // ── CHUÔNG CHAT (popup) ──
  'POPUP_WATCH/chatRequestData_changed':   { label: 'Phát hiện chat mới', desc: 'Màn hình thấy chat mới, bắt đầu xử lý chuông (xem newLength).', severity: 'info' },
  'POPUP_SETTINGS/sound_check':            { label: 'Quyết định kêu chuông', desc: 'Xem reason để biết có kêu hay không.', severity: 'info' },
  'POPUP_SOUND/playNotification_true':     { label: 'Chuông KÊU thành công', desc: 'Đã phát chuông. Lặp mỗi 2s khi còn chat chờ là bình thường.', severity: 'ok' },
  'POPUP_SOUND/playNotification_false':    { label: 'Phát chuông THẤT BẠI', desc: 'Thường do trình duyệt chặn âm thanh tự động.', severity: 'error' },
  'POPUP_SOUND_LOOP/interval_cleared':     { label: 'Dừng kêu chuông', desc: 'Không còn chat nào chờ.', severity: 'info' },

  // ── ÂM THANH (chung) ──
  'SOUND_PLAY/initChatRequestAudio_created': { label: 'Chuẩn bị file chuông chat', desc: 'Đã tạo sẵn audio chuông chat.', severity: 'info' },
  'SOUND_PLAY/playNotification_called':    { label: 'Yêu cầu phát âm thanh', desc: 'Hệ thống yêu cầu phát một âm thanh.', severity: 'info' },
  'SOUND_PLAY/playNotification_success':   { label: 'Phát âm thanh OK', desc: 'Phát âm thanh thành công.', severity: 'ok' },
  'SOUND_ERROR/playNotification_error':    { label: 'LỖI phát âm thanh', desc: 'Xem errorMessage để biết lý do.', severity: 'error' },
  'SOUND_ERROR/playChatRequestNotification_error': { label: 'LỖI phát chuông chat', desc: 'Xem errorMessage để biết lý do.', severity: 'error' },

  // ── CUỘC GỌI ──
  'CALL_INCOMING/incomingCall_received':   { label: 'Có cuộc gọi đến', desc: 'Cuộc gọi đến máy agent.', severity: 'ok' },
  'CALL_INCOMING/incomingCall2_received':  { label: 'Có cuộc gọi đến (2)', desc: 'Cuộc gọi đến (kênh phụ).', severity: 'ok' },
  'CALL_INCOMING/incomingCall_rejected_busy': { label: 'Từ chối vì MÁY BẬN', desc: 'Cuộc gọi bị từ chối do đang bận.', severity: 'error' },
  'CALL_RINGING/notifyMe_incomingCall':    { label: 'Thông báo cuộc gọi', desc: 'Bắn thông báo có cuộc gọi đến.', severity: 'info' },
  'CALL_RINGING/getIncomingCall_emitted':  { label: 'Hiện màn hình gọi', desc: 'Hiển thị màn hình cuộc gọi đến cho agent.', severity: 'ok' },
  'CALL_RINGING/freeVideoCall_getIncomingCall_emitted': { label: 'Hiện màn hình gọi (video)', desc: 'Hiển thị màn hình cuộc gọi video.', severity: 'ok' },
  'CALL_RINGING/signalingstate_change':    { label: 'Đổi trạng thái gọi', desc: 'RINGING=đổ chuông · ANSWERED=trả lời · BUSY=bận · ENDED=kết thúc.', severity: 'info' },
  'CALL_ANSWERED/answerCall_executed':     { label: 'Đã nhấc máy', desc: 'Agent (tự động) nhấc máy.', severity: 'ok' },
  'CALL_ENDED/callEnded_fromTopic':        { label: 'Cuộc gọi kết thúc', desc: 'Cuộc gọi đã kết thúc.', severity: 'info' },
  'CALL_ENDED/hangup_changeToken':         { label: 'Cúp máy do đổi phiên', desc: 'Cúp máy do hệ thống đổi token kết nối.', severity: 'warn' }
};

export const SOUND_CHECK_REASON = {
  will_play:          { label: 'Sẽ kêu chuông bình thường', severity: 'ok' },
  ring_chat_disabled: { label: 'Agent đã TẮT chuông chat (đúng cài đặt)', severity: 'warn' },
  in_call_skip:       { label: 'Đang nghe cuộc gọi nên bỏ qua chuông', severity: 'warn' }
};

export const SIGNALING_DESC = {
  RINGING:  { label: 'Đang đổ chuông', severity: 'info' },
  ANSWERED: { label: 'Đã trả lời', severity: 'ok' },
  BUSY:     { label: 'Máy bận', severity: 'error' },
  ENDED:    { label: 'Kết thúc', severity: 'info' },
  UNKNOWN:  { label: 'Không xác định', severity: 'warn' }
};

export const SEVERITY_RANK = { ok: 0, info: 1, warn: 2, error: 3 };

export function metaFor(e) {
  const key = e.category + '/' + e.event;
  return EVENT_META[key] || { label: e.event, desc: '(không có mô tả)', severity: 'info' };
}

export function catMeta(category) {
  return CATEGORY_META[category] || { label: category, color: '#8b949e', icon: '•' };
}
