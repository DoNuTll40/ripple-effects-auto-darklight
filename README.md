# @nuttawoot_donut/react-ripple

Material-style ripple ที่ตรวจจับโหมด **Dark/Light อัตโนมัติ** และรองรับการ **กำหนดสี/ความโปร่งใสเอง** ใช้ได้กับ React/Next.js (Client Component) และเว็บทั่วไป

```bash
npm i @nuttawoot_donut/react-ripple
```

---

## คุณสมบัติ
- โหมด **อัตโนมัติ** เลือกสี ripple ตามธีมระบบ: Dark จะเป็นขาวโปร่ง, Light จะเป็นดำโปร่ง
- **Override ได้**: บังคับโหมด `"dark"|"light"` หรือกำหนด `color` เองแบบ `#hex` / `rgba()`
- เคารพ `prefers-reduced-motion` ลดแอนิเมชันสำหรับผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหว
- ไม่ต้องพึ่ง CSS ภายนอก สร้าง `<span>` และลบหลังจบแอนิเมชันอัตโนมัติ

---

## ติดตั้ง
```bash
npm i @nuttawoot_donut/react-ripple
# หรือ
pnpm add @nuttawoot_donut/react-ripple
```

---

## การใช้งาน (React / Next.js)
> ใช้ใน **Client Component** เท่านั้น

```tsx
import React from "react";
import Ripple from "@nuttawoot_donut/react-ripple";

export default function DemoButtons() {
  const ripple = new Ripple();

  return (
    <div style={{ display: "flex", gap: 12 }}>
      {/* โหมดอัตโนมัติ (auto) ตามธีม */}
      <button onMouseDown={(e) => ripple.create(e)}>
        Auto Ripple
      </button>

      {/* บังคับโหมด */}
      <button onMouseDown={(e) => ripple.create(e, "light")}>
        Light Ripple
      </button>
      <button onMouseDown={(e) => ripple.create(e, "dark")}>
        Dark Ripple
      </button>

      {/* ระบุสีเอง + alpha */}
      <button
        onMouseDown={(e) =>
          ripple.create(e, { color: "#046838", alpha: 0.18 })
        }
      >
        Custom Color
      </button>
    </div>
  );
}
```

> หมายเหตุ: ถ้า host element เป็น `position: static` ไลบรารีจะตั้งเป็น `position: relative` ให้เองเพื่อวาด ripple ให้เต็มกรอบ

---

## API

### `new Ripple()`
สร้างอินสแตนซ์สำหรับใช้ซ้ำในหลายองค์ประกอบ

### `ripple.create(event, opts?)`
สร้าง ripple จากอีเวนต์ของเมาส์ ทัช หรือคีย์บอร์ด

- **event**: อีเวนต์จาก React เช่น `onMouseDown`, `onTouchStart`, หรือ `onKeyDown`
- **opts**:
  - `"dark"` | `"light"` บังคับโหมดแบบสั้น
  - `{ mode?: "dark"|"light", alpha?: number, color?: string }`
    - `mode` บังคับโหมด
    - `alpha` ความโปร่งใส 0..1 (ถ้าไม่กำหนดใช้ค่าจาก CONFIG)
    - `color` กำหนดสีทันที รองรับ `#hex`, `#rrggbbaa`, `rgb()`, `rgba()`

ตัวอย่าง:
```ts
ripple.create(e);                              // auto (ดูจากธีม)
ripple.create(e, "dark");                      // บังคับ dark
ripple.create(e, { alpha: 0.28 });             // auto + ปรับความโปร่งใส
ripple.create(e, { color: "rgba(4,104,56,0.18)" }); // กำหนดสีเอง
```

---

## การตั้งค่าแบบ Global (Static CONFIG)
ตั้งค่าเริ่มต้นให้ ripple ทั้งแอปด้วย `Ripple.CONFIG` ก่อนสร้างอินสแตนซ์

```ts
import Ripple from "@nuttawoot_donut/react-ripple";

Ripple.CONFIG = {
  COLOR: "auto",   // หรือ "#046838" / "rgba(4,104,56,0.18)"
  ALPHA: 0.20,     // โปร่งใสเริ่มต้น
  VELOCITY: 0.6,   // ความเร็วการขยาย
  MIN_GROW: 260,   // เวลาขยายขั้นต่ำ (ms)
  MAX_GROW: 560,   // เวลาขยายขั้นสูง (ms)
  FADE_OUT: 200,   // เวลาเฟดออก (ms)
  BLEED_PX: 4      // เผื่อรัศมีออกนอกขอบเล็กน้อย
};

const ripple = new Ripple();
```

> ลำดับการเลือกสี:
> 1) มี `opts.color` → ใช้ค่านั้น  
> 2) ไม่งั้นถ้า `CONFIG.COLOR` ไม่ใช่ `"auto"` → ใช้ค่านั้น  
> 3) ไม่งั้นใช้ **auto**: ขาวโปร่งใน Dark, ดำโปร่งใน Light

---

## การตรวจจับธีม
- ถ้า `document.documentElement` มีคลาส `"dark"` จะถือเป็นโหมดมืด
- ถ้า ancestor ใกล้สุดมี `data-theme="dark"` จะถือเป็นโหมดมืด
- ถ้าไม่พบทั้งสอง จะ fallback ไป `prefers-color-scheme: dark`

---


---

## รูปแบบสีที่รองรับ
คุณสามารถส่ง `color` ได้หลายแบบ ไม่ได้จำกัดแค่ `rgba()`:
- `#RGB` / `#RGBA` (เช่น `#0a3` หรือ `#0a3f`)
- `#RRGGBB` / `#RRGGBBAA` (เช่น `#046838` หรือ `#0468382E` ที่มี alpha ในตัว)
- `rgb()` / `rgba()` (เช่น `rgba(4,104,56,0.18)`)
- ชื่อสีที่เบราว์เซอร์รู้จัก (เช่น `green`) ก็ใช้ได้ แต่ **จะไม่ผสมความโปร่งใสให้เอง**

หลักการเลือก alpha:
1) ถ้า `color` เป็น `#RRGGBBAA` จะใช้ alpha จากค่านี้ทันที  
2) ถ้า `color` เป็น `#RGB`/`#RRGGBB` ให้กำหนด `alpha` แยกผ่าน `opts.alpha` (ถ้าไม่ใส่จะ fallback ไปที่ `Ripple.CONFIG.ALPHA`)  
3) ถ้าให้ `rgba()` ก็ใช้ตามนั้นตรงๆ

ตัวอย่าง:
```tsx
// ใช้ hex + alpha แยก
ripple.create(e, { color: "#046838", alpha: 0.18 });

// ใช้ hex 8 หลักที่มี alpha ในตัว
ripple.create(e, { color: "#0468382E" });

// ใช้ rgba ตรงๆ
ripple.create(e, { color: "rgba(4,104,56,0.18)" });
```

## การใช้งานแบบ CDN (Vanilla)
ไฟล์ build มี `ripple.js` ที่ expose `window.Ripple`

```html
<script src="https://unpkg.com/@nuttawoot_donut/react-ripple/ripple.js"></script>

<button id="btn">Ripple Me</button>
<script>
  const ripple = new window.Ripple();
  const btn = document.getElementById("btn");
  btn.addEventListener("mousedown", e => ripple.create(e));
</script>
```

> เวอร์ชันนี้ใช้การเรียก `create(e, opts)` แทน data-attributes

---

## SSR / Next.js
- ไลบรารีเช็ค DOM ก่อนเสมอ จึง **no-op บน SSR** และทำงานฝั่ง Client เท่านั้น
- ไม่กระทบ hydration เพราะสร้าง/ลบ DOM เพื่อแอนิเมชันเฉพาะฝั่ง client

---

## Accessibility
- รองรับ `keydown` บน Space/Enter เพื่อการเข้าถึงด้วยคีย์บอร์ด
- เคารพ `prefers-reduced-motion` ลดแอนิเมชันอัตโนมัติ

---

## ข้อควรทราบ
- ไลบรารีจะสร้าง `<span>` ลงใน host แล้วลบทิ้งหลังแอนิเมชันจบ
- ถ้าสีเป็นดำโปร่ง จะตั้ง `mix-blend-mode: multiply` เพื่อให้ดูกลืนกับพื้นสว่าง

---

## License
MIT

## Credits
ดัดแปลงจาก **material-ripple-effects** เพิ่ม auto Dark/Light, custom color/alpha และปรับแอนิเมชัน/พฤติกรรมให้เข้ากับแอปยุคปัจจุบัน
