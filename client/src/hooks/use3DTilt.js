import { useRef, useCallback } from 'react';

/**
 * Returns ref + event handlers that give any HTML element a
 * smooth CSS 3D tilt effect on mouse move.
 *
 * @param {number} strength   Max rotation degrees (default 12)
 * @param {boolean} disabled  Skip effect on touch / mobile
 */
export function use3DTilt(strength = 12, disabled = false) {
    const ref = useRef(null);

    const handleMouseMove = useCallback((e) => {
        if (disabled || !ref.current) return;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;   // -0.5 .. +0.5
        const y = (e.clientY - top) / height - 0.5;
        ref.current.style.transform = `perspective(1200px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateZ(4px)`;
        ref.current.style.transition = 'transform 0.05s linear';
    }, [disabled, strength]);

    const handleMouseLeave = useCallback(() => {
        if (!ref.current) return;
        ref.current.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
        ref.current.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
    }, []);

    return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave };
}
