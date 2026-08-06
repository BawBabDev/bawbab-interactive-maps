import { useState, useCallback } from '@wordpress/element';

/**
 * Custom hook to track layout dimension bounding rectangles reactively
 */
export const useMapDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const containerRef = useCallback((node) => {
        if (node !== null) {
            const rect = node.getBoundingClientRect();
            setDimensions({ width: rect.width, height: rect.height });

            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    setDimensions({ width, height });
                }
            });
            resizeObserver.observe(node);
        }
    }, []);

    return [dimensions, containerRef];
};
