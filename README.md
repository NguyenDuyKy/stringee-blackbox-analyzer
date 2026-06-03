# Stringee BlackBox Analyzer (Vue 3)

Web app phân tích log chat / cuộc gọi của agent từ file `stringee_blackbox_*.json`.
Chạy thẳng trên trình duyệt — **không cần Electron**.

## Chạy app

```powershell
npm install        # chỉ cần lần đầu
npm run dev        # mở http://localhost:5173
```

Build bản tĩnh để deploy / chia sẻ:

```powershell
npm run build      # xuất ra thư mục dist/
npm run preview    # xem thử bản build
```

Thư mục `dist/` là HTML/JS tĩnh, mở bằng bất kỳ web server nào (hoặc đưa lên hosting nội bộ).

## Cách dùng

1. Mở app → nhấn **Chọn file log JSON** hoặc **kéo–thả** file vào cửa sổ.
2. App tự phân tích và hiển thị 3 tab:

Trên **header** luôn hiển thị tên file, **khoảng thời gian log**, tổng số sự kiện / chat / cuộc gọi và mã agent.

### 📊 Tổng quan
Thống kê nhanh: tổng sự kiện, số chat/cuộc gọi, số lần mất kết nối, lỗi âm thanh, chuông thất bại, số phiên có vấn đề, biểu đồ sự kiện theo nhóm và theo ngày.

### 💬 Phiên (chat/cuộc gọi)
- Sidebar liệt kê từng **hội thoại** (theo `convId`) và **cuộc gọi** (theo `callId`), mỗi phiên có **chấm màu sức khỏe**:
  - 🟢 OK · 🔵 bình thường · 🟡 cần lưu ý · 🔴 có vấn đề
- Lọc theo loại (chat/gọi), tìm theo convId/callId/khách/số, hoặc chỉ xem phiên có vấn đề.
- **Phân trang** (20 / 50 / 100 phiên mỗi trang).
- Chọn 1 phiên → xem:
  - **Thẻ chẩn đoán tự động** dựa trên luồng kỳ vọng.
  - **Bảng thống kê số lượng từng loại event** trong phiên.
  - **Timeline trực quan** (màu theo mức độ, khoảng cách thời gian `+x.xs`, bấm xem JSON đầy đủ).
  - Nút **Copy mẫu báo cáo gửi Dev**.

### 📋 Toàn bộ sự kiện
Danh sách mọi sự kiện theo thời gian, lọc theo:
- **Khoảng thời gian** (từ–đến, chính xác tới giây) — mặc định bằng toàn bộ khoảng log, có nút khôi phục.
- **Nhóm** (category) và **mức độ** (ok / info / cần lưu ý / lỗi).
- **Tìm tự do** trong `event`/`data` (convId, callId, số, mã lỗi…).
- **Phân trang** (20 / 50 / 100 bản ghi mỗi trang).

## Cấu trúc mã nguồn

```
index.html              # điểm vào Vite
vite.config.js
src/
  main.js               # khởi tạo Vue
  App.vue               # khung app: topbar, tabs, modal
  style.css             # toàn bộ CSS
  lib/
    eventMeta.js        # bảng nhãn/màu/mức độ từng category-event (dịch guide mục C)
    analyzer.js         # gom phiên + logic chẩn đoán (mục D/E/F)
    format.js           # tiện ích format thời gian
  components/
    Dropzone.vue        # màn hình import / nút mở file
    OverviewView.vue    # tab Tổng quan
    SessionsView.vue    # tab Phiên (sidebar + chi tiết)
    SessionDetail.vue   # thẻ chẩn đoán + thống kê event + timeline
    AllEventsView.vue   # tab Toàn bộ sự kiện (lọc thời gian/nhóm/mức độ + phân trang)
    EventModal.vue      # popup xem JSON
    Pagination.vue      # component phân trang dùng chung (20/50/100)
```

## Logic chẩn đoán

Bám theo tài liệu Support ở [phần phụ lục bên dưới](#phụ-lục-hướng-dẫn-đọc-log-stringeeblackbox-dành-cho-support):
- **Chat**: `incommingchat` → `sound_check` (reason: `will_play` / `ring_chat_disabled` / `in_call_skip`) → `playNotification_true`. Nếu chuông đã từng kêu thì các `AbortError` sau đó (do lần phát lại mỗi 2s ngắt lần trước) được coi là **lành tính** → chỉ "cần lưu ý".
- **Gọi**: `incomingCall_received` → `getIncomingCall_emitted` → `signalingstate_change` (RINGING/ANSWERED/ENDED) → `answerCall_executed`; phát hiện từ chối vì máy bận.
- **Không vội kết luận lỗi** khi cả một loại event vắng mặt trên toàn file (do khác phiên bản phần mềm) — đúng "quy tắc an toàn" mục F.

---

# Phụ lục: Hướng dẫn đọc log StringeeBlackBox (dành cho Support)

> Tài liệu giúp đội Support tự đọc file log của agent để biết **chat/cuộc gọi đến có nhận được không, có kêu chuông không, vì sao không kêu** — mà không cần đọc code.

## A. File log là gì? Lấy ở đâu?

- Hệ thống tự ghi lại các sự kiện quan trọng (chat đến, cuộc gọi, kêu chuông, mất kết nối...) ngay trên trình duyệt của agent.
- Log **chỉ giữ 3 ngày gần nhất**, cũ hơn sẽ tự xoá → cần lấy log **sớm** khi khách báo lỗi.
- File tải về có dạng `stringee_blackbox_....json` (mở bằng Notepad++, VS Code, hoặc trình xem JSON).

### Cách yêu cầu agent xuất file log
Nhờ agent mở **Console trình duyệt** (phím `F12` → tab **Console**), gõ lệnh sau rồi Enter:

```js
StringeeBlackBox.exportToFile()
```

→ Trình duyệt sẽ tải về 1 file JSON. Gửi file đó cho Support.

## B. Mỗi dòng log trông như thế nào

File log là một **danh sách (mảng) các sự kiện**. Mỗi sự kiện trông như sau (ví dụ thật lấy từ file mẫu):

```jsonc
{
  "timestamp": 1776396490915,          // thời gian dạng số (epoch milliseconds) — xem cách đổi bên dưới
  "category": "CHAT_EVENT",            // nhóm sự kiện
  "event": "incommingchat",            // tên sự kiện cụ thể
  "data": { ... },                     // chi tiết: convId, accountId, cài đặt, lý do lỗi...
  "id": 27958                          // số thứ tự nội bộ
}
```

3 thứ cần nhìn đầu tiên ở mỗi dòng:
1. **`timestamp`** — để bám đúng thời điểm khách báo lỗi.
2. **`category` + `event`** — để biết "đang ở bước nào của luồng".
3. **`data`** — để biết chi tiết (mã hội thoại, mã cuộc gọi, cài đặt, lý do lỗi).

> Các dòng trong file đã **sắp xếp từ cũ → mới**. Đọc từ trên xuống là đúng thứ tự thời gian.

### Đổi `timestamp` ra giờ dễ đọc
`timestamp` là một dãy số (mili-giây). Để xem ra ngày giờ:
- Dán số đó (bỏ 3 chữ số cuối) vào web `https://www.epochconverter.com`, hoặc
- Nếu agent xuất log bằng lệnh `StringeeBlackBox.exportToFile()` (mục A) thì **mỗi dòng sẽ có sẵn trường `datetime`** đọc được ngay — **khuyến nghị dùng cách này**.

> Ví dụ: `1776396490915` ≈ **17/04/2026 10:28:10** (giờ máy agent).

### Hai "mã" để bám một phiên
- **`convId`** = mã 1 hội thoại chat. Lọc theo `convId` để theo dõi đúng 1 chat.
- **`callId`** = mã 1 cuộc gọi. Lọc theo `callId` để theo dõi đúng 1 cuộc gọi.
- **`accountId`** = mã của agent. Dùng để chắc chắn đang xem đúng người.

## C. Ý nghĩa từng loại sự kiện

### 🟢 Nhóm KẾT NỐI (`CHAT_CONNECTION`)
| event | Nghĩa là gì |
|---|---|
| `authen_result` | Kết quả đăng nhập hệ thống call/chat. `success: true` là OK. |
| `checkStringeeChatAlready` | Đang kiểm tra xem kết nối chat đã sẵn sàng chưa. |
| `stringeeChatConnected` | Đã kết nối chat thành công. |
| `requestNewToken` | Phiên hết hạn, hệ thống đang tự xin "vé" mới để kết nối lại. |
| `disconnect` | ⚠️ **Mất kết nối**. Nếu thấy ngay trước lúc khách mất chat/call → đây thường là nguyên nhân. |

### 💬 Nhóm CHAT ĐẾN
| category / event | Nghĩa là gì |
|---|---|
| `CHAT_EVENT` / `incommingchat` | **Máy agent đã NHẬN được chat đến.** Nếu không có dòng này → chat chưa tới được máy agent. |
| `CHAT_STORE` / `setChatRequestData` | Chat đã được đưa vào danh sách hiển thị trên màn hình. |
| `CHAT_NOTIFY` / `notifyMe` | Hệ thống bắn thông báo (popup góc màn hình). |
| `CHAT_TRANSFER` / `transferChatRequest` | Chat được **chuyển từ agent/bộ phận khác** sang agent này. |

### 🔔 Nhóm CHUÔNG CHAT (popup)
| category / event | Nghĩa là gì |
|---|---|
| `POPUP_WATCH` / `chatRequestData_changed` | Màn hình nhận thấy có chat mới, bắt đầu xử lý chuông. |
| `POPUP_SETTINGS` / `sound_check` | **Quyết định có kêu chuông hay không.** Xem trường `reason` (giải thích bên dưới). |
| `POPUP_SOUND` / `playNotification_true` | Đã phát chuông **thành công**. (Lặp lại mỗi 2 giây khi còn chat chờ — là bình thường.) |
| `POPUP_SOUND` / `playNotification_false` | ⚠️ Phát chuông **thất bại** (thường do trình duyệt chặn âm thanh tự động). |
| `POPUP_SOUND_LOOP` / `interval_cleared` | Dừng kêu chuông vì không còn chat nào chờ. |

**Giải thích `reason` trong `sound_check`:**
- `will_play` → sẽ kêu chuông bình thường.
- `ring_chat_disabled` → **agent đã TẮT chuông chat** trong cài đặt → không kêu là đúng cài đặt.
- `in_call_skip` → **đang nghe cuộc gọi** nên bỏ qua chuông chat.

### 🔊 Nhóm ÂM THANH (chung)
| category / event | Nghĩa là gì |
|---|---|
| `SOUND_PLAY` / `initChatRequestAudio_created` | Đã chuẩn bị sẵn file âm thanh chuông chat. |
| `SOUND_PLAY` / `playNotification_called` | Hệ thống yêu cầu phát một âm thanh (chuông gọi/ báo bận...). |
| `SOUND_PLAY` / `playNotification_success` | Phát âm thanh thành công. |
| `SOUND_ERROR` / `playNotification_error` | ⚠️ Lỗi phát âm thanh. Xem `errorMessage` để biết lý do. |
| `SOUND_ERROR` / `playChatRequestNotification_error` | ⚠️ Lỗi phát chuông chat. |

### 📞 Nhóm CUỘC GỌI
| category / event | Nghĩa là gì |
|---|---|
| `CALL_INCOMING` / `incomingCall_received` (và `incomingCall2_received`) | **Có cuộc gọi đến.** |
| `CALL_INCOMING` / `incomingCall_rejected_busy` | ⚠️ Cuộc gọi **bị từ chối vì máy đang bận**. |
| `CALL_RINGING` / `notifyMe_incomingCall` | Bắn thông báo có cuộc gọi đến. |
| `CALL_RINGING` / `getIncomingCall_emitted` | Hiển thị màn hình cuộc gọi đến cho agent. |
| `CALL_RINGING` / `signalingstate_change` | Đổi trạng thái cuộc gọi (đổ chuông / trả lời / bận / kết thúc) — xem `description`. |
| `CALL_ANSWERED` / `answerCall_executed` | Agent (tự động) **nhấc máy**. |
| `CALL_ENDED` / `callEnded_fromTopic` | Cuộc gọi **kết thúc**. |
| `CALL_ENDED` / `hangup_changeToken` | Cúp máy do hệ thống đổi phiên kết nối. |

**Giải thích `description` trong `signalingstate_change`:**
`RINGING` = đang đổ chuông · `ANSWERED` = đã trả lời · `BUSY` = máy bận · `ENDED` = kết thúc.

## D. Cách FOLLOW một luồng (quan trọng nhất)

### Bước chung
1. Hỏi khách/agent **thời điểm xảy ra lỗi** (khoảng mấy giờ).
2. Mở file log, tìm các dòng quanh `datetime` đó.
3. Lọc theo `accountId` (đúng agent) và `convId`/`callId` (đúng phiên).
4. **Đi theo thứ tự các bước kỳ vọng bên dưới.** Tìm xem luồng **dừng ở bước nào** → đó là nơi có vấn đề.
5. Đọc `data` ở bước cuối cùng để biết lý do.

### Luồng CHAT ĐẾN — thứ tự kỳ vọng
```
authen_result (success)
   → stringeeChatConnected
   → incommingchat            ← máy agent nhận được chat
   → setChatRequestData       ← chat lên màn hình
   → (notifyMe nếu cần)
   → chatRequestData_changed  ← bắt đầu xử lý chuông
   → sound_check              ← quyết định kêu chuông
   → playNotification_true    ← chuông kêu (lặp mỗi 2s)
```

### Luồng CUỘC GỌI ĐẾN — thứ tự kỳ vọng
```
incomingCall_received        ← có cuộc gọi
   → notifyMe_incomingCall    ← thông báo
   → getIncomingCall_emitted  ← hiện màn hình gọi
   → signalingstate_change (RINGING → ANSWERED hoặc ENDED)
   → (answerCall_executed nếu auto-pickup)
```

### Ví dụ thật: một luồng chat KÊU CHUÔNG bình thường

Trích từ file log thật của 1 agent (đã đổi ra giờ), một chat đến và kêu chuông đúng:

```
10:37:07.865  CHAT_EVENT        incommingchat            ← nhận được chat (convId conv-...96308)
10:37:07.873  CHAT_NOTIFY       notifyMe                 ← bắn thông báo
10:37:07.874  POPUP_WATCH       chatRequestData_changed  ← lên màn hình (newLength=1)
10:37:07.874  POPUP_SETTINGS    sound_check              ← reason: will_play  ✅
10:37:07.928  POPUP_SOUND       playNotification_true    ← CHUÔNG KÊU
10:37:09.874  POPUP_SOUND       playNotification_true    ← kêu lại sau 2 giây (bình thường)
10:37:10.396  POPUP_WATCH       chatRequestData_changed  ← agent đã xử lý xong (newLength=0)
10:37:10.396  POPUP_SOUND_LOOP  interval_cleared         ← ngừng chuông
```

→ Chuỗi đầy đủ, có `playNotification_true` ⇒ **chuông đã kêu OK**. Đây là mẫu "khỏe mạnh" để so sánh.

## E. Bảng chẩn đoán nhanh: Triệu chứng → Kiểm tra gì

| Khách/Agent phản ánh | Tìm trong log | Kết luận |
|---|---|---|
| Chat đến mà **không thấy hiện** | Có `incommingchat` không? | Không có → chat chưa tới máy (kiểm tra `disconnect` / kết nối). Có mà thiếu `setChatRequestData` → lỗi hiển thị, báo dev. |
| Chat hiện nhưng **không kêu chuông** | Xem `sound_check` → `reason` | `ring_chat_disabled` = agent tắt chuông. `in_call_skip` = đang trong cuộc gọi. |
| Đã `will_play` nhưng vẫn không nghe | Xem `playNotification_false` / `SOUND_ERROR` | Trình duyệt chặn âm thanh tự động → hướng dẫn agent cho phép âm thanh cho trang. |
| **Mất chat/cuộc gọi đột ngột** | Có `disconnect` ngay trước đó không? | Có → rớt kết nối mạng/phiên. |
| Cuộc gọi đến **không đổ chuông/không hiện** | Có `incomingCall_rejected_busy` không? | Có → máy đang bận nên bị từ chối. |
| **Không có thông báo** popup | Có `notifyMe` / `notifyMe_incomingCall` không? | Không có → tab đang mở/focus, hoặc cài đặt thông báo đang tắt. |

## F. Lưu ý khi đọc

- **Chuông kêu lặp lại mỗi 2 giây** (`playNotification_true` lặp nhiều dòng) là **bình thường**, không phải lỗi.
- `accountId` đôi khi trống — không có nghĩa là lỗi.
- Giờ là **giờ máy của agent**; nếu agent ở múi giờ khác cần lưu ý lệch giờ.
- ⚠️ **Phiên bản phần mềm của mỗi agent có thể khác nhau** → một vài loại event có thể **không xuất hiện** dù mọi thứ vẫn chạy đúng (ví dụ: file mẫu thật không hề có event `setChatRequestData` nhưng chat vẫn lên màn hình bình thường). **Quy tắc an toàn:** chỉ kết luận "lỗi tại bước X" khi bước trước nó CÓ mà bước sau ĐỘT NGỘT mất giữa chừng trong cùng một phiên; nếu **cả một loại event vắng mặt trên toàn file** thì nhiều khả năng do phiên bản, đừng vội kết luận.
- Các trường bên trong `data` cũng có thể thừa/thiếu tùy phiên bản — cứ đọc cái gì có, không bắt buộc phải đủ hết.
- Khi không chắc nguyên nhân (luồng dừng ở bước kỹ thuật như `setChatRequestData`, lỗi âm thanh lạ...), **gửi nguyên file log + thời điểm lỗi cho đội Dev** kèm mô tả mắt xích cuối cùng nhìn thấy.

## G. Mẫu báo cáo gửi Dev (khi cần escalate)

```
- Agent (accountId): ...
- Thời điểm lỗi: 02/06/2026 15:53
- Triệu chứng: chat đến không kêu chuông
- Mắt xích cuối thấy trong log: sound_check (reason: will_play),
  KHÔNG thấy playNotification_true
- convId: ...
- Đính kèm: stringee_blackbox_....json
```
