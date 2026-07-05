# 11 — Design a Notification System ✅ MẪU

> **Loại:** Medium · **Tần suất:** 🔥🔥 (hay gặp dạng multi-channel notification service).
> Áp dụng [khung 6 bước](../00-solving-framework.md).

---

## Bước 1 — Clarify Requirements

### Functional
- Gửi notification qua nhiều kênh: **push, SMS, email, in-app**.
- Các service khác có thể trigger notification (vd "user registered → send welcome email").
- Hỗ trợ template, đa ngôn ngữ, user preferences.

### Non-functional
- **High throughput**: có thể hàng triệu notifications/ngày.
- **Reliability**: notification quan trọng không được mất.
- **Spam prevention**: frequency cap, opt-out.
- **Latency**: transactional notification gần real-time; marketing có thể batch.

### Scope
- MVP: push + email + in-app, transactional + marketing.
- Later: SMS, A/B testing, analytics.

---

## Bước 2 — Estimation

- 10M users, mỗi ngày nhận ~5 notifications → **50M notifications/ngày ≈ 580/s**.
- Peak 10x → ~6,000/s.
- Email/SMS qua external provider → throughput bị giới hạn bởi provider API.
- Push (FCM/APNS) cũng có rate limit → cần queue + retry.

---

## Bước 3 — High-Level Design + API + Data Model

### API

```typescript
// Producer gọi
POST /v1/notifications
{
  "userId": "u_123",
  "type": "transactional",
  "channels": ["push", "email"],
  "templateId": "welcome_email",
  "data": { "name": "Danh" }
}
```

### Data Model

```sql
notifications
  id (PK)
  user_id
  type ('transactional' | 'marketing')
  channel ('push' | 'email' | 'sms' | 'in-app')
  status ('pending' | 'sent' | 'delivered' | 'failed')
  template_id
  content (rendered JSON)
  created_at
  sent_at

user_preferences
  user_id (PK)
  channel_prefs JSON -- { "email": true, "push": false, "marketing": false }
  quiet_hours_start
  quiet_hours_end

templates
  id (PK)
  name
  channel
  subject_template
  body_template
  locales JSON
```

### Architecture

```
[Producer Services]
        ↓
[Notification API] → validate → save notification
        ↓
[Kafka topics: transactional, marketing, push, email, sms]
        ↓
[Fanout Workers] → lấy user prefs → render template → gửi provider
        ↓
[Provider Adapters: FCM, APNS, SES, Twilio]
        ↓
[Users]
```

---

## Bước 4 — Deep Dive

### 🔑 Phần cốt lõi #1: Queue-based fanout

- Dùng Kafka với topic theo **priority/channel**:
  - `notifications.transactional` — xử lý trước.
  - `notifications.marketing` — có thể batch/delay.
  - `notifications.push`, `notifications.email`, `notifications.sms` — per channel.

### 🔑 Phần cốt lõi #2: Provider abstraction

```typescript
interface NotificationProvider {
  send(to: string, payload: unknown): Promise<DeliveryResult>;
}

class FcmPushProvider implements NotificationProvider { /* ... */ }
class SesEmailProvider implements NotificationProvider { /* ... */ }
class TwilioSmsProvider implements NotificationProvider { /* ... */ }
```

> Lợi ích: đổi provider dễ dàng, test/mock đơn giản.

### 🔑 Phần cốt lõi #3: Rate limiting & frequency capping

- **Global rate limit**: tối đa X emails/giây để tránh provider block.
- **Per-user frequency cap**: ví dụ tối đa 3 marketing emails/ngày.
- Dùng Redis counter với TTL 24h.

### 🔑 Phần cốt lõi #4: Retry + DLQ + idempotency

- Provider fail → retry với exponential backoff (vd 1min, 5min, 15min).
- Hết lượt retry → chuyển vào **DLQ** để xem xét thủ công.
- **Idempotency key** (`notification_id`) để tránh gửi trùng.

### 🔑 Phần cốt lõi #5: User preferences & quiet hours

- Worker check user prefs trước khi gửi.
- Nếu user tắt marketing email → bỏ qua.
- Quiet hours → delay đến khung giờ cho phép.

---

## Bước 5 — Bottlenecks & Trade-offs

| Vấn đề | Giải pháp |
|--------|-----------|
| Provider rate limit | Queue + backoff + multiple provider accounts |
| Spam user | Frequency cap + opt-out + preference center |
| Template rendering CPU-bound | Scale fanout workers horizontally |
| Duplicate sends | Idempotency key |
| Transactional latency | Priority queue riêng |

---

## Bước 6 — Wrap-up

> "Notification system cần decouple producer và sender qua queue, phân loại theo priority/channel, abstract provider để dễ thay đổi, và có rate limiting + retry + idempotency để đảm bảo reliability."

---

## ✅ Checklist tự đánh giá

- [ ] Đã dùng queue để decouple producer?
- [ ] Đã thiết kế provider abstraction?
- [ ] Đã có frequency cap / rate limit?
- [ ] Đã xử lý retry + DLQ + idempotency?
- [ ] Đã tách transactional vs marketing queue?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
