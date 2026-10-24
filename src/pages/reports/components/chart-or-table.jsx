import { useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';

import { Segmented } from '@/components/ui';

export function ChartOrTable({ table, chart, label }) {
  const [mode, setMode] = useState('chart');
  return (
    <>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: -6, marginBottom: 8 }}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'chart', label: 'Chart', icon: BarChart3 },
            { value: 'table', label: 'Table', icon: Table2 },
          ]}
          aria-label={label}
        />
      </div>
      {mode === 'chart' ? (
        chart
      ) : (
        <div className="card" style={{ overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>
          {table}
        </div>
      )}
    </>
  );
}
