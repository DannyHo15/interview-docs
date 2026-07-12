# 📈 01 — Thư viện vẽ biểu đồ (Charting Libraries)

> Trực quan hóa dữ liệu là trụ cột số 1 của JD. Nắm chắc phần này để trả lời sâu, không chỉ "em từng dùng ECharts". Ký hiệu 🔥 = câu cực hay gặp.

---

## 1. Canvas vs SVG — nền tảng phải hiểu trước 🔥

Đây là câu hỏi gốc, vì mọi thư viện chart đều dựa trên một trong hai cách vẽ này. Hiểu nó thì bạn giải thích được "tại sao thư viện A nhanh hơn thư viện B khi nhiều điểm".

**Định nghĩa ngắn:**

- **SVG** vẽ biểu đồ bằng các **phần tử DOM** (mỗi điểm, mỗi đường là một node `<circle>`, `<path>`). Trình duyệt quản lý từng phần tử.
- **Canvas** vẽ biểu đồ bằng cách **tô pixel lên một tấm bitmap** duy nhất. Sau khi vẽ xong, trình duyệt chỉ thấy một ảnh, không thấy từng điểm.

**Giải thích sâu:**

- SVG có ưu điểm: mỗi phần tử là một node DOM nên **gắn sự kiện (hover, click) trực tiếp được**, dễ style bằng CSS, và nét vẽ luôn sắc (vector, không vỡ khi zoom). Nhược điểm: khi có hàng chục nghìn điểm, số node DOM tăng khổng lồ, khiến trình duyệt chậm và tốn bộ nhớ.
- Canvas có ưu điểm: vẽ **hàng trăm nghìn điểm vẫn nhanh** vì tất cả chỉ là một bitmap, không tạo node DOM. Nhược điểm: muốn biết người dùng hover vào điểm nào thì phải **tự tính toán** dựa trên tọa độ chuột, vì không còn phần tử riêng để bắt sự kiện.

**Bẫy thường gặp:**

- Nói "Canvas luôn tốt hơn SVG" là **sai**. Với dashboard ít điểm (vài trăm), SVG dễ làm interactive và tooltip hơn. Canvas chỉ thắng rõ khi số điểm rất lớn.
- **Ngưỡng thực dụng để nhớ:** dưới ~1.000 điểm thì SVG thoải mái; trên ~10.000 điểm thì gần như bắt buộc Canvas (hoặc WebGL).
- **Câu hỏi nối tiếp:** *"Còn WebGL thì sao?"* → WebGL vẽ bằng GPU, xử lý được hàng triệu điểm. Dùng cho biểu đồ cực nặng (ví dụ scatter plot toàn bộ CPE trên bản đồ). Thư viện tiêu biểu: `deck.gl`, hoặc ECharts có renderer GPU cho một số chart.

---

## 2. ECharts vs Recharts vs D3 — so sánh 🔥

**Định nghĩa ngắn:** Đây là ba lựa chọn phổ biến nhất, khác nhau ở **mức độ trừu tượng** và **cách render**.

| Tiêu chí | ECharts | Recharts | D3.js |
|---|---|---|---|
| Cách render | Canvas (mặc định), có SVG | SVG (dựng trên React) | Bạn tự chọn (SVG/Canvas) |
| Mức trừu tượng | Cao — khai báo bằng object `option` | Cao — khai báo bằng component React | Thấp — thư viện thao tác dữ liệu + DOM |
| Dataset lớn | Rất tốt (canvas + progressive render) | Kém dần khi nhiều điểm (SVG) | Tùy bạn tự tối ưu |
| Loại chart có sẵn | Rất nhiều (time-series, gauge, heatmap, sankey, tree) | Cơ bản (line, bar, area, pie) | Không có sẵn — tự dựng |
| Độ khó | Trung bình | Dễ | Khó |
| Hợp với | Dashboard enterprise, dữ liệu lớn | Dashboard React đơn giản, gọn nhẹ | Visual custom độc đáo |

**Giải thích sâu:**

- **ECharts** là lựa chọn mặc định tốt cho dashboard viễn thông vì: render bằng canvas nên chịu được dataset lớn; có sẵn nhiều loại chart mà JD nhắc tới (time-series, heatmap); và có tính năng **progressive rendering** — vẽ dần từng phần thay vì đợi vẽ hết mới hiện. Cách dùng là mô tả biểu đồ bằng một object cấu hình gọi là `option`.
- **Recharts** được xây bằng chính component React, nên rất tự nhiên với người làm React và dễ tùy biến bằng JSX. Nhưng vì nó render bằng SVG, khi số điểm lớn thì chậm dần. Hợp với dashboard nhỏ gọn, ít dữ liệu.
- **D3.js** không phải "thư viện chart" mà là **bộ công cụ thao tác dữ liệu và DOM** (tính thang đo, trục, đường cong, nội suy màu). Nó cho bạn toàn quyền vẽ bất cứ thứ gì, nhưng phải tự làm gần như mọi thứ. Nhiều thư viện khác thực chất dùng D3 ở bên dưới.

**Bẫy thường gặp:**

- Đừng nói "D3 khó nên không nên dùng". Cách trả lời chuẩn: *"D3 mạnh nhất về khả năng tùy biến, nhưng tốn công. Với dashboard vận hành cần ra nhanh và ổn định, em ưu tiên ECharts; chỉ dùng D3 khi cần một visual đặc thù mà ECharts không có sẵn."*
- Một cách kết hợp thông minh (ghi điểm): dùng **D3 để tính toán thang đo/layout**, rồi **render bằng React hoặc Canvas** — tách phần "tính" khỏi phần "vẽ".
- **Câu hỏi nối tiếp:** *"Anh từng dùng cái nào, vì sao?"* → Bám kinh nghiệm thật: ECharts ở EVN GENCO3 (time-series, gauge, heatmap), TradingView cho real-time chart ở Avatar48.

---

## 3. Map loại chart → loại dữ liệu viễn thông 🔥

JD ghi rõ 4 loại chart: **time-series, bar, pie, heatmap**. Người phỏng vấn có thể hỏi "loại dữ liệu này em vẽ bằng chart gì". Chuẩn bị sẵn ánh xạ:

| Loại chart | Khi nào dùng | Ví dụ dữ liệu viễn thông |
|---|---|---|
| **Time-series (line/area)** | Một chỉ số thay đổi **theo thời gian** | Latency, throughput, packet loss theo từng phút; điểm QoE theo giờ |
| **Bar chart** | **So sánh** giữa các nhóm rời rạc | Số thiết bị CPE lỗi theo từng quận; băng thông trung bình theo model router |
| **Pie / Donut** | **Tỷ lệ thành phần** trong một tổng (dùng ít, tối đa ~5 phần) | Tỷ lệ CPE online / offline / cảnh báo; phân bổ thiết bị theo firmware |
| **Heatmap** | **Mật độ / cường độ** theo hai chiều | Mật độ lỗi theo (khu vực × giờ trong ngày); cường độ tín hiệu Wi-Fi theo vị trí |
| **Gauge** (bonus) | Một chỉ số so với ngưỡng | Điểm QoE tổng (0–100); mức sử dụng băng thông so với giới hạn |

**Giải thích sâu:**

- **Time-series là loại quan trọng nhất** cho giám sát hạ tầng, vì mọi metric mạng đều gắn với thời gian. Nắm kỹ: cách xử lý mốc thời gian (timezone), cách hiển thị khi zoom, và cách nối/ngắt đường khi dữ liệu bị thiếu (data gap).
- **Pie chart nên hạn chế.** Mắt người khó so sánh diện tích các lát. Nếu cần so sánh chính xác, bar chart luôn tốt hơn. Đây là một nhận xét ghi điểm về "hiểu trực quan hóa", không chỉ biết vẽ.
- **Heatmap** cực hợp để phát hiện điểm nóng (ví dụ giờ nào khu vực nào hay rớt mạng), vì nó nén được nhiều dữ liệu vào một hình mà mắt vẫn đọc được ngay.

**Bẫy thường gặp:**

- Đừng dùng pie chart cho dữ liệu có nhiều hơn ~5 nhóm, hoặc khi các nhóm gần bằng nhau — sẽ rất khó đọc.
- Với time-series bị thiếu dữ liệu (thiết bị offline một lúc), phải quyết định rõ: **ngắt đường** (thể hiện đúng là mất dữ liệu) hay **nối liền** (dễ nhìn nhưng gây hiểu nhầm là có dữ liệu). Với giám sát, thường nên ngắt đường để không che giấu sự cố.
- **Câu hỏi nối tiếp:** *"QoE là điểm tổng hợp từ nhiều metric, em hiển thị sao?"* → Gauge cho điểm tổng hiện tại + time-series cho xu hướng theo thời gian + có thể drill-down xuống các metric thành phần (latency, packet loss...) tạo nên điểm đó.

---

## 4. Vẽ real-time không giật — cập nhật chart hiệu quả

**Định nghĩa ngắn:** Dashboard giám sát cần cập nhật liên tục. Vấn đề là mỗi lần dữ liệu mới về, nếu vẽ lại toàn bộ biểu đồ thì tốn kém và gây giật.

**Giải thích sâu:**

- **Chỉ thêm điểm mới, không vẽ lại từ đầu.** ECharts có `appendData` để nối thêm dữ liệu vào chuỗi hiện có mà không dựng lại cả chart.
- **Gộp cập nhật (throttle/batch).** Nếu dữ liệu tới quá dày (nhiều lần mỗi giây), đừng vẽ lại theo từng gói. Gom lại và vẽ mỗi khoảng cố định (ví dụ 500ms một lần) là đủ mượt với mắt người.
- **Giới hạn cửa sổ dữ liệu.** Chart real-time chỉ nên giữ N điểm gần nhất (ví dụ 5 phút cuối), bỏ điểm cũ đi, nếu không bộ nhớ và thời gian vẽ sẽ phình theo thời gian chạy.
- **Đồng bộ với vòng vẽ của trình duyệt.** Cập nhật theo `requestAnimationFrame` thay vì `setInterval` giúp tránh vẽ thừa khi tab bị ẩn.

**Bẫy thường gặp:**

- Trong React, nếu để dữ liệu chart trong state và setState mỗi khi có điểm mới, cả cây component có thể re-render liên tục. Nên **giữ instance chart qua `useRef`** và cập nhật dữ liệu qua API mệnh lệnh của thư viện (như `setOption` của ECharts), thay vì để React re-render toàn bộ.
- Khi tab bị ẩn, `setInterval` vẫn chạy và tích lũy dữ liệu — nên **tạm dừng cập nhật khi tab ẩn** (dùng Page Visibility API).
- **Câu hỏi nối tiếp:** *"Real-time bằng WebSocket hay polling?"* → Nếu cần độ trễ thấp và server chủ động đẩy (alert rớt mạng), dùng WebSocket/SSE. Nếu chỉ cần refresh định kỳ và đơn giản, polling thông minh (dừng khi tab ẩn, giãn nhịp khi rảnh) là đủ.

---

## 5. Trục thời gian, múi giờ, và định dạng — chi tiết hay bị bỏ sót

**Định nghĩa ngắn:** Dashboard viễn thông toàn dữ liệu theo thời gian, nên xử lý đúng thời gian là chuyện sống còn.

**Giải thích sâu:**

- **Luôn lưu và truyền thời gian ở dạng UTC** (thường là ISO 8601 hoặc timestamp), chỉ đổi sang giờ địa phương ở **lớp hiển thị**. Nếu trộn lẫn, dữ liệu sẽ lệch giờ khó lần.
- **Trục thời gian nên dùng loại `time`** của thư viện chart (không phải trục phân loại), để thư viện tự chia mốc và giãn cách đúng theo thời gian thực, kể cả khi dữ liệu thưa đều.
- **Gom nhóm theo khoảng (bucket)** khi zoom: xem 1 ngày thì gom theo giờ, xem 1 giờ thì gom theo phút. Việc gom này nên làm ở backend (xem file SQL), frontend chỉ hiển thị.

**Bẫy thường gặp:**

- Định dạng ngày giờ khác nhau giữa các nước dễ gây nhầm (ngày/tháng vs tháng/ngày). Nên dùng định dạng rõ ràng và nhất quán.
- **Câu hỏi nối tiếp:** *"Dữ liệu 30 ngày mà vẽ theo giây thì cả triệu điểm — làm sao?"* → Không vẽ hết. Gom theo khoảng phù hợp mức zoom (downsampling), sẽ nói kỹ ở [file 02](./02-large-datasets.md).

---

## 6. Code mẫu tối thiểu — thủ sẵn cho vòng live-code 🔥

Nếu có bài live-code ("vẽ 1 line chart từ mảng data"), thủ sẵn 3 đoạn này để gõ ra trong 1 phút. Cùng 1 bộ data cho dễ so sánh.

```ts
const data = [
  { month: 'T1', value: 400 },
  { month: 'T2', value: 650 },
  { month: 'T3', value: 520 },
];
```

**Recharts** — khai báo bằng JSX, `ResponsiveContainer` lo responsive:

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#4f46e5" />
  </LineChart>
</ResponsiveContainer>
```

**ECharts** — mô tả bằng object `option`; trong React giữ instance qua `useRef`, cập nhật bằng `setOption` (không để React re-render toàn chart):

```tsx
import ReactECharts from 'echarts-for-react';

const option = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: data.map(d => d.month) },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, data: data.map(d => d.value) }],
};

<ReactECharts option={option} style={{ height: 300 }} />
```

> ⚠️ Nhớ nhắc: bundle ECharts lớn → import lẻ để tree-shake (`echarts/core` + `echarts/charts` + `echarts/components`), đừng `import * as echarts`.

**D3** — không có chart sẵn, tự tính scale rồi vẽ. Cách "senior" trong React: **dùng D3 để tính, render bằng JSX** (không để D3 đụng DOM, tránh xung đột React):

```tsx
import { scaleBand, scaleLinear, max } from 'd3';

const w = 300, h = 200;
const x = scaleBand().domain(data.map(d => d.month)).range([0, w]).padding(0.2);
const y = scaleLinear().domain([0, max(data, d => d.value)!]).range([h, 0]);

<svg width={w} height={h}>
  {data.map(d => (
    <rect key={d.month} x={x(d.month)} y={y(d.value)}
      width={x.bandwidth()} height={h - y(d.value)} fill="#4f46e5" />
  ))}
</svg>
```

> 🎯 Câu chốt ghi điểm: *"D3 là toolkit scale/shape, không phải thư viện chart. Em thường chỉ mượn `d3-scale`/`d3-shape` để tính, còn render giao cho React — tránh D3 và React tranh nhau điều khiển DOM."*

---

## 7. Còn Chart.js & visx thì sao? (phủ chữ "v.v." trong JD)

Nếu bị hỏi ngoài 3 cái chính:

- **Chart.js** — canvas, config đơn giản, rất nhẹ. Hợp trang tĩnh / dashboard nhỏ, **không phải React-first** (React chỉ có wrapper `react-chartjs-2`). So với ECharts thì ít loại chart và ít tùy biến hơn.
- **visx** (Airbnb) — chính là hướng "D3 tính, React vẽ" được đóng gói thành primitives (`@visx/scale`, `@visx/shape`...). Chọn khi cần **custom sâu trong hệ React** mà không muốn tự viết mọi thứ từ D3 thuần. Đường học cao hơn Recharts.

> Cách trả lời gọn khi bị hỏi "sao không dùng X?": *"Nguyên tắc của em là leo thang — Recharts cho chart chuẩn trong React, ECharts cho dashboard nặng/nhiều loại, chỉ xuống visx/D3 khi cần visual không có sẵn. Chọn tầng thấp nhất mà giải quyết được bài toán."*

---

🔗 [Về index Data Dashboard](./index.md) · [Tiếp: 02 — Large Datasets](./02-large-datasets.md)
