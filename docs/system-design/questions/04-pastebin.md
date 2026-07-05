# 04 — Design Pastebin 📝 (tự luyện)

> **Loại:** Easy · Rất giống URL Shortener — luyện sau khi đã đọc [01](./01-url-shortener.md).
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Thiết kế **Pastebin**: user dán một khối text/code → nhận về một URL ngắn (`pastebin.com/abc123`). Ai có link đều xem được nội dung.

## ❓ Clarifying questions nên hỏi
- Nội dung có **private** (cần mật khẩu / link bí mật) hay public?
- Có **expiration** (1 ngày / 1 tuần /永不 hết hạn)?
- Giới hạn **kích thước paste** (vd 1MB)?
- Có cần **syntax highlighting**, edit, version history?
- Anonymous hay cần đăng nhập?

## 📐 Estimation hints
- Text nặng hơn URL shortener (có thể tới 1MB/paste) → **storage lớn hơn đáng kể**.
- Read:write có thể ≈ 10:1.
- Storage = paste_count × avg_size; cẩn thận bậc số.

## 🎯 Trọng tâm / keywords
- Tái dùng **key-generation service** như URL Shortener.
- **Storage:** text lớn → lưu ở **object storage (S3)** + DB chỉ lưu metadata; text nhỏ lưu DB luôn.
- **Expiration:** TTL + background cleanup job (soft delete).
- **Cache:** hot paste (Stack Overflow snippet...) → Redis.
- **Security:** anti-abuse (size limit, rate limit, scan malware cho paste có executable).
- **CDN** cho paste read-heavy.

## ✅ Checklist tự đánh giá
- [ ] Đã chọn text storage: DB vs S3 có lý do?
- [ ] Đã xử lý expiration & cleanup?
- [ ] Đã đặt rate limit / size limit chống abuse?
- [ ] Đã có read path cache + 301/302?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
