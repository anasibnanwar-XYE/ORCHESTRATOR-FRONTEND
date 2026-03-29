import { useEffect, useRef, useState, type RefObject } from 'react';

export function useScrollReveal<T extends HTMLElement>(
  options?: IntersectionObserverInit,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px', ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}
