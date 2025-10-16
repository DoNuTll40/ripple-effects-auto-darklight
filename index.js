// src/lib/ripple.js
// ESM ให้เข้ากับ Next
const hasDOM = typeof window !== "undefined" && typeof document !== "undefined";

export default class Ripple {
  static CONFIG = {
    COLOR: "auto",   // "auto" หรือระบุสีเอง เช่น "#046838" / "rgba(4,104,56,0.18)"
    ALPHA: 0.20,     // ความบางเริ่มต้น (ระหว่าง 0..1)
    VELOCITY: 0.6,
    MIN_GROW: 260,
    MAX_GROW: 560,
    FADE_OUT: 200,
    BLEED_PX: 4
  };

  constructor() {
    const C = this.constructor.CONFIG;
    this.velocity = C.VELOCITY;
    this.minGrow  = C.MIN_GROW;
    this.maxGrow  = C.MAX_GROW;
    this.fadeOut  = C.FADE_OUT;
    this.bleedPx  = C.BLEED_PX;
    this.colorCfg = { color: C.COLOR, alpha: C.ALPHA };

    this.reduce   = hasDOM && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false;
    this.easeDecel = "cubic-bezier(0, 0, 0.2, 1)";
    this.easeFade  = "cubic-bezier(0.4, 0, 1, 1)";
    this.actives = new WeakMap();
  }

  isDarkContext(el) {
    if (!hasDOM) return false;
    if (document.documentElement.classList.contains("dark")) return true;
    const themed = el.closest?.("[data-theme]");
    if (themed?.getAttribute("data-theme") === "dark") return true;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches || false;
  }

  toRgba(input, fallbackA = 0.24) {
    if (!input) return `rgba(0,0,0,${fallbackA})`;
    const s = String(input).trim();
    if (s.startsWith("rgba(") || s.startsWith("rgb(")) return s;
    if (s[0] === "#") {
      let hex = s.slice(1);
      if (hex.length === 3 || hex.length === 4) hex = hex.split("").map(c => c + c).join("");
      if (hex.length === 6 || hex.length === 8) {
        const r = parseInt(hex.slice(0,2),16);
        const g = parseInt(hex.slice(2,4),16);
        const b = parseInt(hex.slice(4,6),16);
        let a = fallbackA;
        if (hex.length === 8) a = parseInt(hex.slice(6,8),16)/255;
        return `rgba(${r},${g},${b},${a})`;
      }
    }
    return s;
  }

  /**
   * resolveColor(el, opts?)
   * opts: "dark" | "light" | { mode?: "dark" | "light", alpha?: number, color?: string }
   * - คงโหมด auto เป็นค่าเริ่มต้น
   * - ถ้าส่ง color มาก่อน จะใช้สีนั้นทันที
   * - ถ้าไม่ส่ง color และยังเป็น auto จะเลือกขาว/ดำตามโหมด (auto หรือ override)
   */
  resolveColor(el, opts = undefined) {
    const C = this.constructor.CONFIG;
    const asObj = typeof opts === "string" ? { mode: opts } : (opts || {});
    const forcedMode = asObj.mode; // "dark" | "light" | undefined
    const a = (typeof asObj.alpha === "number" ? asObj.alpha : (this.colorCfg.alpha ?? C.ALPHA ?? 0.24));

    // explicit color override wins
    if (asObj.color) {
      return this.toRgba(asObj.color, a);
    }

    const autoColor = this.colorCfg.color;
    const isAuto = !autoColor || autoColor === "auto";
    const dark = forcedMode ? (forcedMode === "dark") : this.isDarkContext(el);

    if (isAuto) {
      // auto: ใช้ขาว/ดำ + alpha คงที่จาก CONFIG/override
      return dark ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    }
    // กรณีตั้งสีค่าคงที่ไว้ใน CONFIG.COLOR
    return this.toRgba(autoColor, a);
  }

  computeRadius(x, y, w, h) {
    const d1 = Math.hypot(x,     y);
    const d2 = Math.hypot(w-x,   y);
    const d3 = Math.hypot(x,     h-y);
    const d4 = Math.hypot(w-x,   h-y);
    return Math.max(d1,d2,d3,d4) + this.bleedPx;
  }

  computeGrowMs(radius) {
    if (this.reduce) return 0;
    const ms = radius / Math.max(0.001, this.velocity);
    return Math.max(this.minGrow, Math.min(this.maxGrow, ms));
  }

  getPoint(event, rect) {
    let cx, cy;
    if (event.touches && event.touches[0]) {
      cx = event.touches[0].clientX; cy = event.touches[0].clientY;
    } else if (event.type === "keydown") {
      cx = rect.left + rect.width/2; cy = rect.top + rect.height/2;
    } else {
      cx = (event.clientX ?? rect.left + rect.width/2);
      cy = (event.clientY ?? rect.top  + rect.height/2);
    }
    const x = Math.min(Math.max(cx - rect.left, 0), rect.width);
    const y = Math.min(Math.max(cy - rect.top,  0), rect.height);
    return { cx, cy, x, y };
  }

  growAnimation(el, duration) {
    if (!hasDOM) return { finished: Promise.resolve() };
    return el.animate(
      [
        { transform: "translate3d(0,0,0) scale(0.25)", opacity: 1 },
        { transform: "translate3d(0,0,0) scale(1)",     opacity: 1 }
      ],
      { duration: this.reduce ? 0 : duration, easing: this.easeDecel, fill: "forwards" }
    );
  }

  fadeAnimation(el, duration) {
    if (!hasDOM) return { finished: Promise.resolve() };
    return el.animate(
      [
        { transform: "translate3d(0,0,0) scale(1)",    opacity: 1 },
        { transform: "translate3d(0,0,0) scale(1.06)", opacity: 0 }
      ],
      { duration: this.reduce ? 0 : duration, easing: this.easeFade, fill: "forwards" }
    );
  }

  _bindRelease(host, endHandler) {
    if (!hasDOM) return () => {};
    const off = () => {
      document.removeEventListener("mouseup", endHandler, true);
      document.removeEventListener("touchend", endHandler, true);
      document.removeEventListener("touchcancel", endHandler, true);
      document.removeEventListener("keydown", endHandler, true);
      host.removeEventListener("mouseleave", endHandler, true);
    };
    document.addEventListener("mouseup", endHandler, true);
    document.addEventListener("touchend", endHandler, true);
    document.addEventListener("touchcancel", endHandler, true);
    document.addEventListener("keydown", endHandler, true);
    host.addEventListener("mouseleave", endHandler, true);
    return off;
  }

  /**
   * create(event, opts?)
   * opts: "dark" | "light" | { mode?: "dark"|"light", alpha?: number, color?: string }
   * - ถ้าไม่ส่ง opts เลย = auto ตามธีมเหมือนเดิม
   * - ส่ง "dark"/"light" เพื่อบังคับโหมด
   * - ส่ง { alpha } เพื่อบังคับความบาง
   * - ส่ง { color } เพื่อบังคับสีทันที (rgba/hex ได้)
   */
  create(event, opts = undefined) {
    if (!hasDOM) return; // no-op บน SSR
    const host = event.currentTarget;
    if (!host) return;

    const cs = getComputedStyle(host);
    if (cs.position === "static") host.style.position = "relative";
    host.style.overflow = "hidden";
    host.style.contain  = "paint";
    host.style.willChange = "transform";

    const rect = host.getBoundingClientRect();
    const { cx, cy, x, y } = this.getPoint(event, rect);
    const w = rect.width, h = rect.height;

    const radius = this.computeRadius(x, y, w, h);
    const growMs = this.computeGrowMs(radius);

    const prev = this.actives.get(host);
    if (prev && !prev.released) {
      prev.released = true;
      try {
        prev.grow.finished.finally(() => {
          const f = this.fadeAnimation(prev.el, this.fadeOut);
          f.finished.finally(() => prev.el.remove());
        });
      } catch {}
    }

    const circle = document.createElement("span");
    const color  = this.resolveColor(host, opts);

    circle.classList.add("ripple");
    circle.style.position = "absolute";
    circle.style.pointerEvents = "none";
    circle.style.borderRadius = "9999px";
    circle.style.left = `${cx - rect.left - radius}px`;
    circle.style.top  = `${cy - rect.top  - radius}px`;
    circle.style.width = circle.style.height = `${radius*2}px`;
    circle.style.willChange = "transform, opacity";
    circle.style.transform  = "translate3d(0,0,0) scale(0.25)";
    circle.style.opacity    = "1";
    circle.style.backgroundColor = color;
    if (/rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,/i.test(color)) {
      circle.style.mixBlendMode = "multiply";
    }

    host.appendChild(circle);

    const grow = this.growAnimation(circle, growMs);
    const state = { el: circle, grow, released: false, off: null };
    this.actives.set(host, state);

    const endHandler = (ev) => {
      if (ev.type === "keydown" && !(ev.code === "Space" || ev.code === "Enter")) return;
      if (state.released) return;
      state.released = true;
      state.off && state.off();

      const doFade = () => {
        const fade = this.fadeAnimation(circle, this.fadeOut);
        fade.finished.finally(() => circle.remove());
      };
      if (grow?.playState === "finished") doFade();
      else grow?.finished?.then(doFade).catch(doFade);
    };
    state.off = this._bindRelease(host, endHandler);
  }
}
