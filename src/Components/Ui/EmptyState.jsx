import { InboxIcon } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", description, icon: Icon = InboxIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Icon size={32} className="text-ink-faint" />
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
    </div>
  );
}
