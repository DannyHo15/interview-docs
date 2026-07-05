# 03 — Monitoring, Logging & Tracing

> Observability giúp bạn biết hệ thống đang chạy thế nào, tìm lỗi nhanh, và cảnh báo kịp thờ i.

---

## 1. Three Pillars of Observability

| Pillar | Dữ liệu | Công cụ | Dùng để |
|--------|---------|---------|---------|
| **Metrics** | Số liệu tổng hợp theo thờ i gian | Prometheus, Datadog, Grafana | Tình trạng hệ thống, alerting |
| **Logs** | Dòng log chi tiết | ELK, Loki, CloudWatch | Debug cụ thể |
| **Traces** | Request flow qua nhiều service | Jaeger, Zipkin, Tempo | Tìm bottleneck distributed system |

---

## 2. Metrics quan trọng

### RED method (for services)
- **Rate**: số request/giây.
- **Errors**: tỉ lệ lỗi (5xx, 4xx).
- **Duration**: latency (p50, p95, p99).

### USE method (for resources)
- **Utilization**: % CPU, memory, disk.
- **Saturation**: queue length, wait time.
- **Errors**: hardware/network errors.

### SRE: SLI / SLO / SLA
- **SLI**: indicator (vd availability = 99.9%).
- **SLO**: objective mục tiêu.
- **SLA**: cam kết với khách hàng, thường có penalty.

---

## 3. Logging best practices

- Dùng **structured logging** (JSON) thay vì plain text.
- Mỗi log entry có timestamp, level, service, trace_id, message.
- Không log sensitive data (passwords, tokens, PII).
- Correlation ID / Trace ID để theo dõi request qua nhiều service.

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "error",
  "service": "payment-service",
  "trace_id": "abc-123",
  "message": "Payment failed",
  "error": "card_declined",
  "user_id": "u_456"
}
```

---

## 4. Alerting

- Cảnh báo dựa trên SLO (vd p99 latency > 500ms trong 5 phút).
- Tránh alert fatigue: chỉ cảnh báo khi cần hành động.
- Runbook: mỗi alert phải có hướng dẫn xử lý.

---

## Câu hỏi kinh điển

- **Metrics khác logs khác traces như thế nào?**
- **RED method là gì? USE method là gì?**
- **Làm sao debug request đi qua nhiều microservices?**
- **SLO/SLA/SLI khác nhau thế nào?**
- **Làm sao tránh log sensitive data?**
