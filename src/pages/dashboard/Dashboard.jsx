import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Building2,
  FileText,
  DollarSign,
  Plus
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useLanguage } from '@/hooks/useLanguage';
import { leadService } from '@/services/leadService';
import { getMarketPreset } from '@/utils/marketPresets';
import LeadForm from '@/components/LeadForm';

import { useDashboardScope, useDashboardStats } from './useDashboardData';
import ScopeBar from './components/ScopeBar';
import KpiCard from './components/KpiCard';
import AgendaPanel from './components/AgendaPanel';
import AttentionPanel from './components/AttentionPanel';
import PipelineFunnel from './components/PipelineFunnel';
import RecentLeadsPanel from './components/RecentLeadsPanel';
import TeamLeaderboard from './components/TeamLeaderboard';
import MarketBreakdown from './components/MarketBreakdown';

import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, hasPermission } = useAuthStore();
  const { selectedCountry, selectedBranch, addToast } = useUIStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scope = useDashboardScope();
  const { data: statsResponse, isLoading: isStatsLoading, isError: isStatsError, refetch: refetchStats, dataUpdatedAt } = useDashboardStats(scope);

  const statsData = statsResponse?.data;
  const stats = statsData?.stats;
  const countryAnalytics = statsData?.countryAnalytics || {};

  const activePreset = selectedCountry ? getMarketPreset(selectedCountry) : null;
  const activeCurrency = statsData?.currency || activePreset?.currency || 'EGP';
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'agenda'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'attention'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'recentLeads'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'team'] })
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateLeadFromDashboard = async (leadData) => {
    await leadService.createLead({
      ...leadData,
      country: leadData.country || selectedCountry || 'Egypt',
      branch: leadData.branch || selectedBranch || 'Main Branch'
    });
    addToast({
      type: 'success',
      message: `Lead added to ${leadData.country || selectedCountry || 'Egypt'} successfully`
    });
    handleRefresh();
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return { labelKey: 'dashboard.roleAllOrg', className: styles.roleAdmin };
      case 'manager':
        return { labelKey: 'dashboard.roleMyTeam', className: styles.roleManager };
      case 'agent':
      case 'team_leader':
        return { labelKey: 'dashboard.roleMyPerformance', className: styles.roleAgent };
      default:
        return { labelKey: 'dashboard.roleDashboard', className: styles.roleDefault };
    }
  };

  const roleBadge = getRoleBadge();

  const kpis = [
    {
      id: 'leads',
      title: t('dashboard.newLeads'),
      value: stats?.totalLeads?.periodValue ?? stats?.totalLeads?.value ?? 0,
      subText: `${stats?.totalLeads?.value || 0} ${t('dashboard.statTotalLeadsSub')}`,
      change: stats?.totalLeads?.change || '0%',
      trend: stats?.totalLeads?.trend || 'flat',
      sparkline: stats?.totalLeads?.sparkline || [],
      icon: Users,
      color: 'var(--color-primary-600)',
      href: '/leads'
    },
    {
      id: 'properties',
      title: t('dashboard.statActiveProperties'),
      value: stats?.activeProperties?.value || 0,
      subText: stats?.activeProperties?.portfolioFormatted
        ? `${t('dashboard.statActivePropertiesSub')}: ${stats.activeProperties.portfolioFormatted}`
        : `${stats?.activeProperties?.total || 0} total listed`,
      change: stats?.activeProperties?.change || '0%',
      trend: stats?.activeProperties?.trend || 'flat',
      icon: Building2,
      color: 'var(--color-success-600)',
      href: '/properties?status=active'
    },
    {
      id: 'deals',
      title: t('dashboard.statDealsClosed'),
      value: stats?.dealsClosed?.periodValue ?? stats?.dealsClosed?.value ?? 0,
      subText: `${stats?.dealsClosed?.total || 0} ${t('dashboard.statDealsClosedSub')}`,
      change: stats?.dealsClosed?.change || '0%',
      trend: stats?.dealsClosed?.trend || 'flat',
      icon: FileText,
      color: 'var(--color-warning-600)',
      href: '/deals?status=won'
    },
    {
      id: 'revenue',
      title: t('dashboard.statRevenue'),
      value: stats?.revenue?.periodFormatted || stats?.revenue?.formatted || `${activeCurrency} 0`,
      subText: stats?.openPipeline?.formatted
        ? `${t('dashboard.openPipeline')}: ${stats.openPipeline.formatted}`
        : `${t('dashboard.currency')}: ${activeCurrency}`,
      change: stats?.revenue?.change || '0%',
      trend: stats?.revenue?.trend || 'flat',
      byCurrency: stats?.revenue?.byCurrency || [],
      sparkline: stats?.revenue?.sparkline || [],
      icon: DollarSign,
      color: 'var(--color-neutral-700)',
      href: '/deals'
    }
  ];

  return (
    <div className={styles.dashboard}>
      {/* Header and Welcome Section */}
      <div className={styles.welcomeSection}>
        <div>
          <h1 className={styles.welcomeTitle}>
            {t('dashboard.welcome')}, {user?.firstName}! {t('dashboard.welcomeEmoji')}
          </h1>
          <p className={styles.welcomeSubtitle}>
            {selectedCountry
              ? selectedBranch
                ? t('dashboard.showingBranchScope', { country: selectedCountry, branch: selectedBranch })
                : t('dashboard.showingScope', { country: selectedCountry })
              : t('dashboard.welcomeSub')}
          </p>
        </div>

        <div className={styles.headerRightActions}>
          {hasPermission('properties.create') && (
            <button
              type="button"
              className={styles.quickActionBtn}
              onClick={() => navigate('/properties/new')}
            >
              <Plus size={16} />
              <span>
                {selectedCountry
                  ? t('dashboard.addPropertyIn', { country: selectedCountry })
                  : t('dashboard.addProperty')}
              </span>
            </button>
          )}

          {hasPermission('leads.create') && (
            <button
              type="button"
              className={styles.quickActionBtnSecondary}
              onClick={() => setIsLeadModalOpen(true)}
            >
              <Plus size={16} />
              <span>
                {selectedCountry
                  ? t('dashboard.addLeadIn', { country: selectedCountry })
                  : t('dashboard.addLead')}
              </span>
            </button>
          )}

          <div className={`${styles.roleBadge} ${roleBadge.className}`}>
            {t(roleBadge.labelKey)}
          </div>
        </div>
      </div>

      {/* Scope Controls */}
      <ScopeBar
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={dataUpdatedAt}
      />

      {/* Primary KPI Strip */}
      <section className={styles.kpiGrid} aria-label="Key Performance Indicators">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
        ))}
      </section>

      {/* Action Zone: Agenda & Attention */}
      <section className={styles.actionGrid} aria-label="Action Items">
        <AgendaPanel scope={scope} />
        <AttentionPanel scope={scope} />
      </section>

      {/* Insight Zone: Funnel, Recent Leads & Team */}
      <section className={styles.insightGrid} aria-label="Activity & Conversion">
        <PipelineFunnel leadsByStatus={countryAnalytics.leadsByStatus || []} />
        <RecentLeadsPanel scope={scope} showAssignee={isManagerOrAdmin} />
      </section>

      {/* Team Leaderboard (Manager / Admin Only) */}
      {isManagerOrAdmin && (
        <section className={styles.teamSection} aria-label="Team Leaderboard">
          <TeamLeaderboard scope={scope} />
        </section>
      )}

      {/* Market & Regional Inventory Breakdown */}
      <MarketBreakdown
        analytics={countryAnalytics}
        selectedCountry={selectedCountry}
        activeCurrency={activeCurrency}
      />

      {/* Quick Add Lead Modal */}
      <LeadForm
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleCreateLeadFromDashboard}
        initialValues={{
          country: selectedCountry || 'Egypt',
          branch: selectedBranch || 'Main Branch'
        }}
        title={
          selectedCountry
            ? t('dashboard.addLeadIn', { country: selectedCountry })
            : t('dashboard.addLead')
        }
      />
    </div>
  );
};

export default Dashboard;
