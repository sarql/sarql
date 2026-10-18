'use client';

import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  startTransition,
} from 'react';
import { useInView } from 'framer-motion';

export interface CurvedCarouselProps {
  items: React.ReactNode[];
  radius?: number;
  angleStep?: number;
  sizeDecrease?: number;
  autoplay?: boolean;
  autoplayMs?: number;
  dragThreshold?: number;
  cardWidth?: number;
  cardHeight?: number;
  onActiveChange?: (index: number) => void;
}

export default function CurvedCarousel({
  items,
  radius = 1200,
  angleStep = 16,
  sizeDecrease = 0.06,
  autoplay = true,
  autoplayMs = 3500,
  dragThreshold = 50,
  cardWidth = 320,
  cardHeight = 470,
  onActiveChange,
}: CurvedCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.2 });
  const intervalRef = useRef<number | null>(null);

  const total = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverArrow, setHoverArrow] = useState<'left' | 'right' | null>(null);
  const startXRef = useRef(0);

  // Height accommodates the curve arc + card height
  const containerHeight = 580;

  // Notify parent of normalized active index
  useEffect(() => {
    if (total > 0 && onActiveChange) {
      const normalized = ((activeIndex % total) + total) % total;
      onActiveChange(normalized);
    }
  }, [activeIndex, total, onActiveChange]);

  // Autoplay controls
  const clearAutoplay = useCallback(() => {
    if (intervalRef.current != null && typeof window !== 'undefined') {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    if (!autoplay || !inView || total <= 1 || typeof window === 'undefined') return;
    clearAutoplay();
    intervalRef.current = window.setInterval(() => {
      startTransition(() => {
        setActiveIndex((v) => v + 1);
      });
    }, Math.max(500, autoplayMs));
  }, [autoplay, inView, total, autoplayMs, clearAutoplay]);

  useEffect(() => {
    startAutoplay();
    return () => clearAutoplay();
  }, [startAutoplay, clearAutoplay]);

  const resetAutoplay = useCallback(() => {
    clearAutoplay();
    startAutoplay();
  }, [clearAutoplay, startAutoplay]);

  const moveCarousel = useCallback(
    (direction: number) => {
      if (total <= 1) return;
      startTransition(() => {
        setActiveIndex((v) => v + direction);
      });
      resetAutoplay();
    },
    [resetAutoplay, total]
  );

  // Drag handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (total <= 1) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      startXRef.current = e.clientX;
      clearAutoplay();
      startTransition(() => setIsDragging(true));
    },
    [clearAutoplay, total]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const diffX = e.clientX - startXRef.current;
      if (Math.abs(diffX) > Math.max(10, dragThreshold)) {
        moveCarousel(diffX > 0 ? -1 : 1);
        startTransition(() => setIsDragging(false));
      }
    },
    [dragThreshold, isDragging, moveCarousel]
  );

  const onPointerUp = useCallback(() => {
    if (isDragging) startTransition(() => setIsDragging(false));
    resetAutoplay();
  }, [isDragging, resetAutoplay]);

  // Visible slots along the Framer arc (-3 to +3)
  const visibleDiffs = useMemo(() => [-3, -2, -1, 0, 1, 2, 3], []);

  const cards = useMemo(() => {
    if (total <= 0) return null;

    return visibleDiffs.map((diff) => {
      const itemIndex = ((activeIndex + diff) % total + total) % total;
      const child = items[itemIndex];
      const absDiff = Math.abs(diff);
      const isCenter = diff === 0;

      // Exact Framer curved trigonometry
      const angleRad = -diff * angleStep * (Math.PI / 180);
      const translateX = radius * Math.sin(angleRad);
      const translateY = radius - radius * Math.cos(angleRad);
      const rotateZ = -diff * angleStep;
      const scale = 1 - absDiff * sizeDecrease;
      const zIndex = 50 - absDiff * 10;
      const opacity = isCenter ? 1 : absDiff >= 3 ? 0 : 1 - absDiff * 0.35;
      const imgFilter = isCenter
        ? 'grayscale(0%) brightness(1.05)'
        : 'grayscale(100%) brightness(0.65)';

      const transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotateZ}deg) scale(${scale})`;

      return (
        <div
          key={`slot-${diff}`}
          style={{
            position: 'absolute',
            top: '46%',
            left: '50%',
            display: 'inline-flex',
            width: 'fit-content',
            height: 'fit-content',
            transformOrigin: 'center',
            transform,
            zIndex,
            opacity,
            pointerEvents: isCenter ? 'auto' : 'none',
            transitionProperty: 'transform, opacity',
            transitionDuration: '700ms',
            transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
          }}
          aria-hidden={!isCenter}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              filter: imgFilter,
              transition: 'filter 700ms',
              willChange: 'filter',
            }}
          >
            <div
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                display: 'inline-flex',
              }}
            >
              {child}
            </div>
          </div>
        </div>
      );
    });
  }, [activeIndex, angleStep, items, radius, sizeDecrease, total, visibleDiffs]);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'relative',
        width: '100%',
        height: containerHeight,
        overflow: 'visible',
        background: 'transparent',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: containerHeight,
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          role="region"
          aria-label="Carousel"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: 'relative',
            width: '100%',
            height: containerHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'pan-y',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            overflow: 'visible',
          }}
        >
          {cards}
        </div>

        {/* Navigation Arrows */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 16,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            zIndex: 60,
            pointerEvents: total > 1 ? 'auto' : 'none',
          }}
        >
          <button
            type="button"
            aria-label="Previous"
            onClick={total > 1 ? () => moveCarousel(-1) : undefined}
            onMouseEnter={() => setHoverArrow('left')}
            onMouseLeave={() => setHoverArrow(null)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              background: '#FFFFFF',
              color: '#000000',
              cursor: total > 1 ? 'pointer' : 'default',
              outline: 'none',
              transform: hoverArrow === 'left' ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 250ms, background 250ms',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Next"
            onClick={total > 1 ? () => moveCarousel(1) : undefined}
            onMouseEnter={() => setHoverArrow('right')}
            onMouseLeave={() => setHoverArrow(null)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              background: '#FFFFFF',
              color: '#000000',
              cursor: total > 1 ? 'pointer' : 'default',
              outline: 'none',
              transform: hoverArrow === 'right' ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 250ms, background 250ms',
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
