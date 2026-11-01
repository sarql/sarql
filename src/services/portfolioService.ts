/**
 * Sarql Portfolio & Archive Manager Service
 * Manages category visibility (hide/enable sections), custom uploads, and project deletions.
 * Persists modifications in browser localStorage and synchronizes in real-time across the app.
 */

import rawProjectsData from '@/data/driveProjects.json';

export interface PortfolioCategory {
  id: string;
  name: string;
  enabled: boolean;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  driveId?: string;
  imageUrl?: string;
  videoUrl?: string;
  type?: string;
  url?: string;
  desc?: string;
  tags?: string[];
  isCustom?: boolean;
  createdAt?: string;
}

export const PORTFOLIO_STORAGE_KEYS = {
  CATEGORIES: 'sarql_portfolio_categories',
  CUSTOM_PROJECTS: 'sarql_custom_projects',
  DELETED_IDS: 'sarql_deleted_project_ids',
};

export const DEFAULT_PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  { id: 'posters', name: 'Posters', enabled: true },
  { id: 'logos', name: 'Logos', enabled: true },
  { id: 'web-designs', name: 'Web Designs', enabled: true },
  { id: 'branding', name: 'Branding', enabled: false },
  { id: 'motion-graphics', name: 'Motion Graphics', enabled: false },
  { id: 'reels', name: 'Reels', enabled: false },
  { id: 'social-media', name: 'Social Media', enabled: false },
  { id: 'thumbnails', name: 'Thumbnails', enabled: false },
  { id: 'video-editing', name: 'Video Editing', enabled: false },
];

function triggerUpdateEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sarql_portfolio_updated'));
  }
}

/**
 * Get all portfolio categories with enabled/disabled status
 */
export function getPortfolioCategories(): PortfolioCategory[] {
  if (typeof window === 'undefined') return DEFAULT_PORTFOLIO_CATEGORIES;
  try {
    const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEYS.CATEGORIES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading portfolio categories:', err);
  }
  return DEFAULT_PORTFOLIO_CATEGORIES;
}

/**
 * Save updated categories list
 */
export function savePortfolioCategories(categories: PortfolioCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    triggerUpdateEvent();
  } catch (err) {
    console.error('Error saving portfolio categories:', err);
  }
}

/**
 * Toggle visibility (Show / Hide) of a section
 */
export function toggleCategoryVisibility(name: string, enabled: boolean): PortfolioCategory[] {
  const current = getPortfolioCategories();
  const updated = current.map((c) => (c.name.toLowerCase() === name.toLowerCase() ? { ...c, enabled } : c));
  savePortfolioCategories(updated);
  return updated;
}

/**
 * Add a new custom category
 */
export function addCustomCategory(name: string): PortfolioCategory[] {
  const trimmed = name.trim();
  if (!trimmed) return getPortfolioCategories();
  const current = getPortfolioCategories();
  if (current.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return current;
  }
  const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const updated = [...current, { id, name: trimmed, enabled: true }];
  savePortfolioCategories(updated);
  return updated;
}

/**
 * Delete a category
 */
export function deleteCategory(name: string): PortfolioCategory[] {
  const current = getPortfolioCategories();
  const updated = current.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
  savePortfolioCategories(updated);
  return updated;
}

/**
 * Get custom projects uploaded via admin
 */
export function getCustomProjects(): PortfolioProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEYS.CUSTOM_PROJECTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom projects:', err);
  }
  return [];
}

/**
 * Get array of IDs marked as deleted
 */
export function getDeletedProjectIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(PORTFOLIO_STORAGE_KEYS.DELETED_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading deleted project IDs:', err);
  }
  return [];
}

/**
 * Add a new project (uploaded through Admin Panel)
 */
export function addPortfolioProject(newProject: Omit<PortfolioProject, 'id' | 'isCustom' | 'createdAt'>): PortfolioProject {
  const id = `PRJ-${Date.now().toString().slice(-6)}`;
  const fullProject: PortfolioProject = {
    ...newProject,
    id,
    isCustom: true,
    createdAt: new Date().toISOString(),
    tags: newProject.tags && newProject.tags.length > 0 ? newProject.tags : [newProject.category, 'Admin Upload'],
  };

  if (typeof window !== 'undefined') {
    try {
      const current = getCustomProjects();
      const updated = [fullProject, ...current];
      localStorage.setItem(PORTFOLIO_STORAGE_KEYS.CUSTOM_PROJECTS, JSON.stringify(updated));
      triggerUpdateEvent();
    } catch (err) {
      console.error('Error saving custom project:', err);
    }
  }

  return fullProject;
}

/**
 * Delete a project (whether Drive asset or custom upload)
 */
export function deletePortfolioProject(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. If it's a custom upload, remove from custom list
    const custom = getCustomProjects();
    const updatedCustom = custom.filter((p) => p.id !== id);
    localStorage.setItem(PORTFOLIO_STORAGE_KEYS.CUSTOM_PROJECTS, JSON.stringify(updatedCustom));

    // 2. Add to deleted IDs blacklist (to hide from driveProjects.json)
    const deleted = getDeletedProjectIds();
    if (!deleted.includes(id)) {
      const updatedDeleted = [id, ...deleted];
      localStorage.setItem(PORTFOLIO_STORAGE_KEYS.DELETED_IDS, JSON.stringify(updatedDeleted));
    }

    triggerUpdateEvent();
  } catch (err) {
    console.error('Error deleting portfolio project:', err);
  }
}

/**
 * Restore a deleted project
 */
export function restorePortfolioProject(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const deleted = getDeletedProjectIds();
    const updatedDeleted = deleted.filter((dId) => dId !== id);
    localStorage.setItem(PORTFOLIO_STORAGE_KEYS.DELETED_IDS, JSON.stringify(updatedDeleted));
    triggerUpdateEvent();
  } catch (err) {
    console.error('Error restoring portfolio project:', err);
  }
}

/**
 * Get all active portfolio projects:
 * Combines custom uploads + static driveProjects.json minus deleted items
 */
export function getAllPortfolioProjects(): PortfolioProject[] {
  const deletedSet = new Set(getDeletedProjectIds());
  const customProjects = getCustomProjects().filter((p) => !deletedSet.has(p.id));
  const rawList = (rawProjectsData as PortfolioProject[]).filter((p) => !deletedSet.has(p.id));

  // Custom uploads placed first in their respective categories
  return [...customProjects, ...rawList];
}

