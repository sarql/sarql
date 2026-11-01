'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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

  // Luxury gallery mount card: subtle warm tone (#FAFAFA)
  vec3 baseCard = vec3(0.985, 0.982, 0.980);
  // Elegant subtle inner vignette for placeholder state
  vec2 cardCenter = local / uCard.zw - 0.5;
  float vignette = smoothstep(0.1, 0.7, length(cardCenter));
  vec3 placeholder = mix(baseCard, vec3(0.940, 0.938, 0.935), vignette * 0.4);
  vec3 col = placeholder;

  if (uHasImage > 0.5) {
    vec2 st = local / uCard.zw;
    float boxR = uCard.z / uCard.w;
    float imgR = uImgSize.x / max(uImgSize.y, 1.0);

    // High fidelity artwork fit (100% full view, zero ugly cropping)
    vec2 containScale = boxR > imgR ? vec2(boxR / imgR, 1.0) : vec2(1.0, imgR / boxR);
    vec2 uv = (st - 0.5) * containScale + 0.5;

    if (uv.x >= 0.001 && uv.x <= 0.999 && uv.y >= 0.001 && uv.y <= 0.999) {
      vec4 tex = texture2D(uImg, uv);
      if (uShift > 0.0002) {
        vec2 nudge = vec2(uShift, 0.0);
        vec4 ahead = texture2D(uImg, clamp(uv + nudge, 0.001, 0.999));
        vec4 behind = texture2D(uImg, clamp(uv - nudge, 0.001, 0.999));
        tex.rgb = vec3(ahead.r, tex.g, behind.b);
      }
      col = mix(baseCard, tex.rgb, tex.a);
    }
  }

  // Edge rim glow
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

export interface CarouselItem {
  id: string;
  title?: string;
  category?: string;
  subCategory?: string;
  driveId?: string;
  imageUrl?: string;
  url?: string;
}

interface LoadedTexture {
  texture: WebGLTexture;
  w: number;
  h: number;
  natural: number;
  lastUsed: number;
}

/**
 * Intelligent Multi-Endpoint Image Fetcher
 * Loads artwork with clean CORS support via Image element
 */
async function fetchArtwork(item: CarouselItem): Promise<{ source: any; w: number; h: number } | null> {
  const urls: string[] = [];

  // Local assets (e.g. /projects/edbrid.png)
  if (item.imageUrl && !item.imageUrl.includes('drive.google.com')) {
    urls.push(item.imageUrl);
  }

  // Google Drive CDN endpoint with universal CORS support
  if (item.driveId) {
    urls.push(`https://lh3.googleusercontent.com/d/${item.driveId}=w800`);
  }

  for (const url of urls) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = await new Promise<HTMLImageElement | null>((resolve) => {
        const timer = setTimeout(() => {
          img.src = '';
          resolve(null);
        }, 6000);
        img.onload = () => {
          clearTimeout(timer);
          resolve(img);
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
        img.src = url;
      });

      if (loaded && loaded.naturalWidth > 0) {
        return { source: loaded, w: loaded.naturalWidth, h: loaded.naturalHeight };
      }
    } catch {}
  }

  return null;
}

function makeShader(gl: WebGLRenderingContext, vsText: string, fsText: string) {
  const part = (type: number, text: string) => {
    const s = gl.createShader(type);
    if (!s) throw new Error('shader');
    gl.shaderSource(s, text);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const err = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(err || 'compile');
    }
    return s;
  };

  const program = gl.createProgram();
  if (!program) throw new Error('program');
  const vs = part(gl.VERTEX_SHADER, vsText);
  const fs = part(gl.FRAGMENT_SHADER, fsText);
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

/* ---------------------------------------------------------------- Virtualized Lazy-Loaded WebGL Engine */
class FramerCurveflowEngine {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  items: CarouselItem[];
  opts: any;
  gl: WebGLRenderingContext;
  cardShader: any;
  corners: WebGLBuffer;
  blankTexture: WebGLTexture;

  // Viewport & Layout
  viewW = 1;
  viewH = 1;
  dpr = 1;
  cardH = 1;
  widths: number[] = [];
  starts: number[] = [];
  natural: number[] = [];
  setLen = 1;
  loopLen = 1;
  margin = 0;

  // Motion physics
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
  cursor = { x: 0, y: 0, over: false };
  hovering = false;
  raf = 0;
  lastNow = 0;
  alive = true;
  ready = false;
  sizer: ResizeObserver | null = null;
  offs: (() => void)[] = [];
  lastActiveSlot = 0;

  // Lazy Virtualized Texture Cache & Queue
  textureMap = new Map<number, LoadedTexture>();
  pendingSlots = new Set<number>();
  loadQueue: { slot: number; urgent: boolean }[] = [];
  activeWorkers = 0;
  MAX_WORKERS = 3;
  MAX_CACHED_TEXTURES = 128;
  private queueTimer: any = null;

  constructor(canvas: HTMLCanvasElement, host: HTMLElement, items: CarouselItem[], opts: any) {
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

    // Universal placeholder 1x1 texture
    this.blankTexture = this.createBlankTexture();

    // Initialize layout ratios
    const defaultRatio = opts.frame.ratio || 0.72;
    this.natural = new Array(items.length).fill(defaultRatio);

    this.listen();
    this.resize();

    // Instant direct placement - full initial positioning
    this.layout();
    this.placeFirst();
    this.ready = true;
    this.schedule();

    // Prefetch first visible viewport immediately
    this.prefetchRange(0, Math.min(10, items.length));
  }

  createBlankTexture(): WebGLTexture {
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

  /* ----------------------------------------------------------- Lazy Texture Manager */
  requestLoad(slot: number, urgent: boolean) {
    if (this.textureMap.has(slot) || this.pendingSlots.has(slot)) return;
    if (!this.items[slot]) return;

    // Check if already in queue
    const existingIdx = this.loadQueue.findIndex((q) => q.slot === slot);
    if (existingIdx !== -1) {
      if (urgent && !this.loadQueue[existingIdx].urgent) {
        this.loadQueue[existingIdx].urgent = true;
        const item = this.loadQueue.splice(existingIdx, 1)[0];
        this.loadQueue.unshift(item);
      }
      return;
    }

    if (urgent) {
      this.loadQueue.unshift({ slot, urgent: true });
    } else {
      this.loadQueue.push({ slot, urgent: false });
    }

    this.processQueue();
  }

  prefetchRange(start: number, count: number) {
    for (let i = start; i < start + count; i++) {
      const slot = wrap(i, this.items.length);
      this.requestLoad(slot, false);
    }
  }

  processQueue() {
    if (!this.alive) return;

    if (this.activeWorkers >= this.MAX_WORKERS || this.loadQueue.length === 0) return;

    const task = this.loadQueue.shift();
    if (!task) return;

    const slot = task.slot;
    if (this.textureMap.has(slot) || this.pendingSlots.has(slot)) {
      this.processQueue();
      return;
    }

    this.pendingSlots.add(slot);
    this.activeWorkers++;

    const item = this.items[slot];
    if (!item) {
      this.pendingSlots.delete(slot);
      this.activeWorkers--;
      this.processQueue();
      return;
    }

    fetchArtwork(item).then((pic) => {
      if (!this.alive) return;
      this.pendingSlots.delete(slot);
      this.activeWorkers--;

      if (pic) {
        this.uploadTexture(slot, pic.source, pic.w, pic.h);
      }

      // Small 80ms stagger to prevent burst rate limits on mobile
      if (!this.queueTimer) {
        this.queueTimer = setTimeout(() => {
          this.queueTimer = null;
          this.processQueue();
        }, 80);
      }
    });

    // Also trigger next worker if slots available
    if (this.activeWorkers < this.MAX_WORKERS && this.loadQueue.length > 0) {
      setTimeout(() => this.processQueue(), 50);
    }
  }

  uploadTexture(slot: number, source: any, w: number, h: number) {
    if (!this.alive) return;
    const gl = this.gl;

    try {
      const tex = gl.createTexture();
      if (!tex) return;

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const naturalRatio = clampTo(w / h, 0.3, 3.2);
      this.textureMap.set(slot, {
        texture: tex,
        w,
        h,
        natural: naturalRatio,
        lastUsed: performance.now(),
      });

      this.natural[slot] = naturalRatio;

      // LRU Eviction when pool gets large
      if (this.textureMap.size > this.MAX_CACHED_TEXTURES) {
        this.evictFarthest();
      }

      this.layout();
      this.schedule();
    } catch (err) {
      console.warn(`WebGL texture upload notice for slot ${slot}:`, err);
    }
  }

  evictFarthest() {
    let farthestSlot = -1;
    let maxDist = -1;
    const n = this.items.length;

    for (const [slot] of this.textureMap.entries()) {
      const dist = Math.min(Math.abs(slot - this.lastActiveSlot), n - Math.abs(slot - this.lastActiveSlot));
      if (dist > maxDist) {
        maxDist = dist;
        farthestSlot = slot;
      }
    }

    if (farthestSlot !== -1 && maxDist > 30) {
      const entry = this.textureMap.get(farthestSlot);
      if (entry) {
        try {
          this.gl.deleteTexture(entry.texture);
        } catch {}
        this.textureMap.delete(farthestSlot);
      }
    }
  }

  /* ----------------------------------------------------------- Geometry & Layout */
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

  /**
   * High-Performance O(log N) Exact Seat Finder:
   * Uses binary search in the monotonic `starts` array to guarantee 100% exact center detection,
   * completely eliminating blank-screen drift on huge archives (e.g. 1,400+ posters).
   */
  seats(shown: number) {
    const out: { key: number; slot: number; left: number; width: number }[] = [];
    const n = this.items.length;
    if (n === 0 || !this.starts || this.starts.length === 0) return out;

    const copies = Math.max(2, Math.round(this.loopLen / this.setLen));

    // Exact center slot via binary search in sorted starts array
    const centerOffset = wrap(this.viewW * 0.5 - shown, this.setLen);
    let low = 0;
    let high = n - 1;
    let exactCenter = 0;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.starts[mid] <= centerOffset) {
        exactCenter = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    // Generous window (+- 32 slots) to ensure cards never pop or disappear on wide/4K screens
    const windowRadius = Math.min(32, Math.ceil(n / 2));

    for (let c = 0; c < copies; c++) {
      for (let offset = -windowRadius; offset <= windowRadius; offset++) {
        const i = wrap(exactCenter + offset, n);
        const left = this.leftOf(c * this.setLen + this.starts[i], shown);
        const width = this.widths[i];
        if (left > this.viewW + 200 || left + width < -200) continue;
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

  /* ----------------------------------------------------------- Render Loop */
  paint(list: { key: number; slot: number; left: number; width: number }[], shown: number) {
    const gl = this.gl;
    const o = this.opts;

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
    gl.uniform4fv(cs.spot('uRimOut'), [0.63, 0.77, 0.96, 0.55]);
    gl.uniform4fv(cs.spot('uRimIn'), [0.96, 0.78, 0.57, 0.45]);
    gl.uniform1i(cs.spot('uImg'), 0);
    gl.activeTexture(gl.TEXTURE0);

    // Draw visible cards
    for (const seat of list) {
      const w = seat.width;
      const h = this.cardH;
      const cx = seat.left + seat.width / 2;
      const left = cx - w / 2;
      const top = mid - h / 2;
      const kMax = Math.max(swellAt(left, this.viewW, s.flat, s.flare), swellAt(left + w, this.viewW, s.flat, s.flare));
      const above = top - mid;
      const beneath = top + h - mid;

      gl.uniform4f(cs.spot('uBox'), left - 2, mid + Math.min(above, above * kMax) - 3, left + w + 2, mid + Math.max(beneath, beneath * kMax) + 3);
      gl.uniform4f(cs.spot('uCard'), left, top, w, h);
      gl.uniform1f(cs.spot('uAlpha'), 1.0);

      // Check if texture is loaded in cache
      const texData = this.textureMap.get(seat.slot);
      if (texData) {
        texData.lastUsed = performance.now();
        gl.uniform1f(cs.spot('uHasImage'), 1.0);
        gl.uniform2f(cs.spot('uImgSize'), texData.w, texData.h);
        gl.bindTexture(gl.TEXTURE_2D, texData.texture);
      } else {
        // High priority lazy request for visible screen card
        this.requestLoad(seat.slot, true);
        gl.uniform1f(cs.spot('uHasImage'), 0.0);
        gl.uniform2f(cs.spot('uImgSize'), 720, 1000);
        gl.bindTexture(gl.TEXTURE_2D, this.blankTexture);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  local(e: PointerEvent | MouseEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  aim(target: number) {
    this.glideTo = { from: this.pos, to: target, begin: performance.now(), length: 0.65 };
    this.vel = 0;
    this.schedule();
  }

  step(direction: number) {
    const stepSize = this.widths.reduce((a, b) => a + b, 0) / (this.widths.length || 1) + this.opts.frame.spacing;
    const from = this.glideTo ? this.glideTo.to : this.pos;
    this.aim(from + direction * stepSize);
  }

  jump(cardIndex: number) {
    const targetSlot = wrap(cardIndex, this.items.length);
    const targetStart = this.starts[targetSlot];
    const targetWidth = this.widths[targetSlot];
    const targetPos = this.viewW * 0.5 - (targetStart + targetWidth * 0.5);
    this.aim(targetPos);
  }

  listen() {
    const c = this.canvas;
    const on = (target: any, type: string, fn: any, opt?: any) => {
      target.addEventListener(type, fn, opt);
      this.offs.push(() => target.removeEventListener(type, fn, opt));
    };

    // Dedicated Mobile Touch Gesture Tracking
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDetermined = false;
    let touchIsHorizontal = false;

    on(c, 'touchstart', (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const r = c.getBoundingClientRect();
      const px = touch.clientX - r.left;
      const py = touch.clientY - r.top;

      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchDetermined = false;
      touchIsHorizontal = false;

      this.held = true;
      this.glideTo = null;
      this.vel = 0;
      this.pressX = px;
      this.pressPos = this.pos;
      this.travelled = 0;
      this.trail = [{ t: performance.now(), x: px }];
      this.cursor = { x: px, y: py, over: true };
      this.schedule();
    }, { passive: true });

    on(c, 'touchmove', (e: TouchEvent) => {
      if (!this.held || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const r = c.getBoundingClientRect();
      const px = touch.clientX - r.left;
      const py = touch.clientY - r.top;
      this.cursor = { x: px, y: py, over: true };

      const diffX = touch.clientX - touchStartX;
      const diffY = touch.clientY - touchStartY;

      if (!touchDetermined) {
        if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
          touchDetermined = true;
          touchIsHorizontal = Math.abs(diffX) >= Math.abs(diffY);
        }
      }

      if (touchIsHorizontal) {
        if (e.cancelable) e.preventDefault();
        this.travelled = Math.max(this.travelled, Math.abs(diffX));
        this.pos = this.pressPos + diffX * this.opts.drive.drag;
        const t = performance.now();
        this.trail.push({ t, x: px });
        while (this.trail.length > 2 && t - this.trail[0].t > 100) this.trail.shift();
        this.schedule();
      }
    }, { passive: false });

    const handleTouchEnd = (e: TouchEvent) => {
      if (!this.held) return;
      this.held = false;
      const d = this.opts.drive;

      if (touchIsHorizontal && this.travelled > 6 && this.trail.length >= 2) {
        const first = this.trail[0];
        const last = this.trail[this.trail.length - 1];
        const stale = performance.now() - last.t > 80;
        const span = (last.t - first.t) / 1000;
        this.vel = stale || span <= 0 ? 0 : clampTo(((last.x - first.x) / span) * d.drag, -5000, 5000);
      } else if (!touchDetermined || this.travelled <= 6) {
        // Direct tap on card
        const seat = this.pick(this.pressX, this.cursor.y, this.seats(this.lastShown));
        if (seat) {
          const item = this.items[seat.slot];
          if (item?.url) {
            window.open(item.url, '_blank');
          } else {
            const delta = this.viewW / 2 - (seat.left + seat.width / 2);
            this.aim(this.pos + delta);
          }
        }
      }
      this.trail = [];
      this.schedule();
    };

    on(c, 'touchend', handleTouchEnd);
    on(c, 'touchcancel', handleTouchEnd);

    // Desktop Mouse / Pointer Tracking
    on(c, 'pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // Handled exclusively by touch listeners
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
      if (e.pointerType === 'touch') return;
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
      if (e.pointerType === 'touch') return;
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
          const item = this.items[seat.slot];
          if (item?.url) {
            window.open(item.url, '_blank');
          } else {
            const delta = this.viewW / 2 - (seat.left + seat.width / 2);
            this.aim(this.pos + delta);
          }
        }
      }
      this.trail = [];
      this.schedule();
    };

    on(c, 'pointerup', letGo);
    on(c, 'pointercancel', letGo);
    on(c, 'pointerleave', () => {
      if (!this.held) c.style.cursor = 'grab';
      this.schedule();
    });

    on(c, 'wheel', (e: WheelEvent) => {
      e.preventDefault();
      const amount = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * this.opts.drive.wheelGain;
      this.glideTo = null;
      this.vel = clampTo(this.vel - amount * 8, -4500, 4500);
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

    // Identify active center card and prefetch buffer
    if (list.length > 0) {
      const midX = this.viewW * 0.5;
      let closestSlot = list[0].slot;
      let minDiff = Infinity;
      for (let i = 0; i < list.length; i++) {
        const seat = list[i];
        const diff = Math.abs(seat.left + seat.width * 0.5 - midX);
        if (diff < minDiff) {
          minDiff = diff;
          closestSlot = seat.slot;
        }
      }

      if (closestSlot !== this.lastActiveSlot) {
        this.lastActiveSlot = closestSlot;
        if (o.onActiveIndexChange) {
          o.onActiveIndexChange(closestSlot);
        }

        // Prefetch buffer of adjacent cards around new center
        for (let b = -4; b <= 4; b++) {
          const bufferSlot = wrap(closestSlot + b, this.items.length);
          this.requestLoad(bufferSlot, false);
        }
      }
    }

    const over = this.cursor.over && !this.held ? this.pick(this.cursor.x, this.cursor.y, list) : null;
    const isOver = !!over;
    if (isOver !== this.hovering) {
      this.hovering = isOver;
      this.canvas.style.cursor = isOver ? 'pointer' : 'grab';
    }

    this.paint(list, shown);

    if (busy) this.schedule();
  };

  schedule() {
    if (!this.raf && this.alive) this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.alive = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.offs.forEach((fn) => fn());
    if (this.sizer) this.sizer.disconnect();

    // Release all cached WebGL textures
    for (const [, entry] of this.textureMap.entries()) {
      try {
        this.gl.deleteTexture(entry.texture);
      } catch {}
    }
    this.textureMap.clear();

    try {
      this.gl.deleteTexture(this.blankTexture);
      this.gl.deleteBuffer(this.corners);
      this.gl.deleteProgram(this.cardShader.program);
    } catch {}
  }
}

/* ---------------------------------------------------------------- Component */
interface CurveflowCarouselProps {
  items: CarouselItem[];
  activeCategory: string;
}

export default function CurveflowCarousel({ items, activeCategory }: CurveflowCarouselProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FramerCurveflowEngine | null>(null);

  const totalItems = items.length;
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const handleActiveIndexChange = useCallback((slot: number) => {
    setActiveItemIndex(slot);
  }, []);

  const opts = useMemo(() => {
    const isLogos = activeCategory === 'Logos';
    const isWeb = activeCategory === 'Web Designs';
    return {
      frame: {
        heightPct: isLogos ? 44 : isWeb ? 54 : 58,
        heightCap: isLogos ? 360 : isWeb ? 480 : 540,
        fit: 'natural',
        ratio: isLogos ? 1.0 : isWeb ? 1.55 : 0.72,
        spacing: isLogos ? 28 : 22,
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
        drag: 1.25,
        glide: 0.42,
        wheelGain: 1,
      },
      onActiveIndexChange: handleActiveIndexChange,
    };
  }, [activeCategory, handleActiveIndexChange]);

  // Engine mount & lifecycle
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || items.length === 0) return;

    let engine: FramerCurveflowEngine | null = null;
    try {
      engine = new FramerCurveflowEngine(canvas, host, items, opts);
      engineRef.current = engine;
    } catch (err) {
      console.error('Curveflow WebGL engine error:', err);
    }

    return () => {
      if (engine) engine.destroy();
      engineRef.current = null;
    };
  }, [activeCategory, items, opts]);

  const stepNext = () => engineRef.current?.step(-1);
  const stepPrev = () => engineRef.current?.step(1);
  const jumpNextTen = () => engineRef.current?.jump(activeItemIndex + 10);
  const jumpPrevTen = () => engineRef.current?.jump(activeItemIndex - 10);

  return (
    <div
      className={styles.carouselSection}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Dedicated Artwork Stage */}
      <div ref={hostRef} className={styles.canvasStage}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          className={styles.canvas}
          aria-label="Drag horizontally to stream through artwork"
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Side fades */}
        <div className={styles.sideFadeLeft} />
        <div className={styles.sideFadeRight} />
      </div>

      {/* 2. Controls Bar - Clean, Minimalist */}
      <div className={styles.bottomBar}>
        <div className={styles.controlsGroup}>
          {totalItems > 15 && (
            <button
              onClick={jumpPrevTen}
              className={styles.arrowBtn}
              aria-label="Previous 10 Artworks"
              title="-10 Items"
              style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0 0.5rem' }}
            >
              -10
            </button>
          )}

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
            <strong>{activeItemIndex + 1}</strong>
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

          {totalItems > 15 && (
            <button
              onClick={jumpNextTen}
              className={styles.arrowBtn}
              aria-label="Next 10 Artworks"
              title="+10 Items"
              style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0 0.5rem' }}
            >
              +10
            </button>
          )}
        </div>

        <span className={styles.hintText}>
          Drag or swipe horizontally · Continuous artwork stream · Click card to view
        </span>
      </div>
    </div>
  );
}
