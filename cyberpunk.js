// cyberpunk.js
// Vanilla JS micro "framework" for Cyberpunk UI

const CyberUI = (() => {
  const SELECTORS = {
    btn: ".cp-btn",
    modalBackdrop: ".cp-modal-backdrop",
    modal: ".cp-modal",
    toastStack: ".cp-toast-stack",
    toggle: "[data-theme-toggle]",
    modalOpen: "[data-modal-open]",
    modalClose: "[data-modal-close]",
  };

  let toastContainer = null;

  // -----------------
  // Retro SFX (Web Audio)
  // -----------------
  let sfx = null;

  function createSfx() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();

    function playTone({ frequency = 440, type = 'sine', duration = 0.12, gain = 0.15, attack = 0.005, decay = 0.08 } = {}) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(gain, now + attack);
      g.gain.exponentialRampToValueAtTime(0.001, now + duration + decay);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + decay + 0.02);
    }

    function playClick() {
      // short high click
      playTone({ frequency: 1200, type: 'square', duration: 0.04, gain: 0.06, attack: 0.002, decay: 0.02 });
    }

    function playSuccess() {
      // short ascending arpeggio
      playTone({ frequency: 660, type: 'sine', duration: 0.09, gain: 0.07 });
      setTimeout(() => playTone({ frequency: 880, type: 'sine', duration: 0.09, gain: 0.06 }), 80);
      setTimeout(() => playTone({ frequency: 990, type: 'sine', duration: 0.12, gain: 0.05 }), 160);
    }

    function playError() {
      // low buzzy tone
      playTone({ frequency: 140, type: 'sawtooth', duration: 0.22, gain: 0.18, attack: 0.01, decay: 0.08 });
      setTimeout(() => playTone({ frequency: 110, type: 'sawtooth', duration: 0.18, gain: 0.12 }), 80);
    }

    function playOpen() {
      playTone({ frequency: 420, type: 'triangle', duration: 0.14, gain: 0.08 });
      setTimeout(() => playTone({ frequency: 520, type: 'triangle', duration: 0.12, gain: 0.06 }), 70);
    }

    function playClose() {
      playTone({ frequency: 280, type: 'triangle', duration: 0.12, gain: 0.07 });
    }

    function playHover() {
      // subtle, short tick for hover/focus
      playTone({ frequency: 640, type: 'sine', duration: 0.045, gain: 0.045, attack: 0.002, decay: 0.02 });
    }

    // throttle repeated keypress sounds to avoid overwhelming audio
    let _lastKeyTime = 0;
    function playKeypress() {
      const now = ctx.currentTime || (Date.now() / 1000);
      if (now - _lastKeyTime < 0.03) return; // ignore very fast repeats
      _lastKeyTime = now;

      // quick high click (articulation)
      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1200 + (Math.random() * 200 - 100), now);
      g1.gain.setValueAtTime(0, now);
      g1.gain.linearRampToValueAtTime(0.06, now + 0.001);
      g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc1.connect(g1);

      // low body for depth
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(160 + (Math.random() * 40 - 20), now);
      g2.gain.setValueAtTime(0, now);
      g2.gain.linearRampToValueAtTime(0.03, now + 0.002);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc2.connect(g2);

      // short filtered noise to emulate mechanical click
      const bufferSize = Math.floor(ctx.sampleRate * 0.03);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.03, now);
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);

      // mix to destination
      g1.connect(ctx.destination);
      g2.connect(ctx.destination);
      noiseGain.connect(ctx.destination);

      osc1.start(now); osc1.stop(now + 0.035);
      osc2.start(now); osc2.stop(now + 0.05);
      noise.start(now); noise.stop(now + 0.03);

      // schedule gain ramps stop (cleanup will be handled by GC, explicit disconnect optional)
      setTimeout(() => {
        try { osc1.disconnect(); g1.disconnect(); osc2.disconnect(); g2.disconnect(); noise.disconnect(); noiseFilter.disconnect(); noiseGain.disconnect(); } catch (e) {}
      }, 200);
    }

    return {
      play(name) {
        // resume context on user gesture if suspended
        if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
          ctx.resume().catch(() => {});
        }
        switch (name) {
          case 'click': return playClick();
          case 'hover': return playHover();
          case 'keypress': return playKeypress();
          case 'success': return playSuccess();
          case 'error': return playError();
          case 'open': return playOpen();
          case 'close': return playClose();
          default: return null;
        }
      },
      _ctx: ctx,
    };
  }

  // -----------------
  // Button ripple
  // -----------------
  function initButtons() {
    document.querySelectorAll(SELECTORS.btn).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (sfx) sfx.play('click');
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "cp-ripple";

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        btn.appendChild(ripple);
        ripple.addEventListener("animationend", () => {
          ripple.remove();
        });
      });

      // hover and focus sound
      btn.addEventListener('mouseenter', (e) => {
        try { if (!btn.disabled && sfx) sfx.play('hover'); } catch (e) {}
      });
      btn.addEventListener('focus', (e) => {
        try { if (!btn.disabled && sfx) sfx.play('hover'); } catch (e) {}
      });
    });
  }

// =====================================================
// SFX: global listeners and audio-unlock helper
// =====================================================

  // Unlock WebAudio on first user gesture (some browsers suspend the context)
  function unlockAudioOnGesture() {
    function unlock() {
      try {
        if (sfx && sfx._ctx && sfx._ctx.state === 'suspended') {
          sfx._ctx.resume().catch(() => {});
        }
      } catch (e) {}
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    }

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  // Attach hover/focus/key handlers across the UI for consistent SFX
  function initSfxListeners() {
    // hover/focus targets: links, navbar buttons, toggles, form controls
    const hoverSelectors = 'a, .cp-navbar__link, .cp-btn, [data-theme-toggle], .cp-toggle, .cp-toggle__thumb';
    document.querySelectorAll(hoverSelectors).forEach((el) => {
      // don't attach to non-interactive anchors without href
      el.addEventListener('mouseenter', () => {
        try { if (sfx) sfx.play('hover'); } catch (e) {}
      });
      el.addEventListener('focus', () => {
        try { if (sfx) sfx.play('hover'); } catch (e) {}
      });
    });

    // keypress sound for inputs / textareas
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      el.addEventListener('keydown', (e) => {
        // avoid playing for modifier keys
        if (e.key && e.key.length === 1) {
          try { if (sfx) sfx.play('keypress'); } catch (e) {}
        }
      });
    });

    // toast close buttons - play a light click when closing
    document.addEventListener('click', (e) => {
      const c = e.target.closest && e.target.closest('.cp-toast__close');
      if (c) { try { if (sfx) sfx.play('click'); } catch (e) {} }
    });
  }


  // -----------------
  // Modals
  // -----------------
  function openModal(id) {
    const backdrop = document.querySelector(`${SELECTORS.modalBackdrop}[data-modal="${id}"]`);
    if (!backdrop) return;
    if (sfx) sfx.play('open');
    backdrop.classList.add("is-open");
  }

  function closeModal(el) {
    const backdrop =
      el.closest(SELECTORS.modalBackdrop) ||
      document.querySelector(`${SELECTORS.modalBackdrop}[data-modal="${el.getAttribute("data-modal-close")}"]`);
    if (!backdrop) return;
    if (sfx) sfx.play('close');
    backdrop.classList.remove("is-open");
  }

  function initModals() {
    // Openers
    document.querySelectorAll(SELECTORS.modalOpen).forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const id = trigger.getAttribute("data-modal-open");
        if (id) openModal(id);
      });
    });

    // Closers (button or backdrop click)
    document.querySelectorAll(SELECTORS.modalClose).forEach((closer) => {
      closer.addEventListener("click", () => closeModal(closer));
    });

    document.querySelectorAll(SELECTORS.modalBackdrop).forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        // Close only if clicking outside modal content
        if (e.target === backdrop) {
          backdrop.classList.remove("is-open");
        }
      });
    });

    // ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(SELECTORS.modalBackdrop + ".is-open").forEach((b) => {
          b.classList.remove("is-open");
        });
      }
    });
  }

  // -----------------
  // Toasts
  // -----------------
  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.querySelector(SELECTORS.toastStack);
      if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.className = "cp-toast-stack";
        document.body.appendChild(toastContainer);
      }
    }
  }

  function toast(message, options = {}) {
    ensureToastContainer();

    const { variant = "default", timeout = 3000 } = options;
    const toast = document.createElement("div");

    const classes = ["cp-toast"];
    if (variant === "success") classes.push("cp-toast--success");
    if (variant === "error") classes.push("cp-toast--error");
    toast.className = classes.join(" ");

    toast.innerHTML = `
      <div class="cp-toast__message">${message}</div>
      <button class="cp-toast__close" aria-label="Close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // play SFX for success/error
    if (sfx) {
      if (variant === 'success') sfx.play('success');
      if (variant === 'error') sfx.play('error');
    }

    const closeBtn = toast.querySelector(".cp-toast__close");
    const close = () => {
      toast.classList.add("is-hiding");
      toast.addEventListener("animationend", () => toast.remove());
    };

    closeBtn.addEventListener("click", close);
    if (timeout > 0) {
      setTimeout(close, timeout);
    }
  }

  // -----------------
  // Theme toggle
  // -----------------
  function initThemeToggle() {
    const toggles = document.querySelectorAll(SELECTORS.toggle);
    if (!toggles.length) return;

    const root = document.documentElement;
    const currentTheme = root.getAttribute("data-theme") || "default";

    toggles.forEach((t) => {
      if (currentTheme !== "default") {
        t.setAttribute("data-state", "on");
      }
      t.addEventListener("click", () => {
        const isOn = t.getAttribute("data-state") === "on";
        const nextTheme = isOn ? "default" : "magenta";
        t.setAttribute("data-state", isOn ? "off" : "on");
        if (nextTheme === "default") {
          root.removeAttribute("data-theme");
        } else {
          root.setAttribute("data-theme", nextTheme);
        }
        if (sfx) sfx.play('click');
      });
    });
  }

  // -----------------
  // -----------------
  // Hex / Binary Viewer
  // -----------------

  function _toUint8Array(data) {
    if (!data) return new Uint8Array();
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (Array.isArray(data)) return new Uint8Array(data);
    if (typeof data === 'string') return new TextEncoder().encode(data);
    return new Uint8Array();
  }

  function _padHex(n, width = 8) {
    return n.toString(16).toUpperCase().padStart(width, '0');
  }

  function renderHex(container, data) {
    const el = (typeof container === 'string') ? document.querySelector(container) : container;
    if (!el) return;
    const bytes = _toUint8Array(data);
    el.classList.add('cp-hex');
    el.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'cp-hex__toolbar';
    toolbar.innerHTML = `<div class="cp-hex__title">Hex Viewer</div><div><button class="cp-hex__copy">Copy</button></div>`;
    el.appendChild(toolbar);

    const table = document.createElement('div');
    table.className = 'cp-hex__table';

    const bytesPerLine = 16;
    for (let offset = 0; offset < bytes.length; offset += bytesPerLine) {
      const lineBytes = bytes.slice(offset, offset + bytesPerLine);
      const line = document.createElement('div');
      line.className = 'cp-hex__line';

      const off = document.createElement('div');
      off.className = 'cp-hex__offset';
      off.textContent = _padHex(offset, 8);

      const b = document.createElement('div');
      b.className = 'cp-hex__bytes';
      // group bytes into pairs for readability
      const groups = [];
      for (let i = 0; i < lineBytes.length; i++) {
        groups.push(lineBytes[i].toString(16).padStart(2, '0').toUpperCase());
      }
      // format groups with spaces and an extra gap every 8 bytes
      let formatted = '';
      for (let i = 0; i < groups.length; i++) {
        formatted += groups[i] + (i === groups.length - 1 ? '' : ' ');
        if ((i + 1) % 8 === 0) formatted += '  ';
      }
      b.textContent = formatted;

      const a = document.createElement('div');
      a.className = 'cp-hex__ascii';
      let ascii = '';
      for (let i = 0; i < lineBytes.length; i++) {
        const v = lineBytes[i];
        ascii += (v >= 32 && v <= 126) ? String.fromCharCode(v) : '.';
      }
      a.textContent = ascii;

      line.appendChild(off);
      line.appendChild(b);
      line.appendChild(a);
      table.appendChild(line);
    }

    el.appendChild(table);

    // copy handler
    const copyBtn = toolbar.querySelector('.cp-hex__copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          // copy full hex dump (offset + hex + ascii) as text
          let out = '';
          table.querySelectorAll('.cp-hex__line').forEach((ln) => {
            const off = ln.querySelector('.cp-hex__offset').textContent;
            const hb = ln.querySelector('.cp-hex__bytes').textContent;
            const asc = ln.querySelector('.cp-hex__ascii').textContent;
            out += `${off}  ${hb}  ${asc}\n`;
          });
          await navigator.clipboard.writeText(out);
          if (sfx) sfx.play('success');
        } catch (e) {
          if (sfx) sfx.play('error');
        }
      });
    }
  }

  // -----------------
  // Network Topology Graph (lightweight SVG renderer + simple force)
  // -----------------

  function _createSvg(ns = 'http://www.w3.org/2000/svg') {
    return document.createElementNS(ns, 'svg');
  }

  function renderNetGraph(container, topology = {}, opts = {}) {
    const el = (typeof container === 'string') ? document.querySelector(container) : container;
    if (!el) return;
    el.classList.add('cp-netgraph');
    el.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'cp-netgraph__header';
    header.innerHTML = `<div class="cp-netgraph__title">Network Topology</div><div class="cp-netgraph__legend"><div class="dot dot--node"></div><div style="font-size:12px;color:var(--cp-foreground);">Node</div><div class="dot dot--router"></div><div style="font-size:12px;color:var(--cp-foreground);">Router</div><div class="dot dot--server"></div><div style="font-size:12px;color:var(--cp-foreground);">Server</div></div>`;
    el.appendChild(header);

    const canvas = document.createElement('div');
    canvas.className = 'cp-netgraph__canvas';
    el.appendChild(canvas);

    const svg = _createSvg();
    svg.setAttribute('viewBox', '0 0 800 360');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    canvas.appendChild(svg);

    // simple layout: place nodes in circle or by provided coords
    const nodes = (topology.nodes || []).map((n, i) => {
      return Object.assign({ id: n.id || `n${i}`, label: n.label || n.id || `Node ${i}`, x: n.x, y: n.y, type: n.type || 'node' }, n);
    });
    const edges = (topology.edges || []).map((e) => Object.assign({}, e));

    const W = 800; const H = 360;
    const centerX = W / 2; const centerY = H / 2;
    const radius = Math.min(centerX, centerY) - 60;

    nodes.forEach((n, i) => {
      if (typeof n.x === 'undefined' || typeof n.y === 'undefined') {
        const a = (i / nodes.length) * Math.PI * 2;
        n.x = Math.round(centerX + Math.cos(a) * radius);
        n.y = Math.round(centerY + Math.sin(a) * radius);
      }
    });

    // draw edges
    edges.forEach((e) => {
      const a = nodes.find((n) => n.id === e.source) || nodes[e.source] || nodes[0];
      const b = nodes.find((n) => n.id === e.target) || nodes[e.target] || nodes[1] || nodes[0];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', a.x);
      line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x);
      line.setAttribute('y2', b.y);
      line.setAttribute('stroke', 'rgba(255,255,255,0.06)');
      line.setAttribute('stroke-width', '1.1');
      svg.appendChild(line);
      e._el = line;
    });

    // draw nodes
    nodes.forEach((n) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.classList.add('cp-netgraph__node');
      g.setAttribute('transform', `translate(${n.x},${n.y})`);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.classList.add('cp-netgraph__node-circle');
      circle.setAttribute('r', 12);
      const fill = (n.type === 'server') ? 'var(--cp-green)' : (n.type === 'router') ? 'var(--cp-magenta)' : 'var(--cp-cyan)';
      circle.setAttribute('fill', fill);
      circle.setAttribute('stroke', 'rgba(255,255,255,0.06)');
      circle.setAttribute('stroke-width', '1');

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.classList.add('cp-netgraph__node-label');
      label.setAttribute('x', 18);
      label.setAttribute('y', 5);
      label.textContent = n.label;

      g.appendChild(circle);
      g.appendChild(label);

      // hover tooltip via title
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${n.label} (${n.type})`;
      g.appendChild(title);

      svg.appendChild(g);
      n._el = g;
      n._circle = circle;
    });

    // animate packets: periodically create a small circle that moves along an edge
    function spawnPacket(edge) {
      const start = nodes.find((n) => n.id === edge.source);
      const end = nodes.find((n) => n.id === edge.target);
      if (!start || !end) return;
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      p.setAttribute('r', 4);
      p.setAttribute('fill', 'var(--cp-amber)');
      svg.appendChild(p);
      const duration = 900 + Math.random() * 800;
      const t0 = performance.now();
      function step(t) {
        const u = Math.min(1, (t - t0) / duration);
        const x = start.x + (end.x - start.x) * u;
        const y = start.y + (end.y - start.y) * u;
        p.setAttribute('cx', x);
        p.setAttribute('cy', y);
        if (u < 1) requestAnimationFrame(step);
        else { p.remove(); }
      }
      requestAnimationFrame(step);
    }

    // simple packet emitter
    const emitInterval = (opts.emitInterval || 1400);
    let emitTimer = setInterval(() => {
      if (!edges.length) return;
      const e = edges[Math.floor(Math.random() * edges.length)];
      spawnPacket(e);
      if (sfx) sfx.play('click');
    }, emitInterval);

    // cleanup return handle
    return {
      destroy() {
        clearInterval(emitTimer);
        if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
      }
    };
  }

  // -----------------
  // Init
  // -----------------
  function init() {
    // Initialize SFX first (non-blocking). If WebAudio isn't available, sfx will be null.
    try { sfx = createSfx(); } catch (e) { sfx = null; }
    initButtons();
    initModals();
    initThemeToggle();
    // attach broader SFX listeners and unlock audio on first gesture
    initSfxListeners();
    unlockAudioOnGesture();
  }

  return {
    init,
    toast,
    openModal,
    sfx: {
      play: (name) => sfx && sfx.play(name),
    },
    hexViewer: {
      render: (el, data) => {
        const container = (typeof el === 'string') ? document.querySelector(el) : el;
        if (!container) return;
        try { renderHex(container, data); } catch (e) { console.warn('hex render failed', e); }
      }
    },
    netGraph: {
      render: (el, topology, opts) => {
        const container = (typeof el === 'string') ? document.querySelector(el) : el;
        if (!container) return null;
        try { return renderNetGraph(container, topology, opts); } catch (e) { console.warn('netgraph failed', e); return null; }
      }
    },
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  CyberUI.init();
});
