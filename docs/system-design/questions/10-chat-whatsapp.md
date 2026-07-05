# 10 — Design a Chat System (WhatsApp / Messenger) 🔥 📝 (tự luyện)

> **Loại:** Medium · Cực hay gặp; nhấn mạnh **real-time**.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Chat 1-1 (và group). User gửi tin nhắn → người nhận online nhận ngay (real-time), offline nhận khi online lại. Đảm bảo delivery status, thứ tự tin nhắn.

## ❓ Clarifying questions nên hỏi
- **1-1 hay group chat** (hay cả hai)?
- **Real-time** hay poll được chấp nhận? Latency mục tiêu?
- Cần **delivery/read receipt**, **typing indicator**?
- Hỗ trợ **media** (ảnh, video)?
- Tỉ lệ online user, MAU?

## 📐 Estimation hints
- Connection-per-user (WebSocket) tốn RAM → tính connection server count.
- Đa số message nhỏ (~ vài KB).

## 🎯 Trọng tâm / keywords
- **Transport:** **WebSocket** (2-way, persistent) hoặc **MQTT** (mobile-friendly); fallback SSE/long-poll.
- **Real-time connection layer** riêng (stateful) vs **message API layer** (stateless).
- **Message flow:** sender → message service → DB (write) → fanout → recipient's connection server → push qua WebSocket.
- **Offline user:** lưu message trong inbox; khi online → deliver; hoặc **push notification** (FCM/APNS).
- **Message ordering:** monotonic sequence id per conversation.
- **Delivery status:** store status (sent/delivered/read), update qua same WS channel.
- **Group chat:** fanout đến N members; group metadata service.
- **Sharding:** theo `conversation_id`.
- **Presence service** (online/offline) — pub/sub + TTL heartbeat.

## ✅ Checklist tự đánh giá
- [ ] Đã chọn WebSocket/MQTT + giải thích?
- [ ] Đã tách connection layer (stateful) vs API (stateless)?
- [ ] Đã xử lý offline user + push?
- [ ] Đã xử lý delivery status & ordering?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
