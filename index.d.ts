// index.d.ts
export type RippleMode = "dark" | "light";

export interface RippleOptions {
  /** บังคับโหมด ถ้าไม่ใส่จะ auto ตามธีม */
  mode?: RippleMode;
  /** ความโปร่งใส 0..1 ถ้าไม่ใส่ใช้ค่า Ripple.CONFIG.ALPHA */
  alpha?: number;
  /** สี สามารถเป็น #RGB/#RRGGBB/#RRGGBBAA หรือ rgb()/rgba() หรือชื่อสี */
  color?: string;
}

export type ReactEvent =
  | import("react").MouseEvent<HTMLElement>
  | import("react").TouchEvent<HTMLElement>
  | import("react").KeyboardEvent<HTMLElement>;

export type DOMEvent = MouseEvent | TouchEvent | KeyboardEvent;

/** Ripple effect สำหรับ React/เว็บ */
export default class Ripple {
  /** ค่าตั้งต้นแบบ global ปรับได้ก่อน new Ripple() */
  static CONFIG: {
    COLOR: "auto" | string;
    ALPHA: number;
    VELOCITY: number;
    MIN_GROW: number;
    MAX_GROW: number;
    FADE_OUT: number;
    BLEED_PX: number;
  };

  constructor();

  /**
   * สร้าง ripple จากอีเวนต์ของ React หรือ DOM
   * - opts: "dark" | "light" เพื่อบังคับโหมด หรือ { mode, alpha, color }
   */
  create(event: ReactEvent | DOMEvent, opts?: RippleMode | RippleOptions): void;
}

/** สำหรับไฟล์ CDN ที่ทำให้ window.Ripple มีอยู่ */
declare global {
  interface Window {
    Ripple: typeof Ripple;
  }
}
