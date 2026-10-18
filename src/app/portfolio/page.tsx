'use client';

import { useState, useMemo } from 'react';
import styles from './Portfolio.module.css';
import CurveflowCarousel from '@/components/ui/CurveflowCarousel';
import rawProjects from '@/data/driveProjects.json';

interface Project {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  driveId?: string;
  imageUrl?: string;
  videoUrl?: string;
  type: string;
  url?: string;
}

const CATEGORIES = [
  'Posters',
  'Logos',
  'Web Designs',
  'Branding',
  'Motion Graphics',
  'Reels',
  'Social Media',
  'Thumbnails',
  'Video Editing',
];

export default function PortfolioPage() {
  const [activeCategory, setActiveCategory] = useState('Posters');

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((c) => (counts[c] = 0));
    rawProjects.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered projects for active category (e.g. 1401 Posters, 48 Logos)
  const categoryProjects = useMemo(() => {
    return (rawProjects as Project[]).filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <div
      className={styles.pageWrapper}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="tw-container">
        {/* Header */}
        <div className={styles.hero}>
          <p className={styles.eyebrow}>Visual Excellence</p>
          <h1 className={styles.h1}>Curated Portfolio</h1>
          <p className={styles.lead}>
            Interactive 3D carousel. Drag anywhere across the stage to spin through our creative archive.
          </p>
        </div>

        {/* Category Tabs (No All Works) */}
        <div className={styles.filterScroll}>
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ''}`}
              >
                {cat}
                <span className={styles.badgeCount}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GSAP 3D CYLINDRICAL RING CAROUSEL */}
      {categoryProjects.length === 0 ? (
        <div className={styles.emptyState}>
          No works in {activeCategory} yet. Upload files to Google Drive to display here.
        </div>
      ) : (
        <CurveflowCarousel
          items={categoryProjects}
          activeCategory={activeCategory}
        />
      )}
    </div>
  );
}
