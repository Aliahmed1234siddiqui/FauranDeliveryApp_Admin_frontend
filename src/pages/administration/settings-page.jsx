import { Building2, Percent, Radar } from 'lucide-react';

import { Card, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useApi } from '@/hooks';
import { useQueryState } from '@/router';
import { settingsApi } from '@/services/api';

import { CommissionSettings } from './components/commission-settings';
import { General } from './components/general-settings';
import { RadiusSettings } from './components/radius-settings';

const SECTIONS = [
  { value: 'general', label: 'General', icon: Building2 },
  { value: 'radius', label: 'Delivery radius', icon: Radar },
  { value: 'commission', label: 'Commission', icon: Percent },
];

export default function Settings() {
  const [section, setSection] = useQueryState('section', 'general');
  const { data, loading, error, reload } = useApi(() => settingsApi.get(), [], { key: 'settings' });
  // Remount the section after a save so its form starts from the saved values.
  const key = JSON.stringify(data);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Platform-wide rules. Changes apply to new orders; orders already in progress keep the old values."
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          {SECTIONS.map((s) => (
            <button
              type="button"
              key={s.value}
              className={section === s.value ? 'is-active' : ''}
              onClick={() => setSection(s.value)}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </nav>
        <div>
          {loading && !data ? (
            <Skeleton h={420} r={16} />
          ) : error && !data ? (
            <Card>
              <ErrorState error={error} onRetry={reload} />
            </Card>
          ) : (
            <>
              {section === 'general' && <General key={key} data={data} onSaved={reload} />}
              {section === 'radius' && (
                <RadiusSettings key={key} radius={data.radius || {}} onSaved={reload} />
              )}
              {section === 'commission' && (
                <CommissionSettings key={key} commission={data.commission} onSaved={reload} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
