import { Bike, BrainCircuit, ShoppingBag, Store, Wallet } from 'lucide-react';

import { DateRange } from '@/components/common';
import { Card, EmptyState, PageHeader, Segmented, Tabs } from '@/components/ui';
import { useAuth } from '@/context';
import { useQueryState } from '@/router';

import { ForecastTab } from './components/forecast-report';
import { RevenueTab } from './components/revenue-report';
import { RidersTab } from './components/riders-report';
import { SalesTab } from './components/sales-report';
import { VendorsTab } from './components/vendors-report';
import { useDateRange } from './hooks/use-date-range';
import { PRESETS } from './reports-utils';

export default function Reports() {
  const { can } = useAuth();
  const canReports = can('reports');
  const tabs = [
    ...(canReports
      ? [
          { value: 'sales', label: 'Sales', icon: ShoppingBag },
          { value: 'revenue', label: 'Revenue', icon: Wallet },
          { value: 'vendors', label: 'Vendors', icon: Store },
          { value: 'riders', label: 'Riders', icon: Bike },
        ]
      : []),
    ...(can('reports', 'inventory') ? [{ value: 'forecast', label: 'Forecast', icon: BrainCircuit }] : []),
  ];
  const [tabParam, setTab] = useQueryState('tab', 'sales');
  const tab = tabs.some((t) => t.value === tabParam) ? tabParam : tabs[0]?.value;
  const { range, setRange, preset, setPreset } = useDateRange();
  const showRange = tab && tab !== 'forecast';
  return (
    <>
      <PageHeader
        title="Reports"
        description="How the marketplace is doing - sales, revenue, store and rider performance, and what to restock next. Figures count delivered orders only."
        actions={
          showRange && (
            <>
              <Segmented value={preset} onChange={setPreset} options={PRESETS} />
              <DateRange from={range.from} to={range.to} onChange={setRange} />
            </>
          )
        }
      />
      {tabs.length ? (
        <Tabs value={tab} onChange={setTab} tabs={tabs} />
      ) : (
        <Card>
          <EmptyState title="No access" description="Your role can't view reports." />
        </Card>
      )}
      {tab === 'sales' && <SalesTab range={range} />}
      {tab === 'revenue' && <RevenueTab range={range} />}
      {tab === 'vendors' && <VendorsTab range={range} />}
      {tab === 'riders' && <RidersTab range={range} />}
      {tab === 'forecast' && <ForecastTab />}
    </>
  );
}
