# 05 — Design a Distributed Cache (Memcached/Redis) 📝 (tự luyện)

> **Loại:** Medium · Concept nền tảng, hỏi dưới dạng *"thiết kế cache layer"*.
> Áp dụng [khung 6 bước](../00-solving-framework.md).

## 📌 Đề bài
Thiết kế một hệ thống cache phân tán dùng chung cho nhiều app server: `get(key)`, `set(key, value, ttl)`. Nhanh, available, scale được.

## ❓ Clarifying questions nên hỏi
- Kích thước item trung bình? Tổng capacity cần bao nhiêu?
- **Read/write ratio**, expected QPS?
- Có cần **persistence** (chết không mất data) hay cache thuần (chết được)?
- Có cần **consistency** với DB hay chỉ best-effort?
- Eviction policy mong muốn (LRU/LFU)?

## 📐 Estimation hints
- Memory bound → cần tính **số shard** = total_size / per_node_ram.
- Latency target **sub-ms** → mọi thứ phải in-memory.

## 🎯 Trọng tâm / keywords
- **Consistent hashing** để phân phối key → node, minimize move khi add/remove node.
- **Virtual nodes** tránh data skew.
- **Eviction:** LRU (thường default), LFU; cấu trúc **doubly-linked-list + hash map** (O(1)).
- **Write policies:** cache-aside, write-through, write-back (write-behind) — trade-off.
- **Cache invalidation:** TTL, explicit invalidate; *"cache invalidation is hard"*.
- **Cache stampede / thundering herd** → request coalescing, **bloom filter**, probabilistic early expiration.
- **Replication & failover** — primary/replica; khi node chết → dữ liệu trên node đó mất (cache miss → reload DB).
- **Sharded cluster** (Redis Cluster) + gossip.

## ✅ Checklist tự đánh giá
- [ ] Đã giải thích consistent hashing + virtual nodes?
- [ ] Đã chọn eviction policy có lý do?
- [ ] Đã xử lý cache stampede?
- [ ] Đã nói về failure mode (node chết thì sao)?

---
🔗 [README](../index.md) · [Khung 6 bước](../00-solving-framework.md)
