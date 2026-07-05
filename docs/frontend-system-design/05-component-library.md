# 05 — Design a Component Library / Design System

> **Loại:** Medium · **Tần suất:** 🔥🔥 (hay gặp ở vòng frontend system design hoặc take-home).

---

## Bước 1 — Requirements

### Functional
- Cung cấp các component reusable: Button, Input, Modal, Select, Table, v.v.
- Hỗ trợ **theming** (light/dark, brand colors).
- TypeScript support, tree-shakeable.

### Non-functional
- **Consistency**: design tokens (color, spacing, typography, radius).
- **Accessibility**: WCAG 2.1 AA, keyboard navigation, ARIA.
- **DX**: docs (Storybook), clear API, good types.
- **Bundle size**: tree-shaking, không import cả library khi chỉ dùng Button.

---

## Bước 2 — Design Tokens

```typescript
const tokens = {
  color: {
    primary: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' },
    neutral: { 0: '#fff', 200: '#e5e7eb', 900: '#111827' },
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px' },
  radius: { sm: '4px', md: '8px', full: '9999px' },
  font: { sans: 'Inter, system-ui, sans-serif' },
};
```

---

## Bước 3 — Component API Design

### Ví dụ Button
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}
```

### Composition pattern
```tsx
<Dialog>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>Title</Dialog.Header>
    <Dialog.Body>Content</Dialog.Body>
    <Dialog.Footer>
      <Button>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>
```

---

## Bước 4 — Architecture

```
packages/
  ui/
    src/
      components/
        button/
          Button.tsx
          Button.test.tsx
          Button.stories.tsx
          index.ts
      theme/
        tokens.ts
        ThemeProvider.tsx
      hooks/
      utils/
    package.json
    tsconfig.json
```

- Mỗi component xuất riêng để tree-shaking.
- Dùng CSS Modules / CSS-in-JS (Panda, Tailwind) tùy stack.

---

## Bước 5 — Accessibility

- Focus management cho Modal (focus trap).
- `aria-*` attributes đầy đủ.
- Keyboard navigation cho Select, Tabs.
- Color contrast check.

---

## ✅ Checklist

- [ ] Design tokens rõ ràng.
- [ ] Component API nhất quán, dùng composition.
- [ ] TypeScript strict.
- [ ] Storybook docs.
- [ ] Tree-shakeable exports.
- [ ] A11y first.
