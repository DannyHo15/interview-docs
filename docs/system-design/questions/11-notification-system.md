# 11 — Design a Notification System 📝 (tự luyện)

> **Loại:** Medium · Hỏi dạng *"multi-channel notification service"*.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Service gửi notification qua nhiều kênh: **push (mobile), SMS, email**. Các service khác trigger ("user X đăng ký → gửi email chào"). Template, tần suất, retry.

## ❓ Clarifying questions nên hỏi
- **Kênh nào** cần hỗ trợ (push/SMS/email/in-app)?
- **Real-time** hay batch OK?
- Cần **user preference** (opt-out per channel/type)?
- Có cần **throttling** ("đừng spam > 5 mail/ngày")?
- Cần **templating** & đa ngôn ngữ?

## 📐 Estimation hints
- Notification volume có thể rất cao (hàng triệu/ngày).
- External providers (Twilio, SendGrid, FCM) là bottleneck → queue.

## 🎯 Trọng tâm / keywords
- **Producer → Kafka topic** (decouple) → **fanout worker** per channel.
- **Provider abstraction:** interface `send(channel, to, payload)`; mỗi kênh 1 adapter (FCM, APNS, Twilio, SES).
- **Rate limiting / frequency capping** per user (Redis) — chống spam.
- **User preference store** (which channel, quiet hours, opt-in).
- **Template engine** + i18n.
- **Retry + DLQ:** provider fail → backoff retry → DLQ nếu hết lượt.
- **Idempotency** (notification_id) tránh gửi trùng.
- **Priority** (transactional > marketing) → queue riêng.
- **Tracking:** delivered/opened/clicked → analytics.

## ✅ Checklist tự đánh giá
- [ ] Đã dùng queue để decouple producer?
- [ ] Đã thiết kế provider abstraction (đổi provider dễ)?
- [ ] Đã có frequency cap / rate limit?
- [ ] Đã xử lý retry + DLQ + idempotency?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
