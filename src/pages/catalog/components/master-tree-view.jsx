import { useState } from 'react';
import { ChevronRight, EyeOff, FolderTree, Tags } from 'lucide-react';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useApi } from '@/hooks';
import { masterCatalogApi } from '@/services/api';
import { num } from '@/utils/format';

// ---------------------------------------------------------------------------
// Tree: GET /admin/master-catalog/tree
// ---------------------------------------------------------------------------
// Keeps only the branches with items matching `term`.
function filterNode(node, term) {
  const items = (node.items || []).filter((i) => !term || i.name.toLowerCase().includes(term));
  const subCategories = (node.subCategories || []).map((s) => filterNode(s, term)).filter(Boolean);
  if (term && !items.length && !subCategories.length) return null;
  return { ...node, items, subCategories };
}

function TreeItems({ items, onOpen }) {
  if (!items.length)
    return (
      <span className="muted" style={{ fontSize: 12.5 }}>
        No master items yet
      </span>
    );
  return (
    <div className="tree-products">
      {items.map((p) => (
        <button type="button" className="chip" key={p._id} onClick={() => onOpen(p)}>
          {p.name} {p.unit && <b>{p.unit}</b>}
        </button>
      ))}
    </div>
  );
}

function TreeSub({ node, onOpen }) {
  return (
    <div className="tree-sub">
      <div className="tree-sub-title">
        {node.name}{' '}
        <span className="muted" style={{ fontWeight: 500 }}>
          · {num(node.totalItems ?? node.items.length)}
        </span>
        {!node.isActive && <Badge icon={EyeOff}>Hidden</Badge>}
      </div>
      <TreeItems items={node.items} onOpen={onOpen} />
      {node.subCategories.length > 0 && (
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {node.subCategories.map((s) => (
            <TreeSub key={s._id} node={s} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ search, isActive, onOpen }) {
  const { data, loading, error, reload } = useApi(() => masterCatalogApi.tree({ isActive }), [isActive], {
    key: 'master-tree',
  });
  const [open, setOpen] = useState({});
  if (loading && !data) return <Skeleton h={300} r={16} />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  const term = search.trim().toLowerCase();
  const nodes = (data?.categories || []).map((n) => filterNode(n, term)).filter(Boolean);
  if (!nodes.length)
    return (
      <EmptyState
        icon={FolderTree}
        title={term ? 'Nothing matches' : 'The catalog is empty'}
        description={term ? 'Try another search.' : 'Add master items to see them grouped by category.'}
      />
    );

  return (
    <>
      <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>
        {num(data.totalCategories)} categories · {num(data.totalItems)} items
      </p>
      <div className="tree">
        {nodes.map((cat) => {
          const isOpen = open[cat._id] ?? (!!term || cat.totalItems > 0);
          return (
            <div className="tree-node" key={cat._id}>
              <button
                type="button"
                className={`tree-head ${isOpen ? 'is-open' : ''}`}
                onClick={() => setOpen((o) => ({ ...o, [cat._id]: !isOpen }))}
              >
                <ChevronRight size={16} className="chev" />
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }}
                  />
                ) : (
                  <Tags size={18} className="muted" />
                )}
                <strong>{cat.name}</strong>
                {!cat.isActive && <Badge icon={EyeOff}>Hidden</Badge>}
                <span className="spacer" />
                <Badge>{cat.subCategories.length} sub</Badge>
                <Badge tone="brand">{num(cat.totalItems)} items</Badge>
              </button>
              {isOpen && (
                <div className="tree-children">
                  {(cat.items.length > 0 || !cat.subCategories.length) && (
                    <div className="tree-sub">
                      <div className="tree-sub-title">Directly in {cat.name}</div>
                      <TreeItems items={cat.items} onOpen={onOpen} />
                    </div>
                  )}
                  {cat.subCategories.map((s) => (
                    <TreeSub key={s._id} node={s} onOpen={onOpen} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
