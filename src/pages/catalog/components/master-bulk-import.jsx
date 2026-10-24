import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, FileSpreadsheet, Upload } from 'lucide-react';

import { Modal } from '@/components/overlays';
import { Badge, Button } from '@/components/ui';
import { useAction } from '@/hooks';
import { masterCatalogApi } from '@/services/api';
import { money } from '@/utils/format';

import { MAX_ROWS, parseRows, SAMPLE } from '../master-csv';

export function BulkImport(props) {
  return props.open ? <BulkImportBody {...props} /> : null;
}

function BulkImportBody({ onClose, onDone }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null); // { created, failed: { [line]: error } }
  const [run, pending] = useAction();
  const rows = useMemo(() => parseRows(text), [text]);
  const valid = rows.filter((r) => !r.error);
  const tooMany = valid.length > MAX_ROWS;

  const edit = (value) => {
    setText(value);
    setResult(null);
  };
  const onFile = (file) => file && file.text().then(edit);
  const submit = () =>
    run(() => masterCatalogApi.bulkCreate(valid.map((r) => r.item)))
      .then(({ created = [], failed = [] }) => {
        // `index` points into the submitted array; map it back to the pasted line.
        setResult({
          created: created.length,
          failed: Object.fromEntries(failed.map((f) => [valid[f.index]?.line, f.error])),
        });
        if (created.length) {
          toast.success(`${created.length} items added to the master catalog`);
          onDone();
        }
        if (!failed.length) onClose();
        else toast.error(`${failed.length} rows could not be added`);
      })
      .catch(() => {});

  const status = (r) => {
    if (r.error) return <Badge tone="danger">{r.error}</Badge>;
    if (!result)
      return (
        <Badge tone="success" icon={Check}>
          OK
        </Badge>
      );
    return result.failed[r.line] ? (
      <Badge tone="danger">{result.failed[r.line]}</Badge>
    ) : (
      <Badge tone="success" icon={Check}>
        Added
      </Badge>
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      icon={FileSpreadsheet}
      title="Bulk import master items"
      description="Paste CSV or rows from a spreadsheet, or upload a file. Columns: name, brand, categoryName (or category id), unit, suggestedPrice, barcode, description, tags. Separate several tags with |."
      footer={
        <>
          <span className="muted" style={{ marginRight: 'auto', fontSize: 13 }}>
            {result
              ? `${result.created} added · ${Object.keys(result.failed).length} failed`
              : rows.length
                ? `${valid.length} ready · ${rows.length - valid.length} with errors`
                : 'Nothing to import yet'}
          </span>
          <Button variant="ghost" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button icon={Upload} disabled={!valid.length || tooMany} loading={pending} onClick={submit}>
              Import {valid.length || ''} items
            </Button>
          )}
        </>
      }
    >
      <div className="stack">
        <div className="row row-wrap">
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={14} /> Upload .csv
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              hidden
              onChange={(e) => {
                onFile(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </label>
          <Button size="sm" variant="ghost" onClick={() => edit(SAMPLE)}>
            Use sample data
          </Button>
          {tooMany && <Badge tone="danger">At most {MAX_ROWS} rows per import</Badge>}
        </div>
        <textarea
          className="input textarea"
          rows={6}
          style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}
          value={text}
          onChange={(e) => edit(e.target.value)}
          placeholder={SAMPLE}
        />
        {rows.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-scroll" style={{ maxHeight: 260 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Price</th>
                    <th>{result ? 'Result' : 'Check'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line}>
                      <td className="muted">{r.line}</td>
                      <td className="cell-strong">
                        {r.item.name || '—'}
                        <span className="cell-sub">{r.item.brand}</span>
                      </td>
                      <td>{r.item.categoryName || r.item.category || '—'}</td>
                      <td>{r.item.unit}</td>
                      <td>{r.item.suggestedPrice >= 0 ? money(r.item.suggestedPrice) : '—'}</td>
                      <td>{status(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
