/**
 * useBreadcrumbs — generates breadcrumb items from the current route path.
 *
 * Each layout passes its `basePath` (e.g. '/admin') and a `routeLabels` map
 * that translates path segments into human-readable labels.
 * The first breadcrumb is always the portal root, and the rest are derived
 * from the path segments.
 */

import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

/**
 * @param basePath   - The portal root path, e.g. '/admin'
 * @param rootLabel  - Label for the root crumb, e.g. 'Admin'
 * @param routeLabels - Map from full path to human-readable label.
 *                      Segment-level labels can also be mapped by their key alone.
 *                      e.g. { '/admin/users': 'Users', '/admin/users/new': 'New User' }
 */
export function useBreadcrumbs(
  basePath: string,
  rootLabel: string,
  routeLabels: Record<string, string>,
): BreadcrumbItem[] {
  const location = useLocation();
  const navigate = useNavigate();

  return useMemo(() => {
    const fullPath = location.pathname;

    // Always start with the portal root
    const crumbs: BreadcrumbItem[] = [
      { label: rootLabel, onClick: () => navigate(basePath) },
    ];

    if (fullPath === basePath || fullPath === basePath + '/') {
      // We're on the root — just show the one crumb (non-clickable)
      return [{ label: rootLabel }];
    }

    // Walk through progressive path prefixes and add crumbs for each
    const suffix = fullPath.slice(basePath.length); // e.g. '/users/123'
    const segments = suffix.split('/').filter(Boolean); // ['users', '123']

    let accumulated = basePath;
    for (const seg of segments) {
      accumulated = `${accumulated}/${seg}`;
      const label =
        routeLabels[accumulated] ??
        routeLabels[seg] ??
        // Capitalise the segment as a last resort
        seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      crumbs.push({ label });
    }

    // Last crumb is non-clickable, previous ones are clickable with navigate
    return crumbs.map((c, i) => {
      if (i === crumbs.length - 1) return { label: c.label };
      return c; // already has onClick
    });
  }, [location.pathname, basePath, rootLabel, routeLabels, navigate]);
}
