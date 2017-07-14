// Detect touchscreen devices
export const detectTouch = () => (
  navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/) !== null
);

// Detect Mac OS
export const detectMac = () => (
  navigator.platform.indexOf('Mac') >= 0
);
