import { cx } from '@/utils/cx';

export function Card({ title, subtitle, action, children, className, padded = true, ...rest }) {
  return (
    <section className={cx('card', padded && 'card-padded', className)} {...rest}>
      {(title || action) && (
        <header className="card-head">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
