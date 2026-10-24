import { useRouter } from './use-router';

// <a> that navigates in-app; modifier clicks (new tab, etc.) behave like a normal link.
export function Link({ to, children, className, onClick, ...rest }) {
  const { navigate } = useRouter();
  const handleClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onClick?.(e);
    navigate(to);
  };
  return (
    <a href={to} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
