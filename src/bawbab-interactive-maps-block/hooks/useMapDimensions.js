import { useState, useCallback, useRef } from '@wordpress/element';

/**
 * Custom hook to track layout dimension bounding rectangles reactively
 * with frame throttling to prevent layout thrashing during CSS drawer animations.
 */
export const useMapDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const frameRef = useRef(null);

    const containerRef = useCallback((node) => {
        if (node !== null) {
            const rect = node.getBoundingClientRect();
            setDimensions({ width: rect.width, height: rect.height });

            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;

                    if (frameRef.current) cancelAnimationFrame(frameRef.current);
                    frameRef.current = requestAnimationFrame(() => {
                        setDimensions(prev => {
                            if (Math.abs(prev.width - width) > 3 || Math.abs(prev.height - height) > 3) {
                                return { width, height };
                            }
                            return prev;
                        });
                    });
                }
            });
            resizeObserver.observe(node);
        }
    }, []);

    return [dimensions, containerRef];
};