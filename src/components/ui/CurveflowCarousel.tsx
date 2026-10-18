'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import styles from './CurveflowCarousel.module.css';

/* ---------------------------------------------------------------- Framer WebGL Shaders */
const PLATE_VERTEX = `
attribute vec2 aCorner;
uniform vec4 uBox;
uniform vec2 uView;
varying vec2 vPx;
void main() {
  vPx = mix(uBox.xy, uBox.zw, aCorner);
  vec2 c = vPx / uView * 2.0 - 1.0;
  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
}
`;

const CARD_FRAGMENT = `
precision highp float;
varying vec2 vPx;
uniform vec2 uView;
uniform float uDpr;
uniform vec4 uCard;
uniform float uMid;
uniform float uFlat;
uniform float uFlare;
uniform float uCorner;
uniform float uAlpha;
uniform float uShift;
uniform float uFringe;
uniform vec4 uRimOut;
uniform vec4 uRimIn;
uniform sampler2D uImg;
uniform vec2 uImgSize;
uniform float uHasImage;

void main() {
  float hw = uView.x * 0.5;
  float span = max(1.0 - uFlat, 0.001);
  float t = clamp((abs(vPx.x - hw) / hw - uFlat) / span, 0.0, 2.0);
  float k = 1.0 + uFlare * (1.0 - cos(t * 1.5707963));
  float live = step(0.0001, t) * step(t, 1.9999);
  float dk = uFlare * 1.5707963 * sin(t * 1.5707963) * live / (hw * span);
  float slope = uCard.w * 0.5 * dk;
  float squash = k / sqrt(1.0 + slope * slope);

  vec2 local = vec2(vPx.x - uCard.x, uMid + (vPx.y - uMid) / k - uCard.y);
  vec2 hs = uCard.zw * 0.5;
  float r = min(uCorner, min(hs.x, hs.y));
  vec2 past = abs(local - hs) - hs + r;
  float outsideD = length(max(past, vec2(0.0)));
  float insideD = min(max(past.x, past.y), 0.0);
  float edgeDist = outsideD + insideD - r;
  float onScreen = edgeDist * (past.y > past.x ? squash : 1.0);
  float a = clamp(0.5 - onScreen * uDpr, 0.0, 1.0) * uAlpha;
  if (a < 0.003) discard;

  // Base card surface: clean, warm white card
  vec3 baseCard = vec3(0.995, 0.992, 0.990);
  vec3 col = baseCard;

  if (uHasImage > 0.5) {
    vec2 st = local / uCard.zw;
    float boxR = uCard.z / uCard.w;
    float imgR = uImgSize.x / max(uImgSize.y, 1.0);

    // Padding inset (0.85 scale to ensure full artwork with elegant margin)
    vec2 insetSt = (st - 0.5) * 1.15 + 0.5;

    // Contain aspect ratio math
    vec2 containScale = boxR > imgR ? vec2(boxR / imgR, 1.0) : vec2(1.0, imgR / boxR);
    vec2 uv = (insetSt - 0.5) * containScale + 0.5;

    if (uv.x >= 0.001 && uv.x <= 0.999 && uv.y >= 0.001 && uv.y <= 0.999) {
      vec4 tex = texture2D(uImg, uv);
      if (uShift > 0.0002) {
        vec2 nudge = vec2(uShift, 0.0);
        vec4 ahead = texture2D(uImg, clamp(uv + nudge, 0.001, 0.999));
        vec4 behind = texture2D(uImg, clamp(uv - nudge, 0.001, 0.999));
        tex.rgb = vec3(ahead.r, tex.g, behind.b);
      }
      // Blend image alpha cleanly over the white card surface (ideal for transparent logos and posters)
      col = mix(baseCard, tex.rgb, tex.a);
    }
  }

  // Edge rim glow (signature Framer Curveflow curve fringe)
  float rim = min(local.y, uCard.w - local.y) * squash;
  float weight = smoothstep(0.0, 0.4, t) * uFringe;
  float outer = 1.0 - smoothstep(2.4, 3.6, rim);
  float inner = smoothstep(2.6, 3.8, rim) * (1.0 - smoothstep(5.0, 6.4, rim));
  col = mix(col, uRimIn.rgb, clamp(inner * weight * uRimIn.a, 0.0, 1.0));
  col = mix(col, uRimOut.rgb, clamp(outer * weight * uRimOut.a, 0.0, 1.0));

  gl_FragColor = vec4(col * a, a);
}
`;

/* ---------------------------------------------------------------- Utilities */
const clampTo = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const wrap = (v: number, m: number) => ((v % m) + m) % m;
const QUARTER_TURN = Math.PI / 2;

function swellAt(x: number, view: number, flat: number, flare: number) {
  const hw = view * 0.5;
  const reach = Math.abs(x - hw) / hw;
  const t = clampTo((reach - flat) / Math.max(1 - flat, 0.001), 0, 2);
  return 1 + flare * (1 - Math.cos(t * QUARTER_TURN));
}

const MAX_SIDE = 2048;
function shrink(img: HTMLImageElement): HTMLImageElement | HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const big = Math.max(w, h);
  if (big <= MAX_SIDE) return img;
  const f = MAX_SIDE / big;
  const c = document.createElement('canvas');
  c.width = Math.round(w * f);
  c.height = Math.round(h * f);
  const g = c.getContext('2d');
  if (!g) return img;
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/**
 * Fetch image with dual-layer fallback:
 * 1. Fetch as Blob + createImageBitmap / ObjectURL (bypasses browser canvas CORS taint)
 * 2. Standard HTMLImageElement with crossOrigin = 'anonymous'
 */
async function fetchImage(url: string): Promise<{ source: any; w: number; h: number } | null> {
  if (!url) return null;

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      if (typeof createImageBitmap !== 'undefined') {
        try {
          const bitmap = await createImageBitmap(blob);
          return { source: bitmap, w: bitmap.width, h: bitmap.height };
        } catch {}
      }
      return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (!img.naturalWidth) return resolve(null);
          resolve({ source: shrink(img), w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
        img.src = objectUrl;
      });
    }
  } catch {}

  // Fallback direct Image
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 12000);
    img.onload = () => {
      clearTimeout(timer);
      if (!img.naturalWidth) return resolve(null);
      resolve({ source: shrink(img), w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

function makeShader(gl: WebGLRenderingContext, vsText: string, fsText: string) {
  const part = (type: number, text: string) => {
    const s = gl.createShader(type);
    if (!s) throw new Error('shader');
    gl.shaderSource(s, text);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(log || 'compile');
    }
    return s;
  };
  const vs = part(gl.VERTEX_SHADER, vsText);
  const fs = part(gl.FRAGMENT_SHADER, fsText);
  const program = gl.createProgram();
  if (!program) throw new Error('program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'link');
  const book: Record<string, WebGLUniformLocation | null> = {};
  return {
    program,
    corner: gl.getAttribLocation(program, 'aCorner'),
    spot: (name: string) => {
      if (!(name in book)) book[name] = gl.getUniformLocation(program, name);
      return book[name];
    },
  };
}

/* ---------------------------------------------------------------- Framer RibbonEngine */
class FramerCurveflowEngine {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  items: { url: string; category?: string }[];
  opts: any;
  gl: WebGLRenderingContext;
  cardShader: any;
  corners: WebGLBuffer;
  textures: WebGLTexture[] = [];
  texSize: { w: number; h: number }[] = [];
  natural: number[] = [];
  hasImage: boolean[] = [];
  viewW = 1;
  viewH = 1;
  dpr = 1;
  cardH = 1;
  widths: number[] = [];
  starts: number[] = [];
  setLen = 1;
  loopLen = 1;
  margin = 0;
  pos = 0;
  vel = 0;
  glideTo: { from: number; to: number; begin: number; length: number } | null = null;
  held = false;
  pressX = 0;
  pressPos = 0;
  travelled = 0;
  trail: { t: number; x: number }[] = [];
  lastShown = 0;
  flex = 0;
  clock = 0;
  revealAt = -1;
  ranks = new Map<number, number>();
  rankCount = 0;
  cursor = { x: 0, y: 0, over: false };
  hovering = false;
  raf = 0;
  lastNow = 0;
  alive = true;
  ready = false;
  sizer: ResizeObserver | null = null;
  offs: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, items: { url: string; category?: string }[], opts: any) {
    this.canvas = canvas;
    this.host = host;
    this.items = items;
    this.opts = opts;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, depth: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
    this.cardShader = makeShader(gl, PLATE_VERTEX, CARD_FRAGMENT);

    const buf = gl.createBuffer();
    if (!buf) throw new Error('buffer error');
    this.corners = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

    // Initial placeholder textures for all cards
    items.forEach(() => {
      this.textures.push(this.blank());
      this.texSize.push({ w: 720, h: 1000 });
      this.natural.push(opts.frame.ratio || 0.72);
      this.hasImage.push(false);
    });

    this.listen();
    this.resize();

    // Mark ready immediately so placeholders and animation are visible from frame 1
    this.layout();
    this.placeFirst();
    this.ready = true;
    this.beginReveal();
    this.schedule();

    // Now asynchronously load images and stream into textures
    this.loadAll();
  }

  blank() {
    const gl = this.gl;
    const t = gl.createTexture();
    if (!t) throw new Error('texture');
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([248, 246, 244, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  upload(i: number, source: any) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.hasImage[i] = true;
      return true;
    } catch {
      return false;
    }
  }

  loadAll() {
    this.items.forEach((item, i) => {
      fetchImage(item.url).then((pic) => {
        if (!this.alive || !pic) return;
        if (!this.upload(i, pic.source)) return;
        this.texSize[i] = { w: pic.w, h: pic.h };
        this.natural[i] = clampTo(pic.w / pic.h, 0.3, 3.2);
        this.layout();
        this.schedule();
      });
    });
  }

  mid() {
    return this.viewH * 0.5 + (this.opts.frame.offset / 100) * this.viewH;
  }

  shape() {
    const c = this.opts.curve;
    return {
      flat: clampTo(c.flatPct / 100, 0, 0.95) * (1 - 0.2 * this.flex),
      flare: Math.max(0, c.edgeScale - 1) * (1 + 0.7 * this.flex),
    };
  }

  layout() {
    const f = this.opts.frame;
    this.cardH = Math.max(40, Math.min((f.heightPct / 100) * this.viewH, f.heightCap));
    const fixed = clampTo(f.ratio, 0.3, 3.2);
    this.widths = this.items.map((_, i) => (f.fit === 'natural' ? this.natural[i] : fixed) * this.cardH);
    this.starts = [];
    let run = 0;
    this.widths.forEach((w) => {
      this.starts.push(run);
      run += w + f.spacing;
    });
    this.setLen = Math.max(1, run);
    const widest = Math.max(1, ...this.widths);
    const copies = Math.max(2, Math.ceil((this.viewW * 2 + widest * 2) / this.setLen));
    this.loopLen = copies * this.setLen;
    this.margin = (this.loopLen - this.viewW) / 2;
  }

  leftOf(base: number, shown: number) {
    return wrap(base + shown + this.margin, this.loopLen) - this.margin;
  }

  placeFirst() {
    const f = this.opts.frame;
    const at = f.centreSmall && this.viewW < 700 ? 0.5 : clampTo(f.anchor, 0, 100) / 100;
    this.pos = at * this.viewW - (this.starts[0] + this.widths[0] / 2);
    this.vel = 0;
    this.glideTo = null;
    this.lastShown = this.pos;
  }

  seats(shown: number) {
    const out: { key: number; slot: number; left: number; width: number }[] = [];
    const copies = Math.round(this.loopLen / this.setLen);
    const n = this.items.length;
    for (let c = 0; c < copies; c++) {
      for (let i = 0; i < n; i++) {
        const left = this.leftOf(c * this.setLen + this.starts[i], shown);
        const width = this.widths[i];
        if (left > this.viewW + 60 || left + width < -60) continue;
        out.push({ key: c * n + i, slot: i, left, width });
      }
    }
    return out;
  }

  pick(x: number, y: number, list: { left: number; width: number; slot: number }[]) {
    const s = this.shape();
    const k = swellAt(x, this.viewW, s.flat, s.flare);
    const mid = this.mid();
    const yy = mid + (y - mid) / k;
    if (Math.abs(yy - mid) > this.cardH / 2) return null;
    for (const seat of list) {
      if (x >= seat.left && x <= seat.left + seat.width) return seat;
    }
    return null;
  }

  resize() {
    const box = this.host.getBoundingClientRect();
    const firstFrac = this.widths.length ? (this.leftOf(this.starts[0], this.pos) + this.widths[0] / 2) / this.viewW : null;
    this.viewW = Math.max(1, box.width);
    this.viewH = Math.max(1, box.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
    if (!this.items.length) return;
    this.layout();
    if (firstFrac !== null) {
      this.pos = firstFrac * this.viewW - this.widths[0] / 2 - this.starts[0];
      this.vel = 0;
      this.glideTo = null;
      this.lastShown = this.pos;
    }
    this.schedule();
  }

  beginReveal() {
    this.revealAt = this.clock;
    const order = this.seats(this.pos).sort((a, b) => a.left - b.left);
    this.ranks.clear();
    order.forEach((s, i) => this.ranks.set(s.key, i));
    this.rankCount = order.length;
    this.lastShown = this.pos;
  }

  progress(rank: number) {
    const r = this.opts.reveal;
    if (this.revealAt < 0) return 1;
    const staggered = rank * r.gap;
    return clampTo((this.clock - this.revealAt - r.wait - staggered) / Math.max(0.05, r.time), 0, 1);
  }

  paint(list: { key: number; slot: number; left: number; width: number }[], shown: number) {
    const gl = this.gl;
    const o = this.opts;

    // Clean light background (#FDFCFC)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.992, 0.988, 0.988, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corners);

    const mid = this.mid();
    const cs = this.cardShader;
    const s = this.shape();

    gl.useProgram(cs.program);
    gl.enableVertexAttribArray(cs.corner);
    gl.vertexAttribPointer(cs.corner, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(cs.spot('uView'), this.viewW, this.viewH);
    gl.uniform1f(cs.spot('uDpr'), this.dpr);
    gl.uniform1f(cs.spot('uMid'), mid);
    gl.uniform1f(cs.spot('uFlat'), s.flat);
    gl.uniform1f(cs.spot('uFlare'), s.flare);
    gl.uniform1f(cs.spot('uCorner'), Math.max(0, o.frame.corner));
    gl.uniform1f(cs.spot('uShift'), this.flex * 0.006 * Math.max(0, o.curve.split));
    gl.uniform1f(cs.spot('uFringe'), clampTo(o.curve.fringe, 0, 1));
    gl.uniform4fv(cs.spot('uRimOut'), [0.63, 0.77, 0.96, 0.55]); // Sky blue rim
    gl.uniform4fv(cs.spot('uRimIn'), [0.96, 0.78, 0.57, 0.45]);  // Warm amber rim
    gl.uniform1i(cs.spot('uImg'), 0);
    gl.activeTexture(gl.TEXTURE0);

    for (const seat of list) {
      const rank = this.ranks.has(seat.key) ? this.ranks.get(seat.key)! : this.rankCount;
      const p = this.progress(rank);
      let alpha = 1;
      let lift = 0;
      let grow = 1;
      if (p < 1) {
        const e = 1 - Math.pow(1 - p, 3);
        lift = (1 - e) * this.cardH * 0.55;
        grow = 0.9 + 0.1 * e;
        alpha = clampTo(p * 2.4, 0, 1);
      }
      if (alpha <= 0.002) continue;

      const w = seat.width * grow;
      const h = this.cardH * grow;
      const cx = seat.left + seat.width / 2;
      const left = cx - w / 2;
      const top = mid + lift - h / 2;
      const kMax = Math.max(swellAt(left, this.viewW, s.flat, s.flare), swellAt(left + w, this.viewW, s.flat, s.flare));
      const above = top - mid;
      const beneath = top + h - mid;

      gl.uniform4f(cs.spot('uBox'), left - 2, mid + Math.min(above, above * kMax) - 3, left + w + 2, mid + Math.max(beneath, beneath * kMax) + 3);
      gl.uniform4f(cs.spot('uCard'), left, top, w, h);
      gl.uniform1f(cs.spot('uAlpha'), alpha);
      gl.uniform1f(cs.spot('uHasImage'), this.hasImage[seat.slot] ? 1.0 : 0.0);
      const size = this.texSize[seat.slot] || { w: 720, h: 1000 };
      gl.uniform2f(cs.spot('uImgSize'), size.w, size.h);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[seat.slot]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  local(e: PointerEvent | MouseEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  aim(target: number) {
    this.glideTo = { from: this.pos, to: target, begin: performance.now(), length: 0.7 };
    this.vel = 0;
    this.schedule();
  }

  step(direction: number) {
    const stepSize = this.widths.reduce((a, b) => a + b, 0) / (this.widths.length || 1) + this.opts.frame.spacing;
    const from = this.glideTo ? this.glideTo.to : this.pos;
    this.aim(from + direction * stepSize);
  }

  listen() {
    const c = this.canvas;
    const on = (target: any, type: string, fn: any, opt?: any) => {
      target.addEventListener(type, fn, opt);
      this.offs.push(() => target.removeEventListener(type, fn, opt));
    };

    on(c, 'pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const p = this.local(e);
      this.held = true;
      this.glideTo = null;
      this.vel = 0;
      this.pressX = p.x;
      this.pressPos = this.pos;
      this.travelled = 0;
      this.trail = [{ t: performance.now(), x: p.x }];
      this.cursor = { x: p.x, y: p.y, over: true };
      try {
        c.setPointerCapture(e.pointerId);
      } catch {}
      c.style.cursor = 'grabbing';
      this.schedule();
    });

    on(c, 'pointermove', (e: PointerEvent) => {
      const p = this.local(e);
      this.cursor = { x: p.x, y: p.y, over: true };
      if (this.held) {
        const dx = p.x - this.pressX;
        this.travelled = Math.max(this.travelled, Math.abs(dx));
        this.pos = this.pressPos + dx * this.opts.drive.drag;
        const t = performance.now();
        this.trail.push({ t, x: p.x });
        while (this.trail.length > 2 && t - this.trail[0].t > 100) this.trail.shift();
      }
      this.schedule();
    });

    const letGo = (e: PointerEvent) => {
      if (!this.held) return;
      this.held = false;
      try {
        c.releasePointerCapture(e.pointerId);
      } catch {}
      const d = this.opts.drive;
      if (this.travelled > 6) {
        const first = this.trail[0];
        const last = this.trail[this.trail.length - 1];
        const stale = performance.now() - last.t > 80;
        const span = (last.t - first.t) / 1000;
        this.vel = stale || span <= 0 ? 0 : clampTo(((last.x - first.x) / span) * d.drag, -5000, 5000);
      } else if (e.type !== 'pointercancel') {
        const p = this.local(e);
        const seat = this.pick(p.x, p.y, this.seats(this.lastShown));
        if (seat) {
          const delta = this.viewW / 2 - (seat.left + seat.width / 2);
          this.aim(this.pos + delta);
        }
      }
      this.trail = [];
      this.schedule();
    };

    on(c, 'pointerup', letGo);
    on(c, 'pointercancel', letGo);
    on(c, 'pointerleave', () => {
      this.cursor.over = false;
      if (!this.held) c.style.cursor = 'grab';
      this.schedule();
    });

    on(c, 'wheel', (e: WheelEvent) => {
      e.preventDefault();
      const amount = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * this.opts.drive.wheelGain;
      this.glideTo = null;
      this.vel = clampTo(this.vel - amount * 8, -4200, 4200);
      this.schedule();
    }, { passive: false });

    on(c, 'keydown', (e: KeyboardEvent) => {
      const dir = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      this.step(dir);
    });

    if (typeof ResizeObserver !== 'undefined') {
      this.sizer = new ResizeObserver(() => this.resize());
      this.sizer.observe(this.host);
    }
  }

  frame = (now: number) => {
    this.raf = 0;
    if (!this.alive) return;
    const o = this.opts;
    const dt = this.lastNow ? clampTo((now - this.lastNow) / 1000, 0.001, 0.05) : 1 / 60;
    this.lastNow = now;
    this.clock += dt;
    let busy = false;

    if (this.held) {
      busy = true;
    } else if (this.glideTo) {
      const g = this.glideTo;
      const k = clampTo((now - g.begin) / (g.length * 1000), 0, 1);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.pos = g.from + (g.to - g.from) * e;
      if (k >= 1) this.glideTo = null;
      busy = true;
    } else if (this.vel !== 0) {
      this.pos += this.vel * dt;
      this.vel *= Math.exp(-dt / Math.max(0.05, o.drive.glide));
      if (Math.abs(this.vel) < 4) this.vel = 0;
      busy = true;
    }

    if (Math.abs(this.pos) > this.loopLen * 4) {
      const jump = this.pos - wrap(this.pos, this.loopLen);
      this.pos -= jump;
      this.pressPos -= jump;
      this.lastShown -= jump;
      if (this.glideTo) {
        this.glideTo.from -= jump;
        this.glideTo.to -= jump;
      }
    }

    const shown = this.pos;
    const speed = (shown - this.lastShown) / dt;
    this.lastShown = shown;
    const want = clampTo(Math.abs(speed) / 2400, 0, 1) * o.curve.speedFlare;
    this.flex += (want - this.flex) * (1 - Math.exp(-dt * 8));
    if (Math.abs(this.flex - want) >= 0.002) busy = true;

    const list = this.ready ? this.seats(shown) : [];
    const over = this.cursor.over && !this.held ? this.pick(this.cursor.x, this.cursor.y, list) : null;
    this.hovering = !!over;
    if (!this.held) this.canvas.style.cursor = over ? 'pointer' : 'grab';

    this.paint(list, shown);

    if (busy) this.raf = requestAnimationFrame(this.frame);
  };

  schedule() {
    if (this.raf || !this.alive) return;
    this.lastNow = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.alive = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.offs.forEach((off) => off());
    this.offs = [];
    if (this.sizer) this.sizer.disconnect();
    const gl = this.gl;
    this.textures.forEach((t) => gl.deleteTexture(t));
    gl.deleteBuffer(this.corners);
    gl.deleteProgram(this.cardShader.program);
  }
}

/* ---------------------------------------------------------------- React Component */
export interface CurveflowCarouselProps {
  items: {
    id: string;
    imageUrl?: string;
    driveId?: string;
    category?: string;
  }[];
  activeCategory: string;
}

const BATCH_SIZE = 24;

export default function CurveflowCarousel({ items, activeCategory }: CurveflowCarouselProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FramerCurveflowEngine | null>(null);

  const [batchIndex, setBatchIndex] = useState(0);
  const totalItems = items.length;
  const totalBatches = Math.max(1, Math.ceil(totalItems / BATCH_SIZE));

  useEffect(() => {
    setBatchIndex(0);
  }, [activeCategory]);

  const batchSlice = useMemo(() => {
    const start = batchIndex * BATCH_SIZE;
    const slice = items.slice(start, start + BATCH_SIZE);
    return slice.map((item) => {
      let url = item.imageUrl || '';
      if (item.driveId) {
        url = `https://lh3.googleusercontent.com/d/${item.driveId}=w1000`;
      }
      return { url, category: item.category };
    });
  }, [items, batchIndex]);

  const opts = useMemo(() => {
    const isLogos = activeCategory === 'Logos';
    return {
      frame: {
        heightPct: isLogos ? 44 : 56,
        heightCap: isLogos ? 360 : 520,
        fit: 'natural',
        ratio: isLogos ? 1.0 : 0.72,
        spacing: 22,
        corner: 18,
        anchor: 50,
        offset: 0,
        centreSmall: true,
      },
      curve: {
        flatPct: 45,
        edgeScale: 1.92,
        speedFlare: 1,
        fringe: 0.8,
        split: 1.0,
      },
      drive: {
        drag: 1.2,
        glide: 0.42,
        wheelGain: 1,
      },
      reveal: {
        time: 0.85,
        gap: 0.06,
        wait: 0.1,
      },
    };
  }, [activeCategory]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || batchSlice.length === 0) return;

    let engine: FramerCurveflowEngine | null = null;
    try {
      engine = new FramerCurveflowEngine(canvas, host, batchSlice, opts);
      engineRef.current = engine;
    } catch (err) {
      console.error('Curveflow WebGL engine error:', err);
    }

    return () => {
      if (engine) engine.destroy();
      engineRef.current = null;
    };
  }, [batchSlice, opts]);

  const stepNext = () => engineRef.current?.step(-1);
  const stepPrev = () => engineRef.current?.step(1);

  const prevBatch = () => setBatchIndex((prev) => (prev > 0 ? prev - 1 : totalBatches - 1));
  const nextBatch = () => setBatchIndex((prev) => (prev + 1 < totalBatches ? prev + 1 : 0));

  const startNum = batchIndex * BATCH_SIZE + 1;
  const endNum = Math.min((batchIndex + 1) * BATCH_SIZE, totalItems);

  return (
    <div
      className={styles.carouselSection}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Dedicated Artwork Stage: Canvas runs purely here without ANY overlays */}
      <div ref={hostRef} className={styles.canvasStage}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className={styles.canvas}
          aria-label="Drag horizontally to curve-flow through artwork"
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Side fades */}
        <div className={styles.sideFadeLeft} />
        <div className={styles.sideFadeRight} />
      </div>

      {/* 2. Controls Bar: Placed strictly BELOW the canvas in normal document flow */}
      <div className={styles.bottomBar}>
        <div className={styles.controlsGroup}>
          <button
            onClick={stepPrev}
            className={styles.arrowBtn}
            aria-label="Previous Artwork"
            title="Previous Artwork"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className={styles.counterPill}>
            <span>{activeCategory}</span>
            <strong>{startNum}–{endNum}</strong>
            <span className={styles.totalText}>of {totalItems.toLocaleString()}</span>
          </div>

          <button
            onClick={stepNext}
            className={styles.arrowBtn}
            aria-label="Next Artwork"
            title="Next Artwork"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {totalBatches > 1 && (
          <div className={styles.batchRow}>
            <button
              onClick={prevBatch}
              className={styles.prevBatchBtn}
              title="Previous Set"
            >
              ← Prev Set
            </button>
            <button
              onClick={nextBatch}
              className={styles.nextBatchBtn}
              title="Next Set of Works"
            >
              Next Set ({batchIndex + 1}/{totalBatches}) ↻
            </button>
          </div>
        )}

        <span className={styles.hintText}>Drag across cards or use arrow keys</span>
      </div>
    </div>
  );
}
