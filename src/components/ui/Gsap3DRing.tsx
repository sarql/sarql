'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import styles from './Gsap3DRing.module.css';

gsap.registerPlugin(Draggable);

export interface Gsap3DRingProps {
  items: {
    id: string;
    imageUrl?: string;
    driveId?: string;
    category?: string;
  }[];
  activeCategory: string;
}

export default function Gsap3DRing({ items, activeCategory }: Gsap3DRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const draggerRef = useRef<HTMLDivElement>(null);
  const draggableInstance = useRef<any>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Wide 3D Arc Geometry (5 cards visible in an arc facing the viewer)
  const RADIUS = 950; // Wide cylindrical curve
  const ANGLE_STEP = 15; // 15 degrees per card for natural wide spacing

  const total = items.length;

  // 7 slots from -3 to +3 (visible on the front arc)
  const slots = useMemo(() => [-3, -2, -1, 0, 1, 2, 3], []);

  // Spin step
  const spin = (dir: number) => {
    setCurrentIndex((prev) => {
      const next = prev + dir;
      return ((next % total) + total) % total;
    });
  };

  // Next / Prev 10 jump
  const jumpTen = (dir: number) => {
    setCurrentIndex((prev) => {
      const next = prev + dir * 10;
      return ((next % total) + total) % total;
    });
  };

  // Setup GSAP Draggable for smooth swipe/drag
  useEffect(() => {
    if (!draggerRef.current || total <= 1) return;

    let startX = 0;
    const DRAG_THRESHOLD = 45;

    draggableInstance.current = Draggable.create(draggerRef.current, {
      type: 'x',
      cursor: 'grab',
      activeCursor: 'grabbing',
      onDragStart: (e: any) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        startX = clientX;
      },
      onDragEnd: (e: any) => {
        const clientX = e.touches ? e.changedTouches[0].clientX : e.clientX;
        const diff = clientX - startX;
        if (Math.abs(diff) > DRAG_THRESHOLD) {
          spin(diff > 0 ? -1 : 1);
        }
        gsap.set(draggerRef.current, { x: 0 });
      },
    });

    return () => {
      draggableInstance.current?.[0]?.kill();
    };
  }, [total]);

  return (
    <div
      className={styles.stageWrapper}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D Perspective Container */}
      <div ref={containerRef} className={styles.perspectiveContainer}>
        <div ref={ringRef} className={styles.ringTrack}>
          {slots.map((diff) => {
            const itemIndex = ((currentIndex + diff) % total + total) % total;
            const item = items[itemIndex];
            if (!item) return null;

            const isLogo = item.category === 'Logos';
            const isCenter = diff === 0;
            const absDiff = Math.abs(diff);

            // Wensity / Curved Arc Trigonometry:
            // Center card is flat at (0, 0), side cards curve back and tilt inward toward center!
            const angleRad = -diff * ANGLE_STEP * (Math.PI / 180);
            const translateX = Math.round(RADIUS * Math.sin(angleRad));
            const translateZ = Math.round(RADIUS * (Math.cos(angleRad) - 1)); // -0 at center, negative on sides
            const rotateY = Math.round(-diff * ANGLE_STEP);
            const scale = (1 - absDiff * 0.05).toFixed(2);
            const opacity = isCenter ? 1 : absDiff >= 3 ? 0.35 : (1 - absDiff * 0.22).toFixed(2);
            const zIndex = 50 - absDiff * 10;

            const thumbUrl = item.driveId
              ? `https://drive.google.com/thumbnail?id=${item.driveId}&sz=w1000`
              : item.imageUrl;

            return (
              <div
                key={`slot-${diff}`}
                className={`${styles.imgCard} ${isLogo ? styles.logoCard : ''}`}
                style={{
                  transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s ease',
                }}
              >
                {/* 1. Ambient Frosted Background */}
                {thumbUrl && (
                  <img
                    src={thumbUrl}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className={styles.ambientBackdrop}
                  />
                )}

                {/* 2. Soft Light Vignette */}
                <div className={styles.ambientVignette} />

                {/* 3. Fitted Artwork Image (100% complete, ZERO cropping) */}
                {thumbUrl && (
                  <img
                    src={thumbUrl}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className={styles.fittedImg}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                )}

                {/* 4. High-Security Anti-Copy Shield */}
                <div
                  className={styles.securityShield}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Soft Fade (Site Background Gradient) */}
      <div className={styles.softFade} />

      {/* Transparent Dragger Layer */}
      <div ref={draggerRef} className={styles.dragger} />

      {/* Controls & Counter Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.navRow}>
          <button
            onClick={() => spin(1)}
            className={styles.arrowBtn}
            aria-label="Next Work"
            title="Next Work"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {total > 10 && (
          <div className={styles.batchRow}>
            <button
              onClick={() => jumpTen(-1)}
              className={styles.batchBtn}
            >
              -10 Jump
            </button>
            <button
              onClick={() => jumpTen(1)}
              className={`${styles.batchBtn} ${styles.batchBtnPrimary}`}
            >
              +10 Jump ↻
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
