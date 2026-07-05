# 10 — Design a Chat System (WhatsApp / Messenger) 🔥 ✅ MẪU

> **Loại:** Medium · **Tần suất:** 🔥🔥🔥 (rất phổ biến, nhấn mạnh real-time).
> Áp dụng [khung 6 bước](../00-solving-framework.md).

---

## Bước 1 — Clarify Requirements

### Functional
- **1-1 chat**: gửi text, media, reaction.
- **Group chat**: tối đa N members (vd 256).
- **Delivery status**: sent → delivered → read.
- **Online/offline presence**.
- **Push notification** khi offline.

### Non-functional
- **Real-time**: latency < 500ms khi cả 2 online.
- **Availability**: message không được mất.
- **Ordering**: tin nhắn đúng thứ tự trong 1 conversation.
- **Scalability**: 10M DAU, ~100M messages/ngày.

### Scope
- MVP: 1-1 + group text, delivery status, presence, push.
- Later: E2E encryption, voice/video call, disappearing messages.

---

## Bước 2 — Estimation

- 10M DAU, mỗi user gửi ~10 messages/ngày → **100M messages/ngày ≈ 1,200 msg/s**.
- Peak 5x → ~6,000 msg/s.
- Mỗi message ~200 bytes (text) → 20GB/ngày.
- Media chiếm nhiều hơn → lưu trữ object storage (S3), DB chỉ lưu metadata.

**Connections:** 10M DAU × 10% online cùng lúc = 1M concurrent WebSocket connections.
- Mỗi WS server giữ ~100K connections → cần ~10 WS servers (có margin).

---

## Bước 3 — High-Level Design + API + Data Model

### API

```typescript
// Gửi tin nhắn (qua WebSocket)
{
  "type": "send_message",
  "payload": {
    "conversationId": "conv_123",
    "content": "hello",
    "clientMessageId": "cm_abc"
  }
}

// Nhận tin nhắn
{
  "type": "new_message",
  "payload": { "messageId": "msg_456", "senderId": "u_1", ... }
}

// Ack delivery
{
  "type": "delivery_status",
  "payload": { "messageId": "msg_456", "status": "delivered" }
}
```

REST endpoints:
- `GET /conversations` — danh sách conversation.
- `GET /messages?conversationId=...&cursor=...` — lịch sử tin nhắn.
- `POST /conversations` — tạo group.

### Data Model

```sql
conversations
  id (PK)
  type ('direct' | 'group')
  created_at

conversation_members
  conversation_id (FK)
  user_id
  joined_at
  PK(conversation_id, user_id)

messages
  id (PK)
  conversation_id (FK)
  sender_id
  content
  created_at
  sequence_id          -- ordering trong conversation

message_status
  message_id (FK)
  user_id
  status ('sent' | 'delivered' | 'read')
  updated_at
```

### Architecture

```
[Client A] ←WebSocket→ [WS Gateway A]
                              ↕
                        [Load Balancer] (sticky/session-aware)
                              ↕
[Client B] ←WebSocket→ [WS Gateway B]
                              ↕
                        [Message Service]
                              ↕
                    [Kafka / Message Queue]
                              ↕
            [DB] ←── [Presence Service]
            [S3]     [Push Notification Service]
```

---

## Bước 4 — Deep Dive

### 🔑 Phần cốt lõi #1: Tách connection layer vs application layer

- **WebSocket Gateway (stateful)**: chỉ giữ kết nối, forward message.
- **Message Service (stateless)**: xử lý business logic, ghi DB, fanout.

> Tại sao tách? Để scale độc lập. WS layer scale theo connections; app layer scale theo message throughput.

### 🔑 Phần cốt lõi #2: Message fanout

**1-1 chat:**
```
Client A → WS Gateway A → Message Service → Kafka → WS Gateway B → Client B
```

**Group chat (256 members):**
- Cách đơn giản: fanout ngay khi nhận → gửi đến tất cả members online.
- Cách tốt hơn: lưu 1 bản copy vào inbox của mỗi member (fanout-on-write) cho small group; large group thì fanout-on-read.

### 🔑 Phần cốt lõi #3: Message ordering

- Dùng **sequence_id** tăng dần theo conversation.
- Generated bởi counter service hoặc DB `auto_increment` per conversation shard.
- Client hiển thị theo `sequence_id`.

### 🔑 Phần cốt lõi #4: Presence

- Heartbeat mỗi 30s; timeout 60s → mark offline.
- Presence service dùng Redis với TTL.
- Khi user online/offline → pub/sub để friends biết.

### 🔑 Phần cốt lõi #5: Offline user

- Khi recipient offline:
  1. Lưu message vào inbox.
  2. Gửi push notification qua FCM/APNS.
  3. Khi user online lại → pull messages chưa delivered.

---

## Bước 5 — Bottlenecks & Trade-offs

| Vấn đề | Giải pháp |
|--------|-----------|
| 1M+ concurrent WS | Horizontal scale WS gateways + sticky LB |
| Message ordering | Sequence ID per conversation |
| Large group fanout | Fanout-on-write cho small group, fanout-on-read cho large group |
| Hot shard | Shard conversation theo `conversation_id` hash |
| Push notification overload | Rate limit + batch |
| Media storage | Object storage (S3) + CDN |

---

## Bước 6 — Wrap-up

> "Tóm lại, chat system gồm stateful WS gateway, stateless message service, Kafka để fanout, DB lưu messages + sequence_id để ordering, presence Redis, và push service cho offline user. 1-1 chat đơn giản; group chat cần chọn fanout strategy phù hợp."

---

## ✅ Checklist tự đánh giá

- [ ] Đã chọn WebSocket/MQTT + giải thích?
- [ ] Đã tách connection layer (stateful) vs API (stateless)?
- [ ] Đã xử lý offline user + push?
- [ ] Đã xử lý delivery status & ordering?
- [ ] Đã ước lượng connections và messages/s?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
