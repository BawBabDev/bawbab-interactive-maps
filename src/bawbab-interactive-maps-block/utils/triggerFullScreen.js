/**
 * Global utility to trigger native browser fullscreen mode
 */
export const triggerViewportFullscreen = (elementTarget) => {
    if (!elementTarget) return;
    if (elementTarget.requestFullscreen) {
        elementTarget.requestFullscreen();
    } else if (elementTarget.webkitRequestFullscreen) {
        elementTarget.webkitRequestFullscreen();
    } else if (elementTarget.msRequestFullscreen) {
        elementTarget.msRequestFullscreen();
    }
};
