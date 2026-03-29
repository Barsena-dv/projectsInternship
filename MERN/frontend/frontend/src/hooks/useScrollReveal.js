import { useEffect, useRef, useState } from 'react';

/**
 * useScrollReveal Hook
 * Uses Intersection Observer to detect when an element enters the viewport.
 * Returns a ref to attach to the element and a boolean indicating visibility.
 */
export const useScrollReveal = (options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;
    
    const observer = new IntersectionObserver(([entry]) => {
      // Once it's visible, keep it visible
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (currentRef) observer.unobserve(currentRef);
      }
    }, options);

    if (currentRef) {
      observer.observe(currentRef);
    }

    // Restore Global .reveal querying for older components (Landing Page, Auth Pages)
    const globalObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          globalObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => globalObserver.observe(el));

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      revealElements.forEach((el) => globalObserver.unobserve(el));
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, isVisible];
};

export default useScrollReveal;
