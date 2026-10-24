// Join class names, skipping falsy values: cx('btn', active && 'is-active').
export const cx = (...classes) => classes.filter(Boolean).join(' ');
