# ⚡ Case 3 — Cập nhật real-time: Polling vs WebSocket vs SSE?

> **Loại:** Fullstack / Real-time · **Tần suất:** 🔥🔥🔥 (mọi app có chat/notification/feed đều hỏi).
> **Câu hỏi mẫu:** *"Làm sao để frontend nhận được dữ liệu mới ngay khi backend có update?"*

---

## Đặt vấn đề

HTTP mặc định là **request–response**: client hỏi, server trả. Nhưng nhiều tính năng cần server **push** dữ liệu khi có sự kiện: chat, notification, live score, stock price, dashboard realtime. Làm sao để client nhận được?

Có 3 hướng chính, mỗi cái có trade-off rõ rệt.

---

## Bước 1 — So sánh 3 hướng

| Tiêu chí | **Polling** | **Long-polling** | **SSE** | **WebSocket** |
|---|---|---|---|---|
| Hướng | Client hỏi định kỳ | Client hỏi, server giữ cho tới khi có data | Server push 1 chiều | **Song song 2 chiều** |
| Connection | N request ngắn | Request treo dài | 1 connection HTTP, giữ mở | 1 TCP connection, nâng cấp từ HTTP |
| Latency | Cao (phụ thuộc interval) | Trung bình | Thấp | Thấp nhất |
| Bandwidth | Lỡ (nhiều request rỗng) | Tốt hơn polling | Tốt | Tốt |
| Độ phức tạp BE | Thấp nhất | Trung bình | Trung bình | Cao (stateful, connection mgmt) |
| Binary | Không | Không | Không (text only) | Có |
| Tự reconnect | Tự code | Tự code | ✅ Built-in | Tự code |
| HTTP infra friendly | ✅ | ✅ | ✅ | Khó hơn (proxy/LB cần config WS) |

### Khi nào chọn gì?

- **Polling** → dữ liệu đổi chậm (mỗi 30s–1 phút) hoặc quy mô nhỏ. Vd: refresh số dư tài khoản.
- **SSE** → **chỉ cần server→client** (notification, live feed, log stream, AI token stream). **80% case real-time thực tế**.
- **WebSocket** → cần **2 chiều** (chat, collaborative editing, game, trading). Cần client gửi liên tục về server.

> 💡 **Quy tắc ngón tay cái:** default chọn **SSE**. Chỉ lên WebSocket khi **client phải push dữ liệu liên tục** về server. Đừng WebSocket chỉ để nhận notification — SSE đơn giản hơn nhiều.

---

## Bước 2 — Polling (đơn giản nhất)

```js
// Client hỏi mỗi 5s
setInterval(async () => {
  const data = await fetch('/api/notifications').then(r => r.json());
  if (data.length) updateUI(data);
}, 5000);
```

**Vấn đề:**
- **Latency = interval**: thông báo có thể chậm tới 5s.
- **Waste**: 90% request trả về rỗng nếu data hiếm khi đổi.
- **DDoS tự gây**: 10.000 user × poll mỗi 5s = 2.000 RPS liên tục vào BE.

**Cải thiện — Adaptive/Exponential polling:** poll nhanh khi active, chậm dần khi idle. Vd chat đang mở → 1s; tab background → 30s.

---

## Bước 3 — SSE (Server-Sent Events) — chọn mặc định cho 1 chiều

Server push dữ liệu tới client qua 1 HTTP connection giữ mở. Client chỉ lắng nghe.

```js
// FE — trivial
const es = new EventSource('/api/notifications/stream');
es.onmessage = (e) => updateUI(JSON.parse(e.data));
es.onerror = () => { /* tự reconnect built-in */ };
```

```js
// BE (Express/Fastify) — stream response
app.get('/api/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  eventBus.on('notification', send);

  // Heartbeat giữ connection sống (qua proxy timeout)
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.off('notification', send);
  });
});
```

**Ưu điểm:**
- **Tự reconnect** built-in (`EventSource` tự nối lại khi rớt).
- Dùng HTTP thường → thân thiện với proxy/CDN/load balancer, **không cần config đặc biệt**.
- Stream token AI (như ChatGPT) chính là SSE.

**Hạn chế:**
- **1 chiều** (server→client). Client gửi dữ liệu phải dùng fetch riêng.
- **Text only** (không binary).
- Trình duyệt giới hạn ~6 connection SSE/host (giải bằng HTTP/2 — multiplex 1 connection).

---

## Bước 4 — WebSocket — khi cần 2 chiều thật sự

```js
// FE
const ws = new WebSocket('wss://api.example.com/realtime');
ws.onmessage = (e) => updateUI(JSON.parse(e.data));
ws.send(JSON.stringify({ type: 'typing', chatId: 123 }));  // push lên server
```

```js
// BE (ws library / Socket.io)
wss.on('connection', (ws, req) => {
  ws.on('message', (msg) => broadcast(JSON.parse(msg)));
  ws.on('close', () => cleanup());
});
```

**Khi nào bắt buộc:** chat (cả 2 phía gửi liên tục), collaborative editing (Google Docs), multiplayer game, live trading (order book push lên + fill push xuống).

**Chi phí phức tạp hơn SSE:**
- **Stateful**: server phải giữ state mỗi connection (connectionRegistry, rooms, auth).
- **Auth khó hơn**: không có header cookie tự nhiên như HTTP → phải qua query param hoặc `Sec-WebSocket-Protocol` hoặc xác thực ngay sau handshake.
- **Infra**: load balancer/nginx/Cloudflare cần config **sticky session** hoặc **WS upgrade**. Horizontal scaling cần **pub/sub backbone** (Redis Pub/Sub) để sync message giữa các node.
- **Reconnect**: tự code (Socket.io có sẵn, raw WS thì không).

---

## Bước 5 — Scale real-time: bài toán khó nhất

Đây là chỗ **senior sẽ đào sâu**: *"100.000 user online cùng lúc, server push tới đúng user đó — làm sao?"*

### Vấn đề: sticky session & multiple nodes

```
User A ──WS──▶ Node 1
User B ──WS──▶ Node 2
```

Nếu event "gửi message cho User B" đến **Node 1**, Node 1 không có connection của User B → phải forward. Giải pháp:

### Pub/Sub backbone (Redis Pub/Sub hoặc message broker)

```
Node 1 nhận event "msg cho User B"
   │
   ├─▶ Publish lên Redis channel "user:B"
   │
Node 1, Node 2 đều subscribe channel này
   │
Node 2 (đang giữ WS của User B) nhận → push xuống User B
```

- Mỗi node subscribe channel của **mọi user mà nó đang giữ connection**.
- Khi có event cho user X, publish lên channel của X → đúng node giữ X sẽ nhận và push.

### Horizontal scaling checklist

- **Sticky session** ở LB HOẶC dùng pub/sub để route message (chọn 1).
- **Connection registry** (Redis): `user_id → {node_id, ws}` để biết user ở node nào.
- **Heartbeat/ping**: phát hiện client rớt, cleanup connection zombie.
- **Backpressure**: nếu client chậm nhận, server không tích tụ message vô hạn → drop hoặc rate-limit.

---

## Bước 6 — Xử lý lỗi & resilience

| Tình huống | Giải pháp |
|---|---|
| **Connection rớt** | SSE auto-reconnect. WS: tự code hoặc dùng Socket.io. Thường kèm **exponential backoff**. |
| **Message lỡ khi disconnect** | Server lưu **event log** (Redis Stream/Kafka) + client gửi `lastEventId` → server reply các event sau id đó (giống Kafka offset). |
| **Duplicate event** | Client **idempotent** theo `eventId` (bỏ qua event đã xử lý). |
| **Proxy timeout** (nginx default 60s) | Heartbeat keep-alive mỗi 30s; tăng `proxy_read_timeout`. |
| **Memory leak** | Luôn cleanup listener khi `req.on('close')`. Quên cái này = leak socket. |

---

## Sơ đồ quyết định

```
Cần real-time?
   │
   ├─ Không (data đổi chậm, mỗi phút+) → POLLING (đơn giản nhất)
   │
   └─ Có
        │
        ├─ Chỉ server→client? → SSE ✅ (default)
        │     (notification, feed, log, AI stream)
        │
        └─ Cần cả client→server liên tục? → WEBSOCKET
              (chat, collaborative edit, game, trading)
```

---

## Bẫy thường gặp

- **Dùng WebSocket cho mọi thứ** vì "modern" → over-engineering. Notification/feed chỉ cần SSE, đơn giản gấp nhiều lần.
- **Quên heartbeat** → proxy ngắt connection sau 60s im lặng, client tưởng vẫn online.
- **Không xử lý message lỡ** → user mất tin nhắn khi rớt mạng đúng lúc. Cần `lastEventId` + replay.
- **Polling quá nhanh** (1s cho 100k user) → tự DDoS BE. Adaptive polling hoặc nâng SSE.
- **Scale WS mà quên pub/sub** → message tới node không đúng, user không nhận được.

---

## Câu hỏi nối tiếp

- *"Vì sao ChatGPT dùng SSE mà không WebSocket?"* → Token streaming chỉ cần server→client (1 chiều); SSE đơn giản hơn, thân thiện proxy/CDN, auto-reconnect, và tích hợp tốt với HTTP/2 multiplexing.
- *"WebSocket vs WebRTC?"* → WebRTC cho **peer-to-peer** (video call, voice) — browser nói chuyện trực tiếp với browser qua STUN/TURN. WS là client↔server. Khác hẳn tầng.
- *"SSE giới hạn 6 connection?"* → Đúng với **HTTP/1.1**. HTTP/2 multiplex nhiều stream qua 1 TCP connection → không còn giới hạn. Đảm bảo server hỗ trợ HTTP/2.
- *"Socket.io khác raw WebSocket?"* → Socket.io là **library** phía trên WS (có fallback polling, auto-reconnect, rooms, ack). Đổi lại phụ thuộc library + coupling. Production lớn thường dùng raw WS + tự build.

> **Câu chốt phỏng vấn:** "Default em chọn SSE cho hầu hết case real-time vì đơn giản, tự reconnect, thân thiện infra. Chỉ lên WebSocket khi cần 2 chiều thật sự như chat/collaboration. Khi scale, bài toán thật không phải chọn protocol — mà là **route message đúng node đang giữ connection** qua pub/sub backbone như Redis."
