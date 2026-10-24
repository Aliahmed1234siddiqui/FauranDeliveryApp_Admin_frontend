import { cx } from '@/utils/cx';

import { Avatar } from './avatar';

export function Identity({ name, sub, avatar = true, square, onClick, icon }) {
  return (
    <div className={cx('identity', onClick && 'is-link')} onClick={onClick}>
      {icon ? (
        <span className="identity-icon">{icon}</span>
      ) : (
        avatar && <Avatar name={name} size="sm" square={square} />
      )}
      <div className="identity-copy">
        <strong>{name}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}
