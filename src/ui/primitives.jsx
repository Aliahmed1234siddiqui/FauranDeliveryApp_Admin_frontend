import { useId } from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronDown, Inbox, Loader2, Search, X } from 'lucide-react';
import { initials } from '../lib/format';
import { STATUS } from './status';

const cx = (...c) => c.filter(Boolean).join(' ');

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, className, children, ...props }) {
  return (
    <button className={cx('btn', `btn-${variant}`, `btn-${size}`, !children && 'btn-icon-only', className)} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={size === 'sm' ? 14 : 16} className="spin" /> : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}

export function IconButton({ icon: Icon, label, tone, className, size = 17, ...props }) {
  return (
    <button type="button" className={cx('icon-btn', tone && `icon-btn-${tone}`, className)} aria-label={label} title={label} {...props}>
      <Icon size={size} />
    </button>
  );
}

export function Badge({ tone = 'neutral', dot, icon: Icon, children, className }) {
  return (
    <span className={cx('badge', `badge-${tone}`, className)}>
      {dot && <span className="badge-dot" />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }) {
  const [tone, text] = STATUS[status] || ['neutral', status];
  return <Badge tone={tone} dot>{label || text}</Badge>;
}

const AVATAR_TONES = ['brand', 'amber', 'blue', 'violet', 'rose', 'teal'];
export function Avatar({ name = '', src, size = 'md', tone, square }) {
  const t = tone || AVATAR_TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span className={cx('avatar', `avatar-${size}`, `avatar-${t}`, square && 'avatar-square')} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initials(name) || '?'}
    </span>
  );
}

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

export function PageHeader({ title, description, actions, breadcrumb, meta }) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        {breadcrumb}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {meta && <div className="page-header-meta">{meta}</div>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, trend, trendLabel, tone = 'brand', footer, spark, onClick }) {
  const up = trend > 0;
  return (
    <div className={cx('stat-card', onClick && 'is-clickable')} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="stat-top">
        <span className={cx('stat-icon', `tone-${tone}`)}><Icon size={18} /></span>
        {trend !== undefined && (
          <span className={cx('trend', up ? 'trend-up' : 'trend-down')}>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="stat-label">{label}</p>
      <div className="stat-value">{value}</div>
      {spark}
      {(trendLabel || footer) && <div className="stat-foot">{footer || trendLabel}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon size={22} /></span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="empty empty-error">
      <span className="empty-icon"><X size={22} /></span>
      <strong>Couldn&apos;t load this</strong>
      <p>{error?.message || 'The server did not respond.'}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Skeleton({ w = '100%', h = 14, r = 6, className }) {
  return <span className={cx('skeleton', className)} style={{ width: w, height: h, borderRadius: r }} />;
}

export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="spin" />;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className, autoFocus }) {
  return (
    <label className={cx('search', className)}>
      <Search size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} />
      {value && <button type="button" className="search-clear" onClick={() => onChange('')} aria-label="Clear search"><X size={14} /></button>}
    </label>
  );
}

export function Select({ value, onChange, options, className, label, ...props }) {
  return (
    <label className={cx('select', className)}>
      {label && <span className="select-label">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} {...props}>
        {options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <ChevronDown size={15} />
    </label>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'is-active' : ''} onClick={() => onChange(o.value)}>
          {o.icon && <o.icon size={14} />}
          {o.label}
          {o.count !== undefined && <span className="seg-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Tabs({ value, onChange, tabs }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" aria-selected={value === t.value} className={value === t.value ? 'is-active' : ''} onClick={() => onChange(t.value)}>
          {t.icon && <t.icon size={15} />}
          {t.label}
          {t.count !== undefined && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, children, required, className }) {
  const id = useId();
  return (
    <div className={cx('field', error && 'has-error', className)}>
      {label && <label htmlFor={id} className="field-label">{label}{required && <span className="req">*</span>}</label>}
      {typeof children === 'function' ? children(id) : children}
      {error ? <p className="field-error">{error}</p> : hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function Input({ prefix, suffix, className, ...props }) {
  if (!prefix && !suffix) return <input className={cx('input', className)} {...props} />;
  return (
    <div className={cx('input-group', className)}>
      {prefix && <span className="input-affix">{prefix}</span>}
      <input className="input" {...props} />
      {suffix && <span className="input-affix">{suffix}</span>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={cx('toggle-row', disabled && 'is-disabled')}>
      {(label || description) && (
        <span className="toggle-copy">
          {label && <strong>{label}</strong>}
          {description && <small>{description}</small>}
        </span>
      )}
      <span className={cx('toggle', checked && 'is-on')}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-knob" />
      </span>
    </label>
  );
}

export function KeyValue({ items, columns = 2 }) {
  return (
    <dl className="kv" style={{ '--kv-cols': columns }}>
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k} className="kv-item">
          <dt>{k}</dt>
          <dd>{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Progress({ value, max = 100, tone = 'brand' }) {
  return (
    <span className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <span className={`progress-bar tone-bg-${tone}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </span>
  );
}

export function Identity({ name, sub, avatar = true, square, onClick, icon }) {
  return (
    <div className={cx('identity', onClick && 'is-link')} onClick={onClick}>
      {icon ? <span className="identity-icon">{icon}</span> : avatar && <Avatar name={name} size="sm" square={square} />}
      <div className="identity-copy">
        <strong>{name}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

export function Code({ children }) {
  return <code className="mono-chip">{children}</code>;
}
