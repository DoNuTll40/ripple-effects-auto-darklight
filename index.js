// ripple.js
module.exports = class Ripple {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }

  // ---------- Utils ----------
  isDarkContext(el) {
    // 1) ถ้า html มี .dark
    if (document.documentElement.classList.contains("dark")) return true;

    // 2) ถ้ามี data-theme="dark" บนตัวมันหรือพาเรนต์
    const themed = el.closest("[data-theme]");
    if (themed?.getAttribute("data-theme") === "dark") return true;

    // 3) fallback: ตามระบบ
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  }

  resolveColor(el, color) {
    if (!color || color === "auto") {
      return this.isDarkContext(el) ? "dark" : "light";
    }
    return color; // "dark" | "light"
  }

  // ---------- Geometry ----------
  findFurthestPoint(clickPointX, elementWidth, offsetX, clickPointY, elementHeight, offsetY) {
    this.x = clickPointX - offsetX > elementWidth / 4 ? 0 : elementWidth;
    this.y = clickPointY - offsetY > elementHeight / 4 ? 0 : elementHeight;
    this.z = Math.hypot(
      this.x - (clickPointX - offsetX),
      this.y - (clickPointY - offsetY)
    );
    return this.z;
  }

  // ---------- Paint ----------
  applyStyles(element, color, rect, radius, event) {
    element.classList.add("ripple");
    element.style.backgroundColor =
      color === "dark" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.20)";
    element.style.borderRadius = "100%";
    element.style.pointerEvents = "none";
    element.style.position = "absolute";
    element.style.left = event.clientX - rect.left - radius + "px";
    element.style.top = event.clientY - rect.top - radius + "px";
    element.style.width = element.style.height = radius * 2 + "px";

    // เตรียม layer ให้ GPU
    element.style.willChange = "transform, opacity";
    element.style.transform = "translateZ(0) scale(0.001)";
    element.style.opacity = "1";

    // กันอาการแฟลชขาวบนพื้นสว่าง
    if (color !== "dark") element.style.mixBlendMode = "multiply";
  }

  applyAnimation(element) {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const duration = reduce ? 0 : 500;

    requestAnimationFrame(() => {
      const anim = element.animate(
        [
          { transform: "translateZ(0) scale(0.001)", opacity: 1 },
          { transform: "translateZ(0) scale(1.5)", opacity: 0 }
        ],
        { duration, easing: "linear", fill: "forwards" }
      );

      anim.finished.finally(() => element.remove());
    });
  }

  // ---------- Public API ----------
  create(event, color = "auto") {
    const host = event.currentTarget;
    if (!host) return;

    // ให้ host พร้อมรับ ripple
    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }
    host.style.overflow = "hidden";
    host.style.contain = "paint";
    host.style.willChange = "transform";

    const rect = host.getBoundingClientRect();
    const radius = this.findFurthestPoint(
      event.clientX,
      host.offsetWidth,
      rect.left,
      event.clientY,
      host.offsetHeight,
      rect.top
    );

    const circle = document.createElement("span");

    // auto-detect โหมดจาก context
    const mode = this.resolveColor(host, color);
    this.applyStyles(circle, mode, rect, radius, event);
    this.applyAnimation(circle);

    host.appendChild(circle);
  }
};
