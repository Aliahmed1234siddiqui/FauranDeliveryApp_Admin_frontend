import { cx } from '@/utils/cx';
import { initials } from '@/utils/format';

const AVATAR_TONES = ['brand', 'amber', 'blue', 'violet', 'rose', 'teal'];

export function Avatar({ name = '', src, size = 'md', tone, square }) {
  const t = tone || AVATAR_TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span
      className={cx('avatar', `avatar-${size}`, `avatar-${t}`, square && 'avatar-square')}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" /> : initials(name) || '?'}
    </span>
  );
}
