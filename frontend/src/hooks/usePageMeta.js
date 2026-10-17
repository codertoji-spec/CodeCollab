import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://code-collab-woad.vercel.app';

/**
 * usePageMeta hook
 * Dynamically updates document title, canonical link, and meta description
 * on SPA client-side route transitions.
 */
export default function usePageMeta({ title, description, path, noindex = false }) {
  const location = useLocation();

  useEffect(() => {
    // 1. Update Title
    const fullTitle = title
      ? (title.includes('CodeCollab') ? title : `${title} | CodeCollab`)
      : 'CodeCollab — Real-time Collaborative Code Editor';
    document.title = fullTitle;

    // 2. Update Meta Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    // 3. Update Canonical Link
    const targetPath = path !== undefined ? path : location.pathname;
    const cleanPath = targetPath === '/' ? '' : targetPath.replace(/\/+$/, '');
    const canonicalUrl = `${BASE_URL}${cleanPath || '/'}`;

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // 4. Update Robots meta (for non-indexable routes like dashboard, rooms)
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else if (metaRobots) {
      metaRobots.setAttribute('content', 'index, follow');
    }
  }, [title, description, path, noindex, location.pathname]);
}
