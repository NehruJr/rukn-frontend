import { useState, useMemo } from 'react';
import { Globe, MapPin, Calendar, RefreshCw, Info } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useLanguage } from '@/hooks/useLanguage';
import {
  COUNTRIES,
  getMarketPreset,
  getCountryBranches
} from '@/utils/marketPresets';
import styles from './ScopeBar.module.css';

const PERIOD_KEYS = [
  { id: '7d', labelKey: 'dashboard.period7d' },
  { id: '30d', labelKey: 'dashboard.period30d' },
  { id: 'qtd', labelKey: 'dashboard.periodQtd' },
  { id: 'ytd', labelKey: 'dashboard.periodYtd' }
];

const ScopeBar = ({ onRefresh, isRefreshing, lastUpdated }) => {
  const {
    selectedCountry,
    selectedBranch,
    dashboardPeriod,
    setSelectedCountry,
    setSelectedBranch,
    setDashboardPeriod
  } = useUIStore();
  const { t, locale } = useLanguage();
  const [showMeta, setShowMeta] = useState(false);

  const activePreset = useMemo(
    () => (selectedCountry ? getMarketPreset(selectedCountry) : null),
    [selectedCountry]
  );

  const availableBranches = useMemo(
    () => (selectedCountry ? getCountryBranches(selectedCountry) : []),
    [selectedCountry]
  );

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    return new Date(lastUpdated).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    });
  }, [lastUpdated, locale]);

  return (
    <div className={styles.scopeBarContainer}>
      <div className={styles.mainControls}>
        {/* Country Selector */}
        <div className={styles.controlGroup}>
          <div className={styles.countryTabs} role="group" aria-label={t('dashboard.marketScope')}>
            <button
              type="button"
              className={`${styles.tab} ${!selectedCountry ? styles.tabActive : ''}`}
              onClick={() => setSelectedCountry('')}
              aria-pressed={!selectedCountry}
            >
              <Globe size={14} />
              <span>{t('dashboard.allCountries')}</span>
            </button>
            {COUNTRIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`${styles.tab} ${selectedCountry === c.value ? styles.tabActive : ''}`}
                onClick={() => setSelectedCountry(c.value)}
                aria-pressed={selectedCountry === c.value}
              >
                <span className={styles.flag}>{c.flag}</span>
                <span>{c.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector */}
        <div className={styles.controlGroup}>
          <div className={styles.periodSegmented} role="group" aria-label="Dashboard Period">
            <Calendar size={14} className={styles.periodIcon} />
            {PERIOD_KEYS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.periodBtn} ${dashboardPeriod === p.id ? styles.periodBtnActive : ''}`}
                onClick={() => setDashboardPeriod(p.id)}
                aria-pressed={dashboardPeriod === p.id}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh & Last Updated */}
        <div className={styles.refreshGroup}>
          {formattedLastUpdated && (
            <span className={styles.lastUpdatedText}>
              {t('dashboard.lastUpdated')}: {formattedLastUpdated}
            </span>
          )}
          <button
            type="button"
            className={`${styles.refreshButton} ${isRefreshing ? styles.refreshing : ''}`}
            onClick={onRefresh}
            title={t('dashboard.refresh')}
            aria-label={t('dashboard.refresh')}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Branch row and Market Preset meta when country is selected */}
      {(availableBranches.length > 0 || activePreset) && (
        <div className={styles.secondaryBar}>
          {availableBranches.length > 0 && (
            <div className={styles.branchSection}>
              <span className={styles.branchLabel}>
                <MapPin size={13} /> {t('dashboard.branches')}:
              </span>
              <button
                type="button"
                className={`${styles.branchChip} ${!selectedBranch ? styles.branchChipActive : ''}`}
                onClick={() => setSelectedBranch('')}
              >
                {t('dashboard.allBranches')}
              </button>
              {availableBranches.map((branchName) => (
                <button
                  key={branchName}
                  type="button"
                  className={`${styles.branchChip} ${selectedBranch === branchName ? styles.branchChipActive : ''}`}
                  onClick={() => setSelectedBranch(selectedBranch === branchName ? '' : branchName)}
                >
                  {branchName}
                </button>
              ))}
            </div>
          )}

          {activePreset && (
            <div className={styles.metaSection}>
              <button
                type="button"
                className={styles.infoTrigger}
                onClick={() => setShowMeta(!showMeta)}
                title="Toggle market settings info"
              >
                <Info size={13} />
                <span>{activePreset.currency} • {activePreset.vatRate}% VAT</span>
              </button>

              {showMeta && (
                <div className={styles.metaDropdown}>
                  <span><strong>{t('dashboard.currency')}:</strong> {activePreset.currency}</span>
                  <span><strong>{t('dashboard.areaUnit')}:</strong> {activePreset.areaUnit}</span>
                  <span><strong>{t('dashboard.vat')}:</strong> {activePreset.vatRate}%</span>
                  <span><strong>{t('dashboard.dialCode')}:</strong> {activePreset.phonePrefix}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScopeBar;
