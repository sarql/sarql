'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Reveal from '@/components/animations/Reveal';
import styles from './Projects.module.css';

const projects = [
  {
    "name": "Edbrid",
    "category": "Educational Consultancy Portal",
    "image": "/projects/edbrid.png",
    "features": [
      "Online Degrees",
      "Career Guidance",
      "University Admissions",
      "Mobile First"
    ],
    "url": "https://edbrid.sarql.com/"
  },
  {
    "name": "Malabari Connect",
    "category": "Community & Matrimonial Web App",
    "image": "/projects/malabariconnect.png",
    "features": [
      "Community Network",
      "Matrimony Portal",
      "Career Listings",
      "Realtime Sync"
    ],
    "url": "https://malabariconnect.sarql.com/"
  },
  {
    "name": "MyLet",
    "category": "Property Rental & Job Platform",
    "image": "/projects/mylet.png",
    "features": [
      "0% Brokerage",
      "Room & PG Search",
      "Job Vacancies",
      "Direct Booking"
    ],
    "url": "https://mylet.sarql.com/"
  },
  {
    "name": "Noir Axis Consultancy",
    "category": "Global Study & Business Advisory",
    "image": "/projects/noiraxis.png",
    "features": [
      "International Study",
      "Business Setup",
      "Travel Advisory",
      "Global Reach"
    ],
    "url": "https://www.noiraxisconsultancy.com/"
  },
  {
    "name": "Sarql Official",
    "category": "Social Media Web App",
    "image": "/projects/sarql-official.png",
    "features": [
      "Modern UI/UX",
      "Realtime Chat",
      "Fast Loading",
      "Video Streaming"
    ],
    "url": "https://sarql.com"
  },
  {
    "name": "Rashee Perfumes",
    "category": "Haute Parfumerie & Luxury E-Commerce",
    "image": "/projects/rashee-perfumes.png",
    "features": [
      "Luxury Aesthetics",
      "Secure Checkout",
      "Product Variants",
      "Inventory Sync"
    ],
    "url": "https://rasheeperfumes.com/"
  },
  {
    "name": "Darul Hasanath",
    "category": "Educational Institution Portal",
    "image": "/projects/hasanath.png",
    "features": [
      "Information Portal",
      "Admissions System",
      "Academic Curriculum",
      "Mobile Friendly"
    ],
    "url": "https://hasanath786.web.app/"
  },
  {
    "name": "H-India Foundation",
    "category": "Non-Profit & Community Platform",
    "image": "/projects/hindiaa.png",
    "features": [
      "Donation System",
      "Outreach Programs",
      "Direct Impact",
      "Mobile First"
    ],
    "url": "https://hindiaa.web.app/"
  }
];

export default function Projects() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    // Approximate active card index
    const firstCard = scrollRef.current.querySelector(`.${styles.card}`) as HTMLElement | null;
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth + 24; // width + gap
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.max(0, Math.min(projects.length - 1, index)));
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const firstCard = scrollRef.current.querySelector(`.${styles.card}`) as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 480;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth',
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
    scrollRef.current.classList.add(styles.isDragging);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.25;
    if (Math.abs(walk) > 8) {
      hasMoved.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.classList.remove(styles.isDragging);
    }
    // Release suppress lock quickly so clicks/taps register reliably
    setTimeout(() => {
      hasMoved.current = false;
    }, 60);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <section className={styles.section} id="projects">
      <div className="tw-container">
        {/* ElevenLabs exact section separator */}
        <div className="block-divider">
          <div className="marker-dot marker-dot-left"><div className="marker-center" /></div>
          <div className="marker-dot marker-dot-right"><div className="marker-center" /></div>
          <div className="divider-line" />
        </div>

        <div className={styles.padding}>
          <Reveal>
            <div className={styles.headingWrapper}>
              <div>
                <h2 className={`${styles.title} tw-type-5xl`}>
                  Our Live Projects
                </h2>
                <p className={`${styles.subtitle} tw-type-base`}>
                  Real production web systems deployed for industry-leading clients, built with high-performance modern architectures.
                </p>
              </div>

              <div className={styles.headerActions}>
                {/* Previous / Next Arrow Controls */}
                <div className={styles.navControls} aria-label="Carousel Navigation">
                  <button
                    type="button"
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                    className={styles.navBtn}
                    aria-label="Previous project"
                  >
                    <ChevronLeft size={16} strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                    className={styles.navBtn}
                    aria-label="Next project"
                  >
                    <ChevronRight size={16} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Horizontal Side-Scrolling Carousel Track */}
          <div className={styles.carouselContainer}>
            <div
              ref={scrollRef}
              className={styles.carouselTrack}
              onScroll={updateScrollState}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={() => {
                hasMoved.current = false;
              }}
              onTouchEnd={() => {
                setTimeout(() => {
                  hasMoved.current = false;
                }, 60);
              }}
              onClickCapture={handleClickCapture}
            >
              {projects.map((p) => (
                <article key={p.name} className={styles.card}>
                  <div className={styles.cardVisual}>
                    <img
                      src={p.image}
                      alt={`${p.name} live website screenshot`}
                      className={styles.visualImg}
                      loading="lazy"
                      draggable={false}
                    />
                    <span className={`${styles.visualBadge} tw-type-2xs`}>
                      {p.category}
                    </span>
                  </div>

                  <div className={styles.cardBody}>
                    <div>
                      <div className={styles.titleRow}>
                        <h3 className={`${styles.cardTitle} tw-type-base`}>
                          {p.name}
                        </h3>
                        <span className={`${styles.category} tw-type-2xs`}>
                          {p.category}
                        </span>
                      </div>

                      <div className={styles.pillsRow}>
                        {p.features.map((feat) => (
                          <span key={feat} className={`${styles.pill} tw-type-2xs`}>
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.cardAction} tw-type-sm`}
                    >
                      <span>Visit Live Website</span>
                      <ArrowUpRight size={15} strokeWidth={2.2} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Bottom Indicators & Hint */}
          <div className={styles.carouselFooter}>
            <div className={styles.indicatorDots}>
              {projects.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (!scrollRef.current) return;
                    const firstCard = scrollRef.current.querySelector(`.${styles.card}`) as HTMLElement | null;
                    const cardWidth = firstCard ? firstCard.offsetWidth + 24 : 480;
                    scrollRef.current.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
                  }}
                  className={`${styles.dot} ${activeIndex === i ? styles.dotActive : ''}`}
                  aria-label={`Scroll to project ${i + 1}`}
                />
              ))}
            </div>
            <span className={styles.scrollHint}>
              Scroll or drag sideways to explore all {projects.length} live deployments
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
