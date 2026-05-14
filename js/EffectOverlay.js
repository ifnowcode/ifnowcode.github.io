class EffectOverlay extends Element {
  constructor(metadata = {}) {
    super("div", {
      css: {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",   // ⭐ click-through
        overflow: "hidden",
        zIndex: "999999",        // always on top
        ...metadata.css
      },
      ...metadata
    });

    this.running = false;
    this._animationFrame = null;
  }

  start() {
    if (tracedebug) console.log("Start Effect:", this.mounted, this.running);
    //if (!this.mounted) return;
    if (!this.running) {
      this.running = true;
      this.loop();
    }
  }

  stop() {
    this.running = false;
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = null;
    }
  }

  loop() {
    if (!this.running || !this.mounted) return;
    this.update();
    this._animationFrame = requestAnimationFrame(() => this.loop());
  }

  // subclasses override this to run effects
  update() {}
}

class FloatingStars extends EffectOverlay {
  constructor(count = 50, metadata = {}) {
    super(metadata);

    this.stars = [];
    this.count = count;

    for (let i = 0; i < count; i++) {
      const star = new Element("div", {
        css: {
          position: "absolute",
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          backgroundColor: this.randomColor(),
          top: Math.random() * 100 + "vh",
          left: Math.random() * 100 + "vw",
          opacity: 0.8,
        }
      });

      this.addChild(star);

      this.stars.push({
        el: star,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,   // slow drift
        vy: (Math.random() - 0.5) * 0.5,
      });
    }
  }

  randomColor() {
    const r = Math.floor(150 + Math.random() * 105);
    const g = Math.floor(150 + Math.random() * 105);
    const b = Math.floor(150 + Math.random() * 105);
    return `rgb(${r},${g},${b})`;
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const s of this.stars) {
      s.x += s.vx;
      s.y += s.vy;

      // wrap around edges
      if (s.x < 0) s.x = w;
      if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h;
      if (s.y > h) s.y = 0;

      s.el.dom.style.transform = `translate(${s.x}px, ${s.y}px)`;
    }
  }
}

class FallingConfetti extends EffectOverlay {
  constructor(count = 80, metadata = {}) {
    super(metadata);

    this.count = count;
    this.pieces = [];

    for (let i = 0; i < count; i++) {
      const size = 10; // fixed 10px circles

      const piece = new Element("div", {
        css: {
          position: "absolute",
          width: size + "px",
          height: size + "px",
          borderRadius: "50%",
          backgroundColor: this.randomColor(),
          opacity: 0.6,
          top: -(Math.random() * window.innerHeight) + "px",
          left: Math.random() * window.innerWidth + "px",
          pointerEvents: "none"
        }
      });

      this.addChild(piece);

      this.pieces.push({
        el: piece,
        x: Math.random() * window.innerWidth,
        y: -(Math.random() * window.innerHeight),
        vy: 0.5 + Math.random() * 1.5,   // fall speed
        vx: (Math.random() - 0.5) * 0.5, // slight horizontal drift
      });
    }
  }

  randomColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgba(${r},${g},${b},0.6)`;
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const p of this.pieces) {
      p.x += p.vx;
      p.y += p.vy;

      // wrap horizontally
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;

      // recycle when falling off bottom
      if (p.y > h) {
        p.y = -20;
        p.x = Math.random() * w;
        p.vy = 0.5 + Math.random() * 1.5;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.el.dom.style.backgroundColor = this.randomColor();
      }

      p.el.dom.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  }
}

class Rain extends EffectOverlay {
  constructor(count = 120, metadata = {}) {
    super(metadata);

    this.count = count;
    this.drops = [];

    for (let i = 0; i < count; i++) {
      const width = 2;          // thin rain streak
      const height = 15 + Math.random() * 20; // random streak length

      const drop = new Element("div", {
        css: {
          position: "absolute",
          width: width + "px",
          height: height + "px",
          backgroundColor: "rgba(255,255,255,0.4)",
          borderRadius: "1px",
          top: -(Math.random() * window.innerHeight) + "px",
          left: Math.random() * window.innerWidth + "px",
          pointerEvents: "none"
        }
      });

      this.addChild(drop);

      this.drops.push({
        el: drop,
        x: Math.random() * window.innerWidth,
        y: -(Math.random() * window.innerHeight),
        vy: 4 + Math.random() * 6 // fall speed
      });
    }
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const d of this.drops) {
      d.y += d.vy;

      // recycle when off bottom
      if (d.y > h) {
        d.y = -20;
        d.x = Math.random() * w;
        d.vy = 4 + Math.random() * 6;
      }

      d.el.dom.style.transform = `translate(${d.x}px, ${d.y}px)`;
    }
  }
}

class BlueNeonRain extends EffectOverlay {
  constructor(count = 150, metadata = {}) {
    super(metadata);

    this.count = count;
    this.drops = [];
    this.lightningCooldown = 0;

    for (let i = 0; i < count; i++) {
      const length = 20 + Math.random() * 30;

      const drop = new Element("div", {
        css: {
          position: "absolute",
          width: "2px",
          height: length + "px",
          background: "rgba(0, 180, 255, 0.8)",   // neon blue
          boxShadow: "0 0 6px rgba(0, 180, 255, 0.9)",
          borderRadius: "1px",
          pointerEvents: "none",
          transform: "rotate(12deg)",             // angled rain
          top: -(Math.random() * window.innerHeight) + "px",
          left: Math.random() * window.innerWidth + "px"
        }
      });

      this.addChild(drop);

      this.drops.push({
        el: drop,
        x: Math.random() * window.innerWidth,
        y: -(Math.random() * window.innerHeight),
        vy: 6 + Math.random() * 8,                // fall speed
        vx: 1 + Math.random() * 2                 // wind drift
      });
    }

    // Lightning flash layer
    this.flash = new Element("div", {
      css: {
        position: "absolute",
        inset: "0",
        background: "rgba(0, 150, 255, 0.0)",
        transition: "background 0.15s ease-out",
        pointerEvents: "none"
      }
    });

    this.addChild(this.flash);
  }

  triggerLightning() {
    // Flash bright blue-white
    this.flash.dom.style.background = "rgba(180, 220, 255, 0.8)";

    // Fade out automatically
    setTimeout(() => {
      this.flash.dom.style.background = "rgba(0, 150, 255, 0.0)";
    }, 80);
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Random lightning chance (but not too often)
    if (this.lightningCooldown <= 0 && Math.random() < 0.005) {
      this.triggerLightning();
      this.lightningCooldown = 200; // frames until next possible flash
    } else {
      this.lightningCooldown--;
    }

    for (const d of this.drops) {
      d.x += d.vx;
      d.y += d.vy;

      // Wrap horizontally (wind pushes them sideways)
      if (d.x > w + 50) d.x = -50;

      // Reset when falling off bottom
      if (d.y > h + 50) {
        d.y = -40;
        d.x = Math.random() * w;
        d.vy = 6 + Math.random() * 8;
        d.vx = 1 + Math.random() * 2;
      }

      d.el.dom.style.transform = `translate(${d.x}px, ${d.y}px) rotate(12deg)`;
    }
  }
}

class MatrixCodeRain extends EffectOverlay {
  constructor(columnCount = 60, metadata = {}) {
    super(metadata);

    this.columns = [];
    this.columnCount = columnCount;

    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < columnCount; i++) {
      const chars = this.randomColumnText();
      
      const column = new Element("div", {
        css: {
          position: "absolute",
          top: -(Math.random() * h) + "px",
          left: (i * (w / columnCount)) + "px",
          fontFamily: "monospace",
          fontSize: "18px",
          color: "rgba(0,255,70,0.8)",
          textShadow: "0 0 8px rgba(0,255,70,1)",
          whiteSpace: "pre",
          pointerEvents: "none",
          userSelect: "none"
        },
        props: {textContent: chars}
      });

      this.addChild(column);
      
      this.columns.push({
        el: column,
        text: chars,
        y: -(Math.random() * h),
        vy: 2 + Math.random() * 4, // fall speed
      });

      //column.dom.textContent = chars;
    }
  }
  
  onMount() {
  }

  randomChar() {
    const chars = "アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return chars[Math.floor(Math.random() * chars.length)];
  }

  randomColumnText() {
    const length = 20 + Math.floor(Math.random() * 20);
    let out = "";
    for (let i = 0; i < length; i++) out += this.randomChar() + "\n";
    return out;
  }

  update() {
    const h = window.innerHeight;
    console.log("Update");
    for (const c of this.columns) {
      c.y += c.vy;

      // recycle when off bottom
      if (c.y > h) {
        c.y = -200;
        c.vy = 2 + Math.random() * 4;
        c.text = this.randomColumnText();
        c.el.dom.textContent = c.text;
      }

      c.el.dom.style.transform = `translateY(${c.y}px)`;
    }
  }
}

class GlowClick extends EffectOverlay {
  constructor(metadata = {}) {
    super(metadata);

    this.ripples = [];
    this._pointerHandler = null;
  }

  createRipple(x, y) {
    const ripple = document.createElement("div");

    Object.assign(ripple.style, {
      position: "absolute",
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      background: "rgba(0, 200, 255, 0.4)",
      boxShadow: "0 0 12px rgba(0, 200, 255, 0.8)",
      pointerEvents: "none",
      transform: `translate(${x}px, ${y}px) scale(1)`,
      opacity: "1"
    });

    this.dom.appendChild(ripple);

    this.ripples.push({
      el: ripple,
      x,
      y,
      radius: 1,
      opacity: 1,
      growth: 0.6 + Math.random() * 0.4,
      fade: 0.015 + Math.random() * 0.01
    });
  }

  update() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];

      r.radius += r.growth;
      r.opacity -= r.fade;

      if (r.opacity <= 0) {
        r.el.remove();
        this.ripples.splice(i, 1);
        continue;
      }

      r.el.style.transform =
        `translate(${r.x}px, ${r.y}px) scale(${r.radius})`;
      r.el.style.opacity = r.opacity;
    }
  }

  onMount() {
    super.onMount();

    // Overlay is click-through, so listen globally
    this._pointerHandler = (e) => {
      this.createRipple(e.clientX, e.clientY);
    };

    window.addEventListener("pointerdown", this._pointerHandler);
  }

  onUnmount() {
    super.onUnmount();
    window.removeEventListener("pointerdown", this._pointerHandler);
  }
}

class ItsRainingMoney extends EffectOverlay {
  constructor(count = 100, metadata = {}) {
    super(metadata);

    this.count = count;
    this.items = [];
  }

  createMoneyNode() {
    const el = document.createElement("div");

    // Randomly choose $ or coin
    const isDollar = Math.random() < 0.6;

    el.textContent = isDollar ? "$" : "●";

    Object.assign(el.style, {
      position: "absolute",
      fontSize: isDollar ? "24px" : "14px",
      color: isDollar ? "rgba(0,255,0,0.9)" : "rgba(255,215,0,0.9)",
      textShadow: isDollar
        ? "0 0 6px rgba(0,255,0,0.8)"
        : "0 0 6px rgba(255,215,0,0.8)",
      pointerEvents: "none",
      userSelect: "none",
      transform: "translate(0px, 0px)"
    });

    this.dom.appendChild(el);

    return el;
  }

  spawnItem() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createMoneyNode();

    const item = {
      el,
      x: Math.random() * w,
      y: -(Math.random() * h),
      vy: 2 + Math.random() * 4,     // fall speed
      vx: (Math.random() - 0.5) * 1, // slight drift
    };

    this.items.push(item);
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Spawn initial items until count reached
    while (this.items.length < this.count) {
      this.spawnItem();
    }

    for (const m of this.items) {
      m.x += m.vx;
      m.y += m.vy;

      // Wrap horizontally
      if (m.x < -50) m.x = w + 50;
      if (m.x > w + 50) m.x = -50;

      // Reset when off bottom
      if (m.y > h + 50) {
        m.y = -40;
        m.x = Math.random() * w;
        m.vy = 2 + Math.random() * 4;
        m.vx = (Math.random() - 0.5) * 1;
      }

      m.el.style.transform = `translate(${m.x}px, ${m.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const m of this.items) m.el.remove();
    this.items = [];
  }
}

class PartyBalloons extends EffectOverlay {
  constructor(count = 40, metadata = {}) {
    super(metadata);

    this.count = count;
    this.balloons = [];
  }

  createBalloonNode() {
    const el = document.createElement("div");

    // Random balloon color
    const colors = [
      "rgba(255, 80, 80, 0.9)",
      "rgba(80, 180, 255, 0.9)",
      "rgba(255, 200, 80, 0.9)",
      "rgba(120, 255, 120, 0.9)",
      "rgba(255, 120, 255, 0.9)"
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const size = 30 + Math.random() * 30;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size * 1.3 + "px",
      background: color,
      borderRadius: "50% 50% 45% 45%",
      boxShadow: `0 0 12px ${color}`,
      pointerEvents: "none",
      userSelect: "none",
      transform: "translate(0px, 0px)"
    });

    // Add a little balloon string
    const string = document.createElement("div");
    Object.assign(string.style, {
      position: "absolute",
      bottom: "-20px",
      left: "50%",
      width: "2px",
      height: "20px",
      background: "rgba(255,255,255,0.6)",
      transform: "translateX(-50%)"
    });
    el.appendChild(string);

    this.dom.appendChild(el);
    return el;
  }

  spawnBalloon() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createBalloonNode();

    this.balloons.push({
      el,
      x: Math.random() * w,
      y: h + Math.random() * 200, // start below screen
      vy: -0.5 - Math.random() * 1.5, // float upward
      vx: (Math.random() - 0.5) * 0.5, // gentle drift
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      wobbleAmount: 6 + Math.random() * 6
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.balloons.length < this.count) {
      this.spawnBalloon();
    }

    for (const b of this.balloons) {
      b.wobble += b.wobbleSpeed;
      b.x += b.vx + Math.sin(b.wobble) * 0.3;
      b.y += b.vy;

      if (b.x < -50) b.x = w + 50;
      if (b.x > w + 50) b.x = -50;

      if (b.y < -200) {
        b.y = h + 100;
        b.x = Math.random() * w;
      }

      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const b of this.balloons) b.el.remove();
    this.balloons = [];
  }
}


class Streamers extends EffectOverlay {
  constructor(count = 60, metadata = {}) {
    super(metadata);

    this.count = count;
    this.streamers = [];
  }

  createStreamerNode() {
    const el = document.createElement("div");

    const colors = [
      "rgba(255, 80, 80, 0.9)",
      "rgba(80, 180, 255, 0.9)",
      "rgba(255, 200, 80, 0.9)",
      "rgba(120, 255, 120, 0.9)",
      "rgba(255, 120, 255, 0.9)"
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const length = 40 + Math.random() * 40;

    Object.assign(el.style, {
      position: "absolute",
      width: "4px",
      height: length + "px",
      background: color,
      borderRadius: "2px",
      boxShadow: `0 0 8px ${color}`,
      pointerEvents: "none",
      userSelect: "none",
      transform: "translate(0px, 0px) rotate(0deg)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnStreamer() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createStreamerNode();

    this.streamers.push({
      el,
      x: Math.random() * w,
      y: -(Math.random() * h),
      vy: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.5,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.streamers.length < this.count) {
      this.spawnStreamer();
    }

    for (const s of this.streamers) {
      s.x += s.vx;
      s.y += s.vy;
      s.rot += s.rotSpeed;

      if (s.x < -50) s.x = w + 50;
      if (s.x > w + 50) s.x = -50;

      if (s.y > h + 50) {
        s.y = -40;
        s.x = Math.random() * w;
      }

      s.el.style.transform =
        `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const s of this.streamers) s.el.remove();
    this.streamers = [];
  }
}

class Sparkles extends EffectOverlay {
  constructor(count = 80, metadata = {}) {
    super(metadata);

    this.count = count;
    this.sparkles = [];
  }

  createSparkleNode() {
    const el = document.createElement("div");

    const size = 3 + Math.random() * 3;
    const color = `rgba(255,255,255,${0.6 + Math.random() * 0.4})`;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 8px ${color}`,
      pointerEvents: "none",
      userSelect: "none",
      transform: "translate(0px, 0px)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnSparkle() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createSparkleNode();

    this.sparkles.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.03
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.sparkles.length < this.count) {
      this.spawnSparkle();
    }

    for (const s of this.sparkles) {
      s.x += s.vx;
      s.y += s.vy;

      s.pulse += s.pulseSpeed;
      const scale = 0.8 + Math.sin(s.pulse) * 0.3;

      if (s.x < -20) s.x = w + 20;
      if (s.x > w + 20) s.x = -20;
      if (s.y < -20) s.y = h + 20;
      if (s.y > h + 20) s.y = -20;

      s.el.style.transform = `translate(${s.x}px, ${s.y}px) scale(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const s of this.sparkles) s.el.remove();
    this.sparkles = [];
  }
}

class PartyCelebration extends EffectOverlay {
  constructor(
    {
      balloonCount = 30,
      streamerCount = 50,
      confettiCount = 80,
      sparkleCount = 60
    } = {},
    metadata = {}
  ) {
    super(metadata);

    this.balloons = [];
    this.streamers = [];
    this.confetti = [];
    this.sparkles = [];

    this.counts = {
      balloonCount,
      streamerCount,
      confettiCount,
      sparkleCount
    };
  }

  createBalloon() {
    const el = document.createElement("div");

    const colors = [
      "rgba(255, 80, 80, 0.9)",
      "rgba(80, 180, 255, 0.9)",
      "rgba(255, 200, 80, 0.9)",
      "rgba(120, 255, 120, 0.9)",
      "rgba(255, 120, 255, 0.9)"
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 30 + Math.random() * 30;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size * 1.3 + "px",
      background: color,
      borderRadius: "50% 50% 45% 45%",
      boxShadow: `0 0 12px ${color}`,
      pointerEvents: "none",
      transform: "translate(0px, 0px)"
    });

    const string = document.createElement("div");
    Object.assign(string.style, {
      position: "absolute",
      bottom: "-20px",
      left: "50%",
      width: "2px",
      height: "20px",
      background: "rgba(255,255,255,0.6)",
      transform: "translateX(-50%)"
    });
    el.appendChild(string);

    this.dom.appendChild(el);
    return el;
  }

  spawnBalloon() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createBalloon();

    this.balloons.push({
      el,
      x: Math.random() * w,
      y: h + Math.random() * 200,
      vy: -0.5 - Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      wobbleAmount: 6 + Math.random() * 6
    });
  }

  createStreamer() {
    const el = document.createElement("div");

    const colors = [
      "rgba(255, 80, 80, 0.9)",
      "rgba(80, 180, 255, 0.9)",
      "rgba(255, 200, 80, 0.9)",
      "rgba(120, 255, 120, 0.9)",
      "rgba(255, 120, 255, 0.9)"
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const length = 40 + Math.random() * 40;

    Object.assign(el.style, {
      position: "absolute",
      width: "4px",
      height: length + "px",
      background: color,
      borderRadius: "2px",
      boxShadow: `0 0 8px ${color}`,
      pointerEvents: "none",
      transform: "translate(0px, 0px) rotate(0deg)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnStreamer() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createStreamer();

    this.streamers.push({
      el,
      x: Math.random() * w,
      y: -(Math.random() * h),
      vy: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.5,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 2
    });
  }

  createConfetti() {
    const el = document.createElement("div");

    const size = 10;
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `rgba(${r},${g},${b},0.6)`,
      pointerEvents: "none",
      transform: "translate(0px, 0px)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnConfetti() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createConfetti();

    this.confetti.push({
      el,
      x: Math.random() * w,
      y: -(Math.random() * h),
      vy: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.5
    });
  }

  createSparkle() {
    const el = document.createElement("div");

    const size = 3 + Math.random() * 3;
    const color = `rgba(255,255,255,${0.6 + Math.random() * 0.4})`;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 8px ${color}`,
      pointerEvents: "none",
      transform: "translate(0px, 0px)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnSparkle() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createSparkle();

    this.sparkles.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.03
    });
  }

  update() {
    console.log("UPDATE");
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Maintain counts
    while (this.balloons.length < this.counts.balloonCount) this.spawnBalloon();
    while (this.streamers.length < this.counts.streamerCount) this.spawnStreamer();
    while (this.confetti.length < this.counts.confettiCount) this.spawnConfetti();
    while (this.sparkles.length < this.counts.sparkleCount) this.spawnSparkle();

    // Balloons
    for (const b of this.balloons) {
      b.wobble += b.wobbleSpeed;
      b.x += b.vx + Math.sin(b.wobble) * 0.3;
      b.y += b.vy;

      if (b.x < -50) b.x = w + 50;
      if (b.x > w + 50) b.x = -50;
      if (b.y < -200) {
        b.y = h + 100;
        b.x = Math.random() * w;
      }

      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    }

    // Streamers
    for (const s of this.streamers) {
      s.x += s.vx;
      s.y += s.vy;
      s.rot += s.rotSpeed;

      if (s.x < -50) s.x = w + 50;
      if (s.x > w + 50) s.x = -50;
      if (s.y > h + 50) {
        s.y = -40;
        s.x = Math.random() * w;
      }

      s.el.style.transform =
        `translate(${s.x}px, ${s.y}px) rotate(${s.rot}deg)`;
    }

    // Confetti
    for (const c of this.confetti) {
      c.x += c.vx;
      c.y += c.vy;

      if (c.x < -50) c.x = w + 50;
      if (c.x > w + 50) c.x = -50;
      if (c.y > h + 50) {
        c.y = -40;
        c.x = Math.random() * w;
      }

      c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    }

    // Sparkles
    for (const s of this.sparkles) {
      s.x += s.vx;
      s.y += s.vy;

      s.pulse += s.pulseSpeed;
      const scale = 0.8 + Math.sin(s.pulse) * 0.3;

      if (s.x < -20) s.x = w + 20;
      if (s.x > w + 20) s.x = -20;
      if (s.y < -20) s.y = h + 20;
      if (s.y > h + 20) s.y = -20;

      s.el.style.transform =
        `translate(${s.x}px, ${s.y}px) scale(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();

    for (const arr of [this.balloons, this.streamers, this.confetti, this.sparkles]) {
      for (const item of arr) item.el.remove();
      arr.length = 0;
    }
  }
}

class Fireworks extends EffectOverlay {
  constructor({
    launcherRate = 0.02,   // probability per frame of launching a firework
    burstParticleCount = 40,
    sparkCount = 20
  } = {}, metadata = {}) {
    super(metadata);

    this.launcherRate = launcherRate;
    this.burstParticleCount = burstParticleCount;
    this.sparkCount = sparkCount;

    this.launchers = [];
    this.bursts = [];
    this.sparks = [];
  }

  // -------------------------
  // Utility
  // -------------------------
  randomColor() {
    const colors = [
      "255,80,80",
      "80,180,255",
      "255,200,80",
      "120,255,120",
      "255,120,255",
      "255,255,120"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // -------------------------
  // Launcher (rocket)
  // -------------------------
  createLauncher() {
    const el = document.createElement("div");

    Object.assign(el.style, {
      position: "absolute",
      width: "4px",
      height: "12px",
      background: "white",
      borderRadius: "2px",
      boxShadow: "0 0 6px white",
      pointerEvents: "none",
      transform: "translate(0px,0px)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnLauncher() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createLauncher();

    this.launchers.push({
      el,
      x: Math.random() * w,
      y: h + 20,
      vy: -6 - Math.random() * 4, // upward speed
      targetHeight: 100 + Math.random() * (h * 0.5)
    });
  }

  updateLaunchers() {
    for (let i = this.launchers.length - 1; i >= 0; i--) {
      const L = this.launchers[i];

      L.y += L.vy;

      // Reached explosion height
      if (L.y <= L.targetHeight) {
        this.explode(L.x, L.y);
        L.el.remove();
        this.launchers.splice(i, 1);
        continue;
      }

      L.el.style.transform = `translate(${L.x}px, ${L.y}px)`;
    }
  }

  // -------------------------
  // Explosion burst
  // -------------------------
  explode(x, y) {
    const color = this.randomColor();

    // Burst particles
    for (let i = 0; i < this.burstParticleCount; i++) {
      const el = document.createElement("div");

      Object.assign(el.style, {
        position: "absolute",
        width: "4px",
        height: "4px",
        borderRadius: "50%",
        background: `rgba(${color},1)`,
        boxShadow: `0 0 8px rgba(${color},1)`,
        pointerEvents: "none",
        transform: "translate(${x}px, ${y}px)"
      });

      this.dom.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      this.bursts.push({
        el,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        color
      });
    }

    // Sparks (small trailing particles)
    for (let i = 0; i < this.sparkCount; i++) {
      const el = document.createElement("div");

      Object.assign(el.style, {
        position: "absolute",
        width: "2px",
        height: "2px",
        borderRadius: "50%",
        background: `rgba(${color},0.8)`,
        boxShadow: `0 0 4px rgba(${color},1)`,
        pointerEvents: "none",
        transform: `translate(${x}px, ${y}px)`
      });

      this.dom.appendChild(el);

      this.sparks.push({
        el,
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        color
      });
    }
  }

  updateBursts() {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const B = this.bursts[i];

      B.x += B.vx;
      B.y += B.vy;
      B.vy += 0.05; // gravity
      B.life -= B.decay;

      if (B.life <= 0) {
        B.el.remove();
        this.bursts.splice(i, 1);
        continue;
      }

      B.el.style.opacity = B.life;
      B.el.style.transform = `translate(${B.x}px, ${B.y}px)`;
    }
  }

  updateSparks() {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const S = this.sparks[i];

      S.x += S.vx;
      S.y += S.vy;
      S.vy += 0.03;
      S.life -= S.decay;

      if (S.life <= 0) {
        S.el.remove();
        this.sparks.splice(i, 1);
        continue;
      }

      S.el.style.opacity = S.life;
      S.el.style.transform = `translate(${S.x}px, ${S.y}px)`;
    }
  }

  // -------------------------
  // Main update loop
  // -------------------------
  update() {
    // Random chance to launch a firework
    if (Math.random() < this.launcherRate) {
      this.spawnLauncher();
    }

    this.updateLaunchers();
    this.updateBursts();
    this.updateSparks();
  }

  onUnmount() {
    super.onUnmount();

    for (const arr of [this.launchers, this.bursts, this.sparks]) {
      for (const item of arr) item.el.remove();
      arr.length = 0;
    }
  }
}

class NewYearsEve extends EffectOverlay {
  constructor({
    launcherRate = 0.03,
    burstParticleCount = 50,
    sparkCount = 30,
    confettiCount = 120,
    sparkleCount = 80,
    flareCount = 20
  } = {}, metadata = {}) {
    super(metadata);

    this.launcherRate = launcherRate;
    this.burstParticleCount = burstParticleCount;
    this.sparkCount = sparkCount;

    this.confettiCount = confettiCount;
    this.sparkleCount = sparkleCount;
    this.flareCount = flareCount;

    this.launchers = [];
    this.bursts = [];
    this.sparks = [];
    this.confetti = [];
    this.sparkles = [];
    this.flares = [];
  }

  // -------------------------
  // Utility
  // -------------------------
  randomColor() {
    const colors = [
      "255,80,80",
      "80,180,255",
      "255,200,80",
      "120,255,120",
      "255,120,255",
      "255,255,120"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // -------------------------
  // Firework Launchers
  // -------------------------
  createLauncher() {
    const el = document.createElement("div");
    Object.assign(el.style, {
      position: "absolute",
      width: "4px",
      height: "12px",
      background: "white",
      borderRadius: "2px",
      boxShadow: "0 0 6px white",
      pointerEvents: "none"
    });
    this.dom.appendChild(el);
    return el;
  }

  spawnLauncher() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createLauncher();

    this.launchers.push({
      el,
      x: Math.random() * w,
      y: h + 20,
      vy: -6 - Math.random() * 4,
      targetHeight: 100 + Math.random() * (h * 0.5)
    });
  }

  updateLaunchers() {
    for (let i = this.launchers.length - 1; i >= 0; i--) {
      const L = this.launchers[i];
      L.y += L.vy;

      if (L.y <= L.targetHeight) {
        this.explode(L.x, L.y);
        L.el.remove();
        this.launchers.splice(i, 1);
        continue;
      }

      L.el.style.transform = `translate(${L.x}px, ${L.y}px)`;
    }
  }

  // -------------------------
  // Firework Explosion
  // -------------------------
  explode(x, y) {
    const color = this.randomColor();

    // Burst particles
    for (let i = 0; i < this.burstParticleCount; i++) {
      const el = document.createElement("div");
      Object.assign(el.style, {
        position: "absolute",
        width: "4px",
        height: "4px",
        borderRadius: "50%",
        background: `rgba(${color},1)`,
        boxShadow: `0 0 8px rgba(${color},1)`,
        pointerEvents: "none"
      });
      this.dom.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      this.bursts.push({
        el,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.02
      });
    }

    // Sparks
    for (let i = 0; i < this.sparkCount; i++) {
      const el = document.createElement("div");
      Object.assign(el.style, {
        position: "absolute",
        width: "2px",
        height: "2px",
        borderRadius: "50%",
        background: `rgba(${color},0.8)`,
        boxShadow: `0 0 4px rgba(${color},1)`,
        pointerEvents: "none"
      });
      this.dom.appendChild(el);

      this.sparks.push({
        el,
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  }

  updateBursts() {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const B = this.bursts[i];
      B.x += B.vx;
      B.y += B.vy;
      B.vy += 0.05;
      B.life -= B.decay;

      if (B.life <= 0) {
        B.el.remove();
        this.bursts.splice(i, 1);
        continue;
      }

      B.el.style.opacity = B.life;
      B.el.style.transform = `translate(${B.x}px, ${B.y}px)`;
    }
  }

  updateSparks() {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const S = this.sparks[i];
      S.x += S.vx;
      S.y += S.vy;
      S.vy += 0.03;
      S.life -= S.decay;

      if (S.life <= 0) {
        S.el.remove();
        this.sparks.splice(i, 1);
        continue;
      }

      S.el.style.opacity = S.life;
      S.el.style.transform = `translate(${S.x}px, ${S.y}px)`;
    }
  }

  // -------------------------
  // Confetti
  // -------------------------
  createConfetti() {
    const el = document.createElement("div");
    const size = 8 + Math.random() * 6;
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `rgba(${r},${g},${b},0.7)`,
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnConfetti() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createConfetti();

    this.confetti.push({
      el,
      x: Math.random() * w,
      y: -(Math.random() * h),
      vx: (Math.random() - 0.5) * 0.5,
      vy: 1 + Math.random() * 2
    });
  }

  updateConfetti() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.confetti.length < this.confettiCount) {
      this.spawnConfetti();
    }

    for (const C of this.confetti) {
      C.x += C.vx;
      C.y += C.vy;

      if (C.x < -50) C.x = w + 50;
      if (C.x > w + 50) C.x = -50;

      if (C.y > h + 50) {
        C.y = -40;
        C.x = Math.random() * w;
      }

      C.el.style.transform = `translate(${C.x}px, ${C.y}px)`;
    }
  }

  // -------------------------
  // Sparkles
  // -------------------------
  createSparkle() {
    const el = document.createElement("div");
    const size = 3 + Math.random() * 3;
    const color = `rgba(255,255,255,${0.6 + Math.random() * 0.4})`;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 8px ${color}`,
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnSparkle() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createSparkle();

    this.sparkles.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.03
    });
  }

  updateSparkles() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.sparkles.length < this.sparkleCount) {
      this.spawnSparkle();
    }

    for (const S of this.sparkles) {
      S.x += S.vx;
      S.y += S.vy;

      S.pulse += S.pulseSpeed;
      const scale = 0.8 + Math.sin(S.pulse) * 0.3;

      if (S.x < -20) S.x = w + 20;
      if (S.x > w + 20) S.x = -20;
      if (S.y < -20) S.y = h + 20;
      if (S.y > h + 20) S.y = -20;

      S.el.style.transform =
        `translate(${S.x}px, ${S.y}px) scale(${scale})`;
    }
  }

  // -------------------------
  // Golden Flares (ambient glow)
  // -------------------------
  createFlare() {
    const el = document.createElement("div");
    const size = 20 + Math.random() * 40;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "rgba(255,220,120,0.4)",
      boxShadow: "0 0 20px rgba(255,220,120,0.8)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnFlare() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createFlare();

    this.flares.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2
    });
  }

  updateFlares() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.flares.length < this.flareCount) {
      this.spawnFlare();
    }

    for (const F of this.flares) {
      F.x += F.vx;
      F.y += F.vy;

      if (F.x < -50) F.x = w + 50;
      if (F.x > w + 50) F.x = -50;
      if (F.y < -50) F.y = h + 50;
      if (F.y > h + 50) F.y = -50;

      F.el.style.transform = `translate(${F.x}px, ${F.y}px)`;
    }
  }

  // -------------------------
  // Main update loop
  // -------------------------
  update() {
    if (Math.random() < this.launcherRate) {
      this.spawnLauncher();
    }

    this.updateLaunchers();
    this.updateBursts();
    this.updateSparks();
    this.updateConfetti();
    this.updateSparkles();
    this.updateFlares();
  }

  onUnmount() {
    super.onUnmount();

    for (const arr of [
      this.launchers,
      this.bursts,
      this.sparks,
      this.confetti,
      this.sparkles,
      this.flares
    ]) {
      for (const item of arr) item.el.remove();
      arr.length = 0;
    }
  }
}


class Fire extends EffectOverlay {
  constructor({
    flameCount = 40,
    emberCount = 80,
    shimmer = true,
    flareRate = 0.005
  } = {}, metadata = {}) {
    super(metadata);

    this.flameCount = flameCount;
    this.emberCount = emberCount;
    this.shimmerEnabled = shimmer;
    this.flareRate = flareRate;

    this.flames = [];
    this.embers = [];
    this.flares = [];

    this.shimmerLayer = null;
  }

  // -------------------------
  // Flame tongues
  // -------------------------
  createFlame() {
    const el = document.createElement("div");

    const width = 20 + Math.random() * 30;
    const height = 40 + Math.random() * 60;

    const color = `rgba(255, ${120 + Math.random()*80}, 0, 0.8)`;

    Object.assign(el.style, {
      position: "absolute",
      width: width + "px",
      height: height + "px",
      bottom: "0px",
      left: Math.random() * window.innerWidth + "px",
      background: color,
      borderRadius: "50% 50% 0 0",
      filter: "blur(4px)",
      pointerEvents: "none",
      transform: "translateY(0px) scaleX(1)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnFlame() {
    const el = this.createFlame();

    this.flames.push({
      el,
      x: parseFloat(el.style.left),
      y: 0,
      height: parseFloat(el.style.height),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.05,
      flicker: 0,
      flickerSpeed: 0.1 + Math.random() * 0.1
    });
  }

  updateFlames() {
    const w = window.innerWidth;

    while (this.flames.length < this.flameCount) {
      this.spawnFlame();
    }

    for (const f of this.flames) {
      f.wobble += f.wobbleSpeed;
      f.flicker += f.flickerSpeed;

      const sway = Math.sin(f.wobble) * 10;
      const flickerScale = 0.9 + Math.sin(f.flicker) * 0.1;

      f.el.style.left = (f.x + sway) + "px";
      f.el.style.transform = `translateY(0px) scaleX(${flickerScale})`;

      // If flame drifts too far, reset
      if (f.x + sway < -100 || f.x + sway > w + 100) {
        f.el.remove();
        this.flames.splice(this.flames.indexOf(f), 1);
      }
    }
  }

  // -------------------------
  // Embers
  // -------------------------
  createEmber() {
    const el = document.createElement("div");

    const size = 3 + Math.random() * 3;
    const color = `rgba(255, ${100 + Math.random()*100}, 0, 0.9)`;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 8px ${color}`,
      pointerEvents: "none",
      transform: "translate(0px,0px)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnEmber() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createEmber();

    this.embers.push({
      el,
      x: Math.random() * w,
      y: h - 20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -1 - Math.random() * 1.5,
      life: 1,
      decay: 0.005 + Math.random() * 0.01
    });
  }

  updateEmbers() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.embers.length < this.emberCount) {
      this.spawnEmber();
    }

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];

      e.x += e.vx;
      e.y += e.vy;
      e.life -= e.decay;

      if (e.life <= 0 || e.y < -50) {
        e.el.remove();
        this.embers.splice(i, 1);
        continue;
      }

      e.el.style.opacity = e.life;
      e.el.style.transform = `translate(${e.x}px, ${e.y}px)`;
    }
  }

  // -------------------------
  // Heat shimmer
  // -------------------------
  createShimmerLayer() {
    const el = document.createElement("div");

    Object.assign(el.style, {
      position: "absolute",
      inset: "0",
      background: "transparent",
      backdropFilter: "blur(1px)",
      opacity: "0.4",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    this.shimmerLayer = el;
  }

  updateShimmer() {
    if (!this.shimmerEnabled) return;
    if (!this.shimmerLayer) this.createShimmerLayer();

    const distort = 0.9 + Math.sin(Date.now() * 0.002) * 0.1;
    this.shimmerLayer.style.transform = `scaleY(${distort})`;
  }

  // -------------------------
  // Flare pulses
  // -------------------------
  createFlare(x, y) {
    const el = document.createElement("div");

    Object.assign(el.style, {
      position: "absolute",
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      background: "rgba(255,200,80,0.6)",
      boxShadow: "0 0 40px rgba(255,200,80,1)",
      pointerEvents: "none",
      transform: `translate(${x}px, ${y}px) scale(1)`
    });

    this.dom.appendChild(el);

    this.flares.push({
      el,
      x,
      y,
      scale: 1,
      life: 1,
      decay: 0.02 + Math.random() * 0.02
    });
  }

  updateFlares() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (Math.random() < this.flareRate) {
      this.createFlare(
        Math.random() * w,
        h - 100 - Math.random() * 200
      );
    }

    for (let i = this.flares.length - 1; i >= 0; i--) {
      const F = this.flares[i];

      F.scale += 0.05;
      F.life -= F.decay;

      if (F.life <= 0) {
        F.el.remove();
        this.flares.splice(i, 1);
        continue;
      }

      F.el.style.opacity = F.life;
      F.el.style.transform =
        `translate(${F.x}px, ${F.y}px) scale(${F.scale})`;
    }
  }

  // -------------------------
  // Main update loop
  // -------------------------
  update() {
    this.updateFlames();
    this.updateEmbers();
    this.updateShimmer();
    this.updateFlares();
  }

  onUnmount() {
    super.onUnmount();

    for (const arr of [this.flames, this.embers, this.flares]) {
      for (const item of arr) item.el.remove();
      arr.length = 0;
    }

    if (this.shimmerLayer) {
      this.shimmerLayer.remove();
      this.shimmerLayer = null;
    }
  }
}

class Inferno extends EffectOverlay {
  constructor({
    flameCount = 40,
    emberCount = 80,
    ashCount = 60,
    smokeCount = 20,
    infernoChance = 0.002,   // chance per frame
    infernoDuration = 180    // frames (~3 seconds)
  } = {}, metadata = {}) {
    super(metadata);

    this.flameCount = flameCount;
    this.emberCount = emberCount;
    this.ashCount = ashCount;
    this.smokeCount = smokeCount;

    this.infernoChance = infernoChance;
    this.infernoDuration = infernoDuration;
    this.infernoTimer = 0;

    this.flames = [];
    this.embers = [];
    this.ash = [];
    this.smoke = [];

    this.edgeFlames = [];
  }

  // ------------------------------------------------------------
  // Utility
  // ------------------------------------------------------------
  randomColor() {
    const r = 255;
    const g = 100 + Math.random() * 120;
    const b = 0;
    return `rgba(${r},${g},${b},1)`;
  }

  // ------------------------------------------------------------
  // Burning Edges (top, left, right)
  // ------------------------------------------------------------
  createEdgeFlame(x, y) {
    const el = document.createElement("div");

    const size = 20 + Math.random() * 40;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      background: this.randomColor(),
      borderRadius: "50%",
      filter: "blur(8px)",
      pointerEvents: "none",
      transform: `translate(${x}px, ${y}px)`
    });

    this.dom.appendChild(el);

    this.edgeFlames.push({
      el,
      x,
      y,
      scale: 1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.05 + Math.random() * 0.05
    });
  }

  updateEdgeFlames() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Spawn around edges
    if (this.edgeFlames.length < 50) {
      // top edge
      this.createEdgeFlame(Math.random() * w, -20);

      // left edge
      this.createEdgeFlame(-20, Math.random() * h);

      // right edge
      this.createEdgeFlame(w + 20, Math.random() * h);
    }

    for (const f of this.edgeFlames) {
      f.pulse += f.pulseSpeed;
      const scale = 0.8 + Math.sin(f.pulse) * 0.3;

      f.el.style.transform =
        `translate(${f.x}px, ${f.y}px) scale(${scale})`;
    }
  }

  // ------------------------------------------------------------
  // Ash (falling)
  // ------------------------------------------------------------
  createAsh() {
    const el = document.createElement("div");

    const size = 2 + Math.random() * 3;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      background: "rgba(200,200,200,0.7)",
      borderRadius: "50%",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnAsh() {
    const w = window.innerWidth;

    const el = this.createAsh();

    this.ash.push({
      el,
      x: Math.random() * w,
      y: -20,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.5 + Math.random() * 1.2,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 1
    });
  }

  updateAsh() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.ash.length < this.ashCount) this.spawnAsh();

    for (let i = this.ash.length - 1; i >= 0; i--) {
      const a = this.ash[i];

      a.x += a.vx;
      a.y += a.vy;
      a.rot += a.rotSpeed;

      if (a.y > h + 20) {
        a.el.remove();
        this.ash.splice(i, 1);
        continue;
      }

      a.el.style.transform =
        `translate(${a.x}px, ${a.y}px) rotate(${a.rot}deg)`;
    }
  }

  // ------------------------------------------------------------
  // Smoke (slow drifting plumes)
  // ------------------------------------------------------------
  createSmoke() {
    const el = document.createElement("div");

    const size = 80 + Math.random() * 120;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "rgba(80,80,80,0.2)",
      filter: "blur(20px)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnSmoke() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createSmoke();

    this.smoke.push({
      el,
      x: Math.random() * w,
      y: h - 100,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -0.2 - Math.random() * 0.3,
      scale: 1,
      grow: 0.001 + Math.random() * 0.002
    });
  }

  updateSmoke() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.smoke.length < this.smokeCount) this.spawnSmoke();

    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const s = this.smoke[i];

      s.x += s.vx;
      s.y += s.vy;
      s.scale += s.grow;

      if (s.y < -200) {
        s.el.remove();
        this.smoke.splice(i, 1);
        continue;
      }

      s.el.style.transform =
        `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
    }
  }

  // ------------------------------------------------------------
  // Inferno Surges (big flame waves)
  // ------------------------------------------------------------
  triggerInferno() {
    this.infernoTimer = this.infernoDuration;

    // Make flames huge
    for (const f of this.flames) {
      f.el.style.transition = "transform 0.2s, opacity 0.2s";
      f.el.style.opacity = "1";
    }
  }

  updateInferno() {
    if (this.infernoTimer > 0) {
      this.infernoTimer--;

      const intensity = this.infernoTimer / this.infernoDuration;
      const scale = 1 + intensity * 2;

      for (const f of this.flames) {
        f.el.style.transform += ` scale(${scale})`;
      }

      if (this.infernoTimer === 0) {
        // Reset flame transitions
        for (const f of this.flames) {
          f.el.style.transition = "";
        }
      }
    } else if (Math.random() < this.infernoChance) {
      this.triggerInferno();
    }
  }

  // ------------------------------------------------------------
  // Flames + Embers (reuse from FireOverlay)
  // ------------------------------------------------------------
  createFlame() {
    const el = document.createElement("div");

    const width = 20 + Math.random() * 30;
    const height = 40 + Math.random() * 60;

    const color = this.randomColor();

    Object.assign(el.style, {
      position: "absolute",
      width: width + "px",
      height: height + "px",
      bottom: "0px",
      left: Math.random() * window.innerWidth + "px",
      background: color,
      borderRadius: "50% 50% 0 0",
      filter: "blur(4px)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnFlame() {
    const el = this.createFlame();

    this.flames.push({
      el,
      x: parseFloat(el.style.left),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.05,
      flicker: 0,
      flickerSpeed: 0.1 + Math.random() * 0.1
    });
  }

  updateFlames() {
    const w = window.innerWidth;

    while (this.flames.length < this.flameCount) this.spawnFlame();

    for (const f of this.flames) {
      f.wobble += f.wobbleSpeed;
      f.flicker += f.flickerSpeed;

      const sway = Math.sin(f.wobble) * 10;
      const flickerScale = 0.9 + Math.sin(f.flicker) * 0.1;

      f.el.style.left = (f.x + sway) + "px";
      f.el.style.transform = `scaleX(${flickerScale})`;

      if (f.x + sway < -100 || f.x + sway > w + 100) {
        f.el.remove();
        this.flames.splice(this.flames.indexOf(f), 1);
      }
    }
  }

  createEmber() {
    const el = document.createElement("div");

    const size = 3 + Math.random() * 3;
    const color = this.randomColor();

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 8px ${color}`,
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnEmber() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createEmber();

    this.embers.push({
      el,
      x: Math.random() * w,
      y: h - 20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -1 - Math.random() * 1.5,
      life: 1,
      decay: 0.005 + Math.random() * 0.01
    });
  }

  updateEmbers() {
    const h = window.innerHeight;

    while (this.embers.length < this.emberCount) this.spawnEmber();

    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];

      e.x += e.vx;
      e.y += e.vy;
      e.life -= e.decay;

      if (e.life <= 0 || e.y < -50) {
        e.el.remove();
        this.embers.splice(i, 1);
        continue;
      }

      e.el.style.opacity = e.life;
      e.el.style.transform = `translate(${e.x}px, ${e.y}px)`;
    }
  }

  // ------------------------------------------------------------
  // Main update loop
  // ------------------------------------------------------------
  update() {
    this.updateFlames();
    this.updateEmbers();
    this.updateAsh();
    this.updateSmoke();
    this.updateEdgeFlames();
    this.updateInferno();
  }

  onUnmount() {
    super.onUnmount();

    for (const arr of [
      this.flames,
      this.embers,
      this.ash,
      this.smoke,
      this.edgeFlames,
      this.flares
    ]) {
      for (const item of arr) item.el.remove();
      arr.length = 0;
    }
  }
}

class Bubbles extends EffectOverlay {
  constructor(count = 60, metadata = {}) {
    super(metadata);
    this.count = count;
    this.bubbles = [];
  }

  createBubble() {
    const el = document.createElement("div");
    const size = 10 + Math.random() * 30;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "rgba(180,220,255,0.3)",
      boxShadow: "0 0 10px rgba(180,220,255,0.6)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnBubble() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createBubble();

    this.bubbles.push({
      el,
      x: Math.random() * w,
      y: h + 20,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.5 - Math.random() * 1.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.bubbles.length < this.count) this.spawnBubble();

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];

      b.wobble += b.wobbleSpeed;
      b.x += b.vx + Math.sin(b.wobble) * 0.4;
      b.y += b.vy;

      if (b.y < -50) {
        b.el.remove();
        this.bubbles.splice(i, 1);
        continue;
      }

      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const b of this.bubbles) b.el.remove();
    this.bubbles = [];
  }
}

class Fireflies extends EffectOverlay {
  constructor(count = 50, metadata = {}) {
    super(metadata);
    this.count = count;
    this.fireflies = [];
  }

  createFirefly() {
    const el = document.createElement("div");
    const size = 3 + Math.random() * 3;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "rgba(255,255,180,0.8)",
      boxShadow: "0 0 8px rgba(255,255,180,1)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnFirefly() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createFirefly();

    this.fireflies.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.fireflies.length < this.count) this.spawnFirefly();

    for (const f of this.fireflies) {
      f.x += f.vx;
      f.y += f.vy;

      f.pulse += f.pulseSpeed;
      const scale = 0.7 + Math.sin(f.pulse) * 0.3;

      if (f.x < -20) f.x = w + 20;
      if (f.x > w + 20) f.x = -20;
      if (f.y < -20) f.y = h + 20;
      if (f.y > h + 20) f.y = -20;

      f.el.style.transform =
        `translate(${f.x}px, ${f.y}px) scale(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const f of this.fireflies) f.el.remove();
    this.fireflies = [];
  }
}

class Snow extends EffectOverlay {
  constructor(count = 120, metadata = {}) {
    super(metadata);
    this.count = count;
    this.flakes = [];
  }

  createFlake() {
    const el = document.createElement("div");
    const size = 3 + Math.random() * 5;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "white",
      opacity: "0.8",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnFlake() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createFlake();

    this.flakes.push({
      el,
      x: Math.random() * w,
      y: -(Math.random() * h),
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.5 + Math.random() * 1.2,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.flakes.length < this.count) this.spawnFlake();

    for (let i = this.flakes.length - 1; i >= 0; i--) {
      const f = this.flakes[i];

      f.sway += f.swaySpeed;
      f.x += f.vx + Math.sin(f.sway) * 0.4;
      f.y += f.vy;

      if (f.y > h + 20) {
        f.el.remove();
        this.flakes.splice(i, 1);
        continue;
      }

      f.el.style.transform = `translate(${f.x}px, ${f.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const f of this.flakes) f.el.remove();
    this.flakes = [];
  }
}

class FloatingHearts extends EffectOverlay {
  constructor(count = 40, metadata = {}) {
    super(metadata);
    this.count = count;
    this.hearts = [];
  }

  createHeart() {
    const el = document.createElement("div");

    const size = 12 + Math.random() * 20;
    const color = `hsl(${Math.random()*30 + 330}, 80%, 65%)`;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      background: color,
      transform: "rotate(45deg)",
      pointerEvents: "none",
      borderRadius: "50% 50% 0 0"
    });

    // Heart shape: two circles + rotated square
    const before = document.createElement("div");
    const after = document.createElement("div");

    for (const part of [before, after]) {
      Object.assign(part.style, {
        content: "",
        position: "absolute",
        width: size + "px",
        height: size + "px",
        background: color,
        borderRadius: "50%"
      });
      el.appendChild(part);
    }

    before.style.left = `-${size/2}px`;
    after.style.top = `-${size/2}px`;

    this.dom.appendChild(el);
    return el;
  }

  spawnHeart() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createHeart();

    this.hearts.push({
      el,
      x: Math.random() * w,
      y: h + 20,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.5 - Math.random() * 1.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.hearts.length < this.count) this.spawnHeart();

    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const hrt = this.hearts[i];

      hrt.wobble += hrt.wobbleSpeed;
      hrt.x += hrt.vx + Math.sin(hrt.wobble) * 0.4;
      hrt.y += hrt.vy;

      if (hrt.y < -50) {
        hrt.el.remove();
        this.hearts.splice(i, 1);
        continue;
      }

      hrt.el.style.transform = `translate(${hrt.x}px, ${hrt.y}px) rotate(45deg)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const h of this.hearts) h.el.remove();
    this.hearts = [];
  }
}

class Petals extends EffectOverlay {
  constructor(count = 60, metadata = {}) {
    super(metadata);
    this.count = count;
    this.petals = [];
  }

  createPetal() {
    const el = document.createElement("div");

    const size = 8 + Math.random() * 14;
    const color = `hsl(${330 + Math.random()*20}, 70%, ${70 + Math.random()*20}%)`;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size * 1.4 + "px",
      background: color,
      borderRadius: "60% 40% 60% 40%",
      pointerEvents: "none",
      transform: "translate(0px,0px) rotate(0deg)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnPetal() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createPetal();

    this.petals.push({
      el,
      x: Math.random() * w,
      y: -(Math.random() * h),
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.5 + Math.random() * 1.2,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.petals.length < this.count) this.spawnPetal();

    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];

      p.sway += p.swaySpeed;
      p.x += p.vx + Math.sin(p.sway) * 0.8;
      p.y += p.vy;
      p.rot += p.rotSpeed;

      if (p.y > h + 40) {
        p.el.remove();
        this.petals.splice(i, 1);
        continue;
      }

      p.el.style.transform =
        `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const p of this.petals) p.el.remove();
    this.petals = [];
  }
}

class PetalBurst extends EffectOverlay {
  constructor(burstSize = 40, autoRate = 0.01, metadata = {}) {
    super(metadata);
    this.burstSize = burstSize;
    this.autoRate = autoRate;
    this.petals = [];
  }

  createPetal() {
    const el = document.createElement("div");

    const size = 8 + Math.random() * 14;
    const color = `hsl(${330 + Math.random()*20}, 70%, ${70 + Math.random()*20}%)`;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size * 1.4 + "px",
      background: color,
      borderRadius: "60% 40% 60% 40%",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  burstAt(x, y) {
    for (let i = 0; i < this.burstSize; i++) {
      const el = this.createPetal();

      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;

      this.petals.push({
        el,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 3,
        gravity: 0.02 + Math.random() * 0.03
      });
    }
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (Math.random() < this.autoRate) {
      this.burstAt(Math.random() * w, Math.random() * h * 0.5);
    }

    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rot += p.rotSpeed;

      if (p.y > h + 40) {
        p.el.remove();
        this.petals.splice(i, 1);
        continue;
      }

      p.el.style.transform =
        `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const p of this.petals) p.el.remove();
    this.petals = [];
  }
}


class MagicSparkles extends EffectOverlay {
  constructor(count = 100, metadata = {}) {
    super(metadata);
    this.count = count;
    this.sparkles = [];
  }

  createSparkle() {
    const el = document.createElement("div");

    const size = 2 + Math.random() * 4;
    const hue = Math.random() * 360;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `hsl(${hue}, 80%, 70%)`,
      boxShadow: `0 0 8px hsl(${hue}, 80%, 70%)`,
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnSparkle() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createSparkle();

    this.sparkles.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.03
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.sparkles.length < this.count) this.spawnSparkle();

    for (const s of this.sparkles) {
      s.x += s.vx;
      s.y += s.vy;

      s.pulse += s.pulseSpeed;
      const scale = 0.7 + Math.sin(s.pulse) * 0.4;

      if (s.x < -20) s.x = w + 20;
      if (s.x > w + 20) s.x = -20;
      if (s.y < -20) s.y = h + 20;
      if (s.y > h + 20) s.y = -20;

      s.el.style.transform =
        `translate(${s.x}px, ${s.y}px) scale(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const s of this.sparkles) s.el.remove();
    this.sparkles = [];
  }
}

class PixelSnow extends EffectOverlay {
  constructor(count = 150, metadata = {}) {
    super(metadata);
    this.count = count;
    this.pixels = [];
  }

  createPixel() {
    const el = document.createElement("div");

    const size = 2 + Math.floor(Math.random() * 3);

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      background: "white",
      pointerEvents: "none",
      imageRendering: "pixelated"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnPixel() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createPixel();

    this.pixels.push({
      el,
      x: Math.random() * w,
      y: -(Math.random() * h),
      vy: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.2
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.pixels.length < this.count) this.spawnPixel();

    for (let i = this.pixels.length - 1; i >= 0; i--) {
      const p = this.pixels[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.y > h + 20) {
        p.el.remove();
        this.pixels.splice(i, 1);
        continue;
      }

      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const p of this.pixels) p.el.remove();
    this.pixels = [];
  }
}

class DustMotes extends EffectOverlay {
  constructor(count = 80, metadata = {}) {
    super(metadata);
    this.count = count;
    this.motes = [];
  }

  createMote() {
    const el = document.createElement("div");

    const size = 2 + Math.random() * 3;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.5)",
      filter: "blur(1px)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnMote() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createMote();

    this.motes.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      drift: Math.random() * Math.PI * 2,
      driftSpeed: 0.01 + Math.random() * 0.02
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.motes.length < this.count) this.spawnMote();

    for (const m of this.motes) {
      m.drift += m.driftSpeed;
      m.x += m.vx + Math.sin(m.drift) * 0.2;
      m.y += m.vy + Math.cos(m.drift) * 0.2;

      if (m.x < -20) m.x = w + 20;
      if (m.x > w + 20) m.x = -20;
      if (m.y < -20) m.y = h + 20;
      if (m.y > h + 20) m.y = -20;

      m.el.style.transform = `translate(${m.x}px, ${m.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const m of this.motes) m.el.remove();
    this.motes = [];
  }
}

class RainDropsOnGlass extends EffectOverlay {
  constructor(count = 80, metadata = {}) {
    super(metadata);
    this.count = count;
    this.drops = [];
  }

  createDrop() {
    const el = document.createElement("div");

    const size = 4 + Math.random() * 10;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size * 1.6 + "px",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.25)",
      backdropFilter: "blur(2px)",
      boxShadow: "0 0 6px rgba(255,255,255,0.4)",
      pointerEvents: "none",
      transform: "translate(0px,0px)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnDrop() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createDrop();

    this.drops.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vy: 0.1 + Math.random() * 0.4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.02
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.drops.length < this.count) this.spawnDrop();

    for (const d of this.drops) {
      d.wobble += d.wobbleSpeed;
      d.x += Math.sin(d.wobble) * 0.2;
      d.y += d.vy;

      if (d.y > h + 20) {
        d.y = -20;
        d.x = Math.random() * w;
      }

      d.el.style.transform = `translate(${d.x}px, ${d.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const d of this.drops) d.el.remove();
    this.drops = [];
  }
}

class StarTwinkle extends EffectOverlay {
  constructor(count = 120, metadata = {}) {
    super(metadata);
    this.count = count;
    this.stars = [];
  }

  createStar() {
    const el = document.createElement("div");

    const size = 1 + Math.random() * 2;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "white",
      opacity: "0.2",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnStar() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createStar();

    this.stars.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.03
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.stars.length < this.count) this.spawnStar();

    for (const s of this.stars) {
      s.pulse += s.pulseSpeed;
      const opacity = 0.2 + Math.sin(s.pulse) * 0.8;

      s.el.style.opacity = opacity;
      s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const s of this.stars) s.el.remove();
    this.stars = [];
  }
}

class GreenFog extends EffectOverlay {
  constructor(count = 20, metadata = {}) {
    super(metadata);
    this.count = count;
    this.fog = [];
  }

  createFog() {
    const el = document.createElement("div");

    const size = 150 + Math.random() * 200;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "rgba(0,255,120,0.15)",
      filter: "blur(40px)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnFog() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createFog();

    this.fog.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      scale: 1,
      grow: (Math.random() - 0.5) * 0.002
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.fog.length < this.count) this.spawnFog();

    for (const f of this.fog) {
      f.x += f.vx;
      f.y += f.vy;
      f.scale += f.grow;

      if (f.scale < 0.8) f.scale = 0.8;
      if (f.scale > 1.4) f.scale = 1.4;

      if (f.x < -200) f.x = w + 200;
      if (f.x > w + 200) f.x = -200;
      if (f.y < -200) f.y = h + 200;
      if (f.y > h + 200) f.y = -200;

      f.el.style.transform =
        `translate(${f.x}px, ${f.y}px) scale(${f.scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const f of this.fog) f.el.remove();
    this.fog = [];
  }
}

class LightningStorm extends EffectOverlay {
  constructor({
    cloudCount = 12,
    flashRate = 0.01
  } = {}, metadata = {}) {
    super(metadata);

    this.cloudCount = cloudCount;
    this.flashRate = flashRate;

    this.clouds = [];
    this.flashLayer = null;
  }

  createCloud() {
    const el = document.createElement("div");
    const size = 200 + Math.random() * 200;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size * 0.6 + "px",
      background: "rgba(80,80,80,0.4)",
      borderRadius: "50%",
      filter: "blur(20px)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnCloud() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createCloud();

    this.clouds.push({
      el,
      x: Math.random() * w,
      y: Math.random() * (h * 0.4),
      vx: (Math.random() - 0.5) * 0.2
    });
  }

  createFlashLayer() {
    const el = document.createElement("div");

    Object.assign(el.style, {
      position: "absolute",
      inset: "0",
      background: "rgba(255,255,255,0)",
      pointerEvents: "none",
      transition: "background 0.2s ease-out"
    });

    this.dom.appendChild(el);
    this.flashLayer = el;
  }

  triggerFlash() {
    if (!this.flashLayer) this.createFlashLayer();
    this.flashLayer.style.background = "rgba(255,255,255,0.8)";
    setTimeout(() => {
      this.flashLayer.style.background = "rgba(255,255,255,0)";
    }, 50);
  }

  update() {
    const w = window.innerWidth;

    while (this.clouds.length < this.cloudCount) this.spawnCloud();

    for (const c of this.clouds) {
      c.x += c.vx;

      if (c.x < -300) c.x = w + 300;
      if (c.x > w + 300) c.x = -300;

      c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    }

    if (Math.random() < this.flashRate) {
      this.triggerFlash();
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const c of this.clouds) c.el.remove();
    this.clouds = [];
    if (this.flashLayer) this.flashLayer.remove();
  }
}

class Sunbeam extends EffectOverlay {
  constructor(count = 8, metadata = {}) {
    super(metadata);
    this.count = count;
    this.beams = [];
  }

  createBeam() {
    const el = document.createElement("div");

    const width = 80 + Math.random() * 120;
    const height = window.innerHeight * 1.4;

    Object.assign(el.style, {
      position: "absolute",
      width: width + "px",
      height: height + "px",
      background: "rgba(255,255,200,0.12)",
      filter: "blur(20px)",
      transformOrigin: "top left",
      pointerEvents: "none",
      transform: `rotate(${20 + Math.random()*20}deg)`
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnBeam() {
    const w = window.innerWidth;

    const el = this.createBeam();

    this.beams.push({
      el,
      x: Math.random() * w,
      y: -200,
      vx: (Math.random() - 0.5) * 0.1
    });
  }

  update() {
    const w = window.innerWidth;

    while (this.beams.length < this.count) this.spawnBeam();

    for (const b of this.beams) {
      b.x += b.vx;

      if (b.x < -300) b.x = w + 300;
      if (b.x > w + 300) b.x = -300;

      b.el.style.transform =
        `translate(${b.x}px, ${b.y}px) ${b.el.style.transform.replace(/translate.*?\)/, "")}`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const b of this.beams) b.el.remove();
    this.beams = [];
  }
}

class MagicTrails extends EffectOverlay {
  constructor(metadata = {}) {
    super(metadata);
    this.trails = [];
    this._pointerHandler = null;
  }

  createParticle(x, y) {
    const el = document.createElement("div");

    const size = 3 + Math.random() * 4;
    const hue = Math.random() * 360;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `hsl(${hue},80%,70%)`,
      boxShadow: `0 0 8px hsl(${hue},80%,70%)`,
      pointerEvents: "none",
      opacity: "1",
      transform: `translate(${x}px, ${y}px)`
    });

    this.dom.appendChild(el);

    this.trails.push({
      el,
      x,
      y,
      vy: -0.2 - Math.random() * 0.4,
      life: 1,
      decay: 0.02 + Math.random() * 0.02
    });
  }

  onMount() {
    super.onMount();

    this._pointerHandler = (e) => {
      this.createParticle(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", this._pointerHandler);
  }

  update() {
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const p = this.trails[i];

      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        p.el.remove();
        this.trails.splice(i, 1);
        continue;
      }

      p.el.style.opacity = p.life;
      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    }
  }

  onUnmount() {
    super.onUnmount();
    window.removeEventListener("pointermove", this._pointerHandler);
    for (const p of this.trails) p.el.remove();
    this.trails = [];
  }
}

class UnderwaterCaustics extends EffectOverlay {
  constructor(count = 12, metadata = {}) {
    super(metadata);
    this.count = count;
    this.caustics = [];
  }

  createCaustic() {
    const el = document.createElement("div");

    const size = 200 + Math.random() * 200;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: "rgba(120,200,255,0.15)",
      filter: "blur(30px)",
      mixBlendMode: "screen",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnCaustic() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createCaustic();

    this.caustics.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.caustics.length < this.count) this.spawnCaustic();

    for (const c of this.caustics) {
      c.pulse += c.pulseSpeed;
      const scale = 0.9 + Math.sin(c.pulse) * 0.3;

      c.el.style.transform =
        `translate(${c.x}px, ${c.y}px) scale(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const c of this.caustics) c.el.remove();
    this.caustics = [];
  }
}

class Aurora extends EffectOverlay {
  constructor(count = 6, metadata = {}) {
    super(metadata);
    this.count = count;
    this.ribbons = [];
  }

  createRibbon() {
    const el = document.createElement("div");

    const width = window.innerWidth * (0.6 + Math.random() * 0.6);
    const height = 120 + Math.random() * 200;
    const hue = 120 + Math.random() * 120; // greens & blues

    Object.assign(el.style, {
      position: "absolute",
      width: width + "px",
      height: height + "px",
      background: `linear-gradient(
        to bottom,
        hsla(${hue}, 80%, 70%, 0.4),
        hsla(${hue + 40}, 80%, 60%, 0.2),
        transparent
      )`,
      filter: "blur(40px)",
      pointerEvents: "none",
      transform: "translate(0px,0px)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnRibbon() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createRibbon();

    this.ribbons.push({
      el,
      x: Math.random() * w,
      y: Math.random() * (h * 0.5),
      vx: (Math.random() - 0.5) * 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02
    });
  }

  update() {
    const w = window.innerWidth;

    while (this.ribbons.length < this.count) this.spawnRibbon();

    for (const r of this.ribbons) {
      r.x += r.vx;
      r.pulse += r.pulseSpeed;

      const scale = 0.9 + Math.sin(r.pulse) * 0.2;

      if (r.x < -500) r.x = w + 500;
      if (r.x > w + 500) r.x = -500;

      r.el.style.transform =
        `translate(${r.x}px, ${r.y}px) scaleY(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const r of this.ribbons) r.el.remove();
    this.ribbons = [];
  }
}

class WarpSpeed extends EffectOverlay {
  constructor(count = 200, metadata = {}) {
    super(metadata);
    this.count = count;
    this.stars = [];
  }

  createStar() {
    const el = document.createElement("div");

    Object.assign(el.style, {
      position: "absolute",
      width: "2px",
      height: "2px",
      background: "white",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnStar() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createStar();

    this.stars.push({
      el,
      x: w / 2,
      y: h / 2,
      angle: Math.random() * Math.PI * 2,
      speed: 1 + Math.random() * 4,
      dist: 0
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.stars.length < this.count) this.spawnStar();

    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];

      s.dist += s.speed;

      const x = w / 2 + Math.cos(s.angle) * s.dist;
      const y = h / 2 + Math.sin(s.angle) * s.dist;

      if (x < -50 || x > w + 50 || y < -50 || y > h + 50) {
        s.el.remove();
        this.stars.splice(i, 1);
        continue;
      }

      const scale = 1 + s.dist * 0.01;

      s.el.style.transform =
        `translate(${x}px, ${y}px) scale(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const s of this.stars) s.el.remove();
    this.stars = [];
  }
}

class LavaGlow extends EffectOverlay {
  constructor(count = 20, metadata = {}) {
    super(metadata);
    this.count = count;
    this.blobs = [];
  }

  createBlob() {
    const el = document.createElement("div");

    const size = 120 + Math.random() * 200;
    const hue = 10 + Math.random() * 40;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `radial-gradient(
        circle,
        hsla(${hue}, 90%, 60%, 0.8),
        hsla(${hue}, 90%, 40%, 0.4),
        transparent
      )`,
      filter: "blur(20px)",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnBlob() {
    //const w = window.innerWidth;
    //const h = window.innerHeight;
    const rect = this.dom.getBoundingClientRect();
 
    const w = rect.width;
    const h = rect.height;
    
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const fullWidth = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth
    );


    if (tracedebug) console.log("RECT", window.innerWidth, window.innerHeight, w, h, document.body.scrollWidth, document.body.scrollHeight, document.documentElement.scrollWidth, document.documentElement.scrollHeight, fullWidth, fullHeight);

    const el = this.createBlob();

    this.blobs.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.blobs.length < this.count) this.spawnBlob();

    for (const b of this.blobs) {
      b.x += b.vx;
      b.y += b.vy;
      b.pulse += b.pulseSpeed;

      const scale = 0.9 + Math.sin(b.pulse) * 0.3;

      if (b.x < -200) b.x = w + 200;
      if (b.x > w + 200) b.x = -200;
      if (b.y < -200) b.y = h + 200;
      if (b.y > h + 200) b.y = -200;

      b.el.style.transform =
        `translate(${b.x}px, ${b.y}px) scale(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const b of this.blobs) b.el.remove();
    this.blobs = [];
  }
}

class Rainbow extends EffectOverlay {
  constructor(count = 5, metadata = {}) {
    super(metadata);
    this.count = count;
    this.arcs = [];
  }

  createArc() {
    const el = document.createElement("div");

    const size = 300 + Math.random() * 400;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `
        conic-gradient(
          red, orange, yellow, green, cyan, blue, violet, red
        )
      `,
      filter: "blur(40px)",
      opacity: "0.25",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnArc() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createArc();

    this.arcs.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02
    });
  }

  update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.arcs.length < this.count) this.spawnArc();

    for (const a of this.arcs) {
      a.pulse += a.pulseSpeed;
      const scale = 0.9 + Math.sin(a.pulse) * 0.1;

      a.el.style.transform =
        `translate(${a.x}px, ${a.y}px) scale(${scale})`;
    }
  }

  onUnmount() {
    super.onUnmount();
    for (const a of this.arcs) a.el.remove();
    this.arcs = [];
  }
}

class RainbowUnicornMagic extends EffectOverlay {
  constructor({
    rainbowCount = 4,
    sparkleCount = 80,
    unicornCount = 6,
    fartRate = 0.02
  } = {}, metadata = {}) {
    super(metadata);

    this.rainbowCount = rainbowCount;
    this.sparkleCount = sparkleCount;
    this.unicornCount = unicornCount;
    this.fartRate = fartRate;

    this.rainbows = [];
    this.sparkles = [];
    this.unicorns = [];
    this.farts = [];
  }

  // ------------------------------------------------------------
  // Rainbow arcs
  // ------------------------------------------------------------
  createRainbow() {
    const el = document.createElement("div");

    const size = 300 + Math.random() * 400;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `
        conic-gradient(
          red, orange, yellow, green, cyan, blue, violet, red
        )
      `,
      filter: "blur(40px)",
      opacity: "0.25",
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnRainbow() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createRainbow();

    this.rainbows.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h * 0.6,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.02
    });
  }

  updateRainbows() {
    while (this.rainbows.length < this.rainbowCount) this.spawnRainbow();

    for (const r of this.rainbows) {
      r.pulse += r.pulseSpeed;
      const scale = 0.9 + Math.sin(r.pulse) * 0.1;

      r.el.style.transform =
        `translate(${r.x}px, ${r.y}px) scale(${scale})`;
    }
  }

  // ------------------------------------------------------------
  // Magic sparkles (ambient)
  // ------------------------------------------------------------
  createSparkle() {
    const el = document.createElement("div");

    const size = 2 + Math.random() * 4;
    const hue = Math.random() * 360;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `hsl(${hue},80%,70%)`,
      boxShadow: `0 0 8px hsl(${hue},80%,70%)`,
      pointerEvents: "none"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnSparkle() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createSparkle();

    this.sparkles.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.03 + Math.random() * 0.03
    });
  }

  updateSparkles() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.sparkles.length < this.sparkleCount) this.spawnSparkle();

    for (const s of this.sparkles) {
      s.x += s.vx;
      s.y += s.vy;

      s.pulse += s.pulseSpeed;
      const scale = 0.7 + Math.sin(s.pulse) * 0.4;

      if (s.x < -20) s.x = w + 20;
      if (s.x > w + 20) s.x = -20;
      if (s.y < -20) s.y = h + 20;
      if (s.y > h + 20) s.y = -20;

      s.el.style.transform =
        `translate(${s.x}px, ${s.y}px) scale(${scale})`;
    }
  }

  // ------------------------------------------------------------
  // Unicorns (floating emoji)
  // ------------------------------------------------------------
  createUnicorn() {
    const el = document.createElement("div");
    el.textContent = "🦄";

    Object.assign(el.style, {
      position: "absolute",
      fontSize: "48px",
      pointerEvents: "none",
      transform: "translate(0px,0px)"
    });

    this.dom.appendChild(el);
    return el;
  }

  spawnUnicorn() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const el = this.createUnicorn();

    this.unicorns.push({
      el,
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03
    });
  }

  updateUnicorns() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    while (this.unicorns.length < this.unicornCount) this.spawnUnicorn();

    for (const u of this.unicorns) {
      u.wobble += u.wobbleSpeed;

      u.x += u.vx + Math.sin(u.wobble) * 0.4;
      u.y += u.vy + Math.cos(u.wobble) * 0.4;

      if (u.x < -50) u.x = w + 50;
      if (u.x > w + 50) u.x = -50;
      if (u.y < -50) u.y = h + 50;
      if (u.y > h + 50) u.y = -50;

      u.el.style.transform = `translate(${u.x}px, ${u.y}px)`;

      // Unicorn farting sparkles
      if (Math.random() < this.fartRate) {
        this.spawnFart(u.x, u.y + 20);
      }
    }
  }

  // ------------------------------------------------------------
  // Fart sparkles (trail behind unicorns)
  // ------------------------------------------------------------
  spawnFart(x, y) {
    const el = document.createElement("div");

    const size = 3 + Math.random() * 4;
    const hue = Math.random() * 360;

    Object.assign(el.style, {
      position: "absolute",
      width: size + "px",
      height: size + "px",
      borderRadius: "50%",
      background: `hsl(${hue},80%,70%)`,
      boxShadow: `0 0 8px hsl(${hue},80%,70%)`,
      pointerEvents: "none",
      opacity: "1",
      transform: `translate(${x}px, ${y}px)`
    });

    this.dom.appendChild(el);

    this.farts.push({
      el,
      x,
      y,
      vy: -0.2 - Math.random() * 0.4,
      life: 1,
      decay: 0.02 + Math.random() * 0.03
    });
  }

  updateFarts() {
    for (let i = this.farts.length - 1; i >= 0; i--) {
      const f = this.farts[i];

      f.y += f.vy;
      f.life -= f.decay;

      if (f.life <= 0) {
        f.el.remove();
        this.farts.splice(i, 1);
        continue;
      }

      f.el.style.opacity = f.life;
      f.el.style.transform = `translate(${f.x}px, ${f.y}px)`;
    }
  }

  // ------------------------------------------------------------
  // Main update loop
  // ------------------------------------------------------------
  update() {
    this.updateRainbows();
    this.updateSparkles();
    this.updateUnicorns();
    this.updateFarts();
  }

  onUnmount() {
    super.onUnmount();

    for (const arr of [
      this.rainbows,
      this.sparkles,
      this.unicorns,
      this.farts
    ]) {
      for (const item of arr) item.el.remove();
      arr.length = 0;
    }
  }
}
