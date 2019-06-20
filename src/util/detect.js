// Detect touchscreen devices
export const detectTouch = () => (
  typeof navigator !== 'undefined' && navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/) !== null
);

// Detect Mac OS
export const detectMac = () => (
  typeof navigator !== 'undefined' && navigator.platform.indexOf('Mac') >= 0
);
