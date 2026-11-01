'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './Portfolio.module.css';
import CurveflowCarousel from '@/components/ui/CurveflowCarousel';
import {
  getPortfolioCategories,
  getAllPortfolioProjects,
  PortfolioCategory,
  PortfolioProject,
} from '@/services/portfolioService';

export default function PortfolioPage() {
  const [categories, setCategories] = useState<PortfolioCategory[]>(() => getPortfolioCategories());
  const [allProjects, setAllProjects] = useState<PortfolioProject[]>(() => getAllPortfolioProjects());
  const [activeCategory, setActiveCategory] = useState<string>('Posters');

  // Sync state when modified in Admin Panel or local storage
  useEffect(() => {
    const handleSync = () => {
      const updatedCats = getPortfolioCategories();
      const updatedProjects = getAllPortfolioProjects();
      setCategories(updatedCats);
      setAllProjects(updatedProjects);
    };

    window.addEventListener('sarql_portfolio_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('sarql_portfolio_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Compute counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => (counts[c.name] = 0));
    allProjects.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [categories, allProjects]);

  // Filter only enabled categories that actually have active projects
  const enabledCategories = useMemo(() => {
    const valid = categories.filter((c) => {
      const count = categoryCounts[c.name] || 0;
      return c.enabled && count > 0;
    });
    // Fallback to all enabled if no items found
    return valid.length > 0 ? valid : categories.filter((c) => c.enabled);
  }, [categories, categoryCounts]);

  // Ensure active category is valid and enabled
  useEffect(() => {
    if (enabledCategories.length > 0) {
      const isCurrentValid = enabledCategories.some(
        (c) => c.name.toLowerCase() === activeCategory.toLowerCase()
      );
      if (!isCurrentValid) {
        setActiveCategory(enabledCategories[0].name);
      }
    }
  }, [enabledCategories, activeCategory]);

  // Filtered projects for active category
  const categoryProjects = useMemo(() => {
    return allProjects.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());
  }, [allProjects, activeCategory]);

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

        {/* Category Tabs - Only Active / Enabled Sections are Rendered */}
        <div className={styles.filterScroll}>
          {enabledCategories.map((cat) => {
            const count = categoryCounts[cat.name] || 0;
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`${styles.filterBtn} ${isActive ? styles.filterBtnActive : ''}`}
              >
                {cat.name}
                <span className={styles.badgeCount}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GSAP 3D CYLINDRICAL RING CAROUSEL */}
      {categoryProjects.length === 0 ? (
        <div className={styles.emptyState}>
          No projects currently featured in {activeCategory}. Explore our other active collections above.
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
