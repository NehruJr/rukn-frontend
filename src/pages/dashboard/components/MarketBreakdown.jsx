import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Layers, BarChart3, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { LEAD_SOURCE_LABELS, formatCountryCurrency } from '@/utils/marketPresets';
import styles from './MarketBreakdown.module.css';

const MarketBreakdown = ({ analytics = {}, selectedCountry, activeCurrency = 'EGP' }) => {
  const { t, leadSource } = useLanguage();
  const [activeTab, setActiveTab] = useState('branches');

  const {
    propertiesByBranch = [],
    leadsBySource = [],
    propertiesByCategory = [],
    topDevelopers = []
  } = analytics;

  const categoryLabels = {
    primary_offplan: t('dashboard.categoryPrimary'),
    resale: t('dashboard.categoryResale'),
    rental: t('dashboard.categoryRental')
  };

  const maxBranchCount = Math.max(...propertiesByBranch.map((b) => b.count), 1);
  const maxSourceCount = Math.max(...leadsBySource.map((s) => s.count), 1);

  const title = selectedCountry
    ? t('dashboard.marketAnalyticsTitleCountry', { country: selectedCountry })
    : t('dashboard.marketAnalyticsTitle');

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrapper}>
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.subtitle}>{t('dashboard.welcomeSub')}</p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'branches'}
              className={`${styles.tabBtn} ${activeTab === 'branches' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('branches')}
            >
              <MapPin size={13} />
              <span>{t('dashboard.propertiesByBranch')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sources'}
              className={`${styles.tabBtn} ${activeTab === 'sources' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('sources')}
            >
              <Users size={13} />
              <span>{t('dashboard.leadsBySource')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'mix'}
              className={`${styles.tabBtn} ${activeTab === 'mix' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('mix')}
            >
              <Layers size={13} />
              <span>{t('dashboard.inventoryMix')}</span>
            </button>
          </div>

          <Link to="/reports" className={styles.fullReportsLink}>
            <span>{t('dashboard.viewAllReports')}</span>
            <ArrowRight size={14} className={styles.arrowIcon} />
          </Link>
        </div>
      </div>

      <div className={styles.tabContent}>
        {/* Tab 1: Properties By Branch */}
        {activeTab === 'branches' && (
          <div className={styles.gridSection}>
            {propertiesByBranch.length > 0 ? (
              <div className={styles.breakdownList}>
                {propertiesByBranch.map((item) => {
                  const pct = Math.round((item.count / maxBranchCount) * 100);
                  return (
                    <div key={item.branch} className={styles.breakdownItem}>
                      <div className={styles.breakdownTop}>
                        <span className={styles.breakdownName}>{item.branch}</span>
                        <span className={styles.breakdownMeta}>
                          <strong>{item.count}</strong> props ({item.activeCount} active) •{' '}
                          {formatCountryCurrency(item.totalValue, activeCurrency)}
                        </span>
                      </div>
                      <div
                        className={styles.progressBar}
                        role="progressbar"
                        aria-valuenow={item.count}
                        aria-valuemin={0}
                        aria-valuemax={maxBranchCount}
                        aria-label={`${item.branch}: ${item.count} properties`}
                      >
                        <div
                          className={styles.progressFill}
                          style={{ width: `${pct}%`, backgroundColor: 'var(--color-success-500)' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyText}>
                No properties recorded for this selection yet.
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Leads By Source */}
        {activeTab === 'sources' && (
          <div className={styles.gridSection}>
            {leadsBySource.length > 0 ? (
              <div className={styles.breakdownList}>
                {leadsBySource.map((item) => {
                  const pct = Math.round((item.count / maxSourceCount) * 100);
                  const sourceName = LEAD_SOURCE_LABELS[item.source] || leadSource(item.source);
                  return (
                    <div key={item.source} className={styles.breakdownItem}>
                      <div className={styles.breakdownTop}>
                        <span className={styles.breakdownName}>{sourceName}</span>
                        <span className={styles.breakdownMeta}>
                          <strong>{item.count}</strong> leads
                        </span>
                      </div>
                      <div
                        className={styles.progressBar}
                        role="progressbar"
                        aria-valuenow={item.count}
                        aria-valuemin={0}
                        aria-valuemax={maxSourceCount}
                        aria-label={`${sourceName}: ${item.count} leads`}
                      >
                        <div
                          className={styles.progressFill}
                          style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary-500)' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyText}>
                No leads recorded for this selection yet.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Inventory Mix & Developers */}
        {activeTab === 'mix' && (
          <div className={styles.mixSection}>
            {propertiesByCategory.length > 0 ? (
              <div className={styles.categoryPillsGrid}>
                {propertiesByCategory.map((cat) => (
                  <div key={cat.category} className={styles.categoryStatBox}>
                    <span className={styles.categoryLabel}>
                      {categoryLabels[cat.category] || cat.category}
                    </span>
                    <strong className={styles.categoryCount}>{cat.count}</strong>
                    <span className={styles.categoryValue}>
                      {formatCountryCurrency(cat.totalValue, activeCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No category distribution available.</p>
            )}

            {topDevelopers.length > 0 && (
              <div className={styles.topDevSection}>
                <h4 className={styles.subHeading}>{t('dashboard.topDevelopers')}</h4>
                <div className={styles.devList}>
                  {topDevelopers.map((dev) => (
                    <div key={dev.name} className={styles.devRow}>
                      <span className={styles.devName}>{dev.name}</span>
                      <span className={styles.devCount}>{dev.count} units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketBreakdown;
