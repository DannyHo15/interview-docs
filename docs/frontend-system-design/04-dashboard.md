# 04 — Design a Real-time Dashboard

> **Loại:** Medium–Hard · **Tần suất:** 🔥🔥 (phổ biến cho B2B/Analytics roles).

---

## Bước 1 — Requirements

### Functional
- Hiển thị nhiều **widgets**: charts, tables, KPI cards, maps.
- User có thể **tùy chỉnh layout** (drag/drop, resize).
- Filter theo time range, region, v.v.
- Real-time updates cho 1 số metrics.

### Non-functional
- **Performance**: nhiều widget render cùng lúc, cần tránh blocking.
- **Reliability**: retry khi API fail, stale data handling.
- **Scalability**: support 50+ widgets.

---

## Bước 2 — API & Data Model

```typescript
interface Dashboard {
  id: string;
  title: string;
  layout: LayoutItem[];
}

interface LayoutItem {
  widgetId: string;
  x: number; y: number; w: number; h: number;
}

interface Widget {
  id: string;
  type: 'kpi' | 'line-chart' | 'bar-chart' | 'table' | 'map';
  title: string;
  dataSource: string; // endpoint key
  refreshInterval?: number;
}
```

### API examples
- `GET /api/dashboards/:id`
- `GET /api/widgets/:id/data?from=&to=`
- `GET /api/metrics/stream` (SSE/WebSocket)

---

## Bước 3 — Component Architecture

```
<DashboardPage>
  <DashboardHeader title={dashboard.title} />
  <FilterBar />
  <GridLayout>
    {widgets.map(widget => <WidgetRenderer key={widget.id} widget={widget} />)}
  </GridLayout>
</DashboardPage>
```

### WidgetRenderer
```typescript
function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'kpi': return <KpiWidget widget={widget} />;
    case 'line-chart': return <LineChartWidget widget={widget} />;
    case 'table': return <TableWidget widget={widget} />;
    default: return <UnsupportedWidget />;
  }
}
```

---

## Bước 4 — State Management

- **Global**: dashboard config, filters (time range, region).
- **Per-widget server state**: mỗi widget tự fetch data bằng React Query.
- **Real-time stream**: 1 global SSE connection, phân phối update đến widget đúng.

### Lợi ích của per-widget fetch
- Widget load độc lập, không block nhau.
- Retry/refetch per widget.
- Caching riêng biệt theo query key.

---

## Bước 5 — Performance

1. **Lazy load charts**: dynamic import charting library (Recharts, Chart.js, Victory).
2. **Web Workers**: heavy data transformation không chạy trên main thread.
3. **Debounce filters**: đợi user chọn xong time range mới fetch.
4. **Memoization**: widget chỉ re-render khi data hoặc config thay đổi.
5. **Virtualization cho table** dài.

---

## Bước 6 — Real-time Strategy

- **SSE** là đủ cho dashboard: server push one-way.
- Khi nhận update, so sánh `widgetId` và `metricKey`, cập nhật query cache.

```typescript
useEffect(() => {
  const eventSource = new EventSource('/api/metrics/stream');
  eventSource.onmessage = (event) => {
    const update = JSON.parse(event.data);
    queryClient.setQueryData(['widget', update.widgetId], update.data);
  };
  return () => eventSource.close();
}, []);
```

---

## ✅ Checklist

- [ ] Widget-based architecture với renderer tách biệt.
- [ ] Per-widget data fetching để tránh blocking.
- [ ] SSE cho real-time metrics.
- [ ] Lazy load heavy charting libraries.
- [ ] Error boundary cho từng widget.
