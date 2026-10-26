import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { platformOrgService } from '@/services/platformOrgService';
import { platformPlanService } from '@/services/platformPlanService';
import { platformAIService } from '@/services/platformAIService';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Calculator,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Server
} from 'lucide-react';

const PlatformDashboard = () => {
  const { platformUser } = usePlatformAuthStore();

  const [stats, setStats] = useState({
    totalOrgs: 0,
    activeOrgs: 0,
    suspendedOrgs: 0,
    totalPlans: 0,
    aiRequests: 0,
    aiCostUSD: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const [orgsRes, plansRes, aiRes] = await Promise.all([
        platformOrgService.getOrganizations().catch(() => ({ data: [] })),
        platformPlanService.getPlans().catch(() => ({ data: [] })),
        platformAIService.getSummary().catch(() => ({ data: {} }))
      ]);

      const orgs = orgsRes.data || [];
      const plans = plansRes.data || [];
      const ai = aiRes.data || {};

      setStats({
        totalOrgs: orgs.length,
        activeOrgs: orgs.filter((o) => o.isActive).length,
        suspendedOrgs: orgs.filter((o) => !o.isActive).length,
        totalPlans: plans.length,
        aiRequests: ai.totalRequests || 0,
        aiCostUSD: ai.totalCostUSD || 0
      });
    } catch (err) {
      console.error('Failed to load platform dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{
        background: '#232a2d',
        border: '1px solid #2c3438',
        borderRadius: '12px',
        padding: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f7f8f8', margin: 0 }}>
            Welcome back, {platformUser?.firstName || 'Staff'} 👋
          </h1>
          <p style={{ color: '#8a9195', marginTop: '0.35rem', fontSize: '0.875rem' }}>
            Rukn Multi-Tenant SaaS Platform Super-Admin Console
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '6px',
            padding: '0.4rem 0.75rem',
            color: '#34d399',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Server size={14} /> PLATFORM ONLINE
          </div>
          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '6px',
            padding: '0.4rem 0.75rem',
            color: '#fbbf24',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            ROLE: {platformUser?.role || 'Staff'}
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Total Organizations */}
        <div style={{
          background: '#232a2d',
          border: '1px solid #2c3438',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8a9195', textTransform: 'uppercase' }}>
              Customer Agencies
            </span>
            <Building2 size={18} color="#d97448" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f7f8f8' }}>
            {loading ? '...' : stats.totalOrgs}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{stats.activeOrgs} active</span> • <span style={{ color: '#ef4444' }}>{stats.suspendedOrgs} suspended</span>
          </div>
        </div>

        {/* Subscription Plans */}
        <div style={{
          background: '#232a2d',
          border: '1px solid #2c3438',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8a9195', textTransform: 'uppercase' }}>
              Subscription Tiers
            </span>
            <CreditCard size={18} color="#d97448" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f7f8f8' }}>
            {loading ? '...' : stats.totalPlans}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>
            USD / EGP / AED / SAR multi-currency
          </div>
        </div>

        {/* AI Compute Usage */}
        <div style={{
          background: '#232a2d',
          border: '1px solid #2c3438',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8a9195', textTransform: 'uppercase' }}>
              Monthly AI Requests
            </span>
            <Sparkles size={18} color="#d97448" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f7f8f8' }}>
            {loading ? '...' : stats.aiRequests.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>
            Gemini 2.5 Flash-Lite LLM engine
          </div>
        </div>

        {/* AI Compute Cost */}
        <div style={{
          background: '#232a2d',
          border: '1px solid #2c3438',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8a9195', textTransform: 'uppercase' }}>
              AI Direct Cost (USD)
            </span>
            <TrendingUp size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#34d399' }}>
            ${loading ? '...' : stats.aiCostUSD.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>
            $0.10/M prompt • $0.40/M comp
          </div>
        </div>
      </div>

      {/* Free 360 Tours Mandate Banner */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '10px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        color: '#f7f8f8'
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          borderRadius: '8px',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#34d399'
        }}>
          <Compass size={24} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#34d399' }}>
            360° Virtual Tours: Free & Unlimited Mandate
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#8a9195', marginTop: '0.2rem' }}>
            360° Virtual Tours run on client-side Three.js panoramas without recurring third-party vendor charges. As mandated, tours are completely free and quota-exempt (-1) across all customer subscription plans.
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f7f8f8', marginBottom: '1rem' }}>
          Management Modules
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Organizations Directory */}
          <Link
            to="/platform/organizations"
            style={{
              background: '#232a2d',
              border: '1px solid #2c3438',
              borderRadius: '10px',
              padding: '1.25rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'border-color 150ms ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f7f8f8', fontWeight: 700 }}>
                <Building2 size={18} color="#d97448" />
                Organizations Directory
              </div>
              <ArrowRight size={16} color="#8a9195" />
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#8a9195' }}>
              Onboard new real estate agencies, manage lifecycle states, and launch administrative impersonation.
            </p>
          </Link>

          {/* Subscription Plans */}
          <Link
            to="/platform/plans"
            style={{
              background: '#232a2d',
              border: '1px solid #2c3438',
              borderRadius: '10px',
              padding: '1.25rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'border-color 150ms ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f7f8f8', fontWeight: 700 }}>
                <CreditCard size={18} color="#d97448" />
                Plans & Quotas
              </div>
              <ArrowRight size={16} color="#8a9195" />
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#8a9195' }}>
              Configure tier pricing in 4 currencies (USD, EGP, AED, SAR), resource quotas, and feature flags.
            </p>
          </Link>

          {/* Cost Calculator */}
          <Link
            to="/platform/calculator"
            style={{
              background: '#232a2d',
              border: '1px solid #2c3438',
              borderRadius: '10px',
              padding: '1.25rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'border-color 150ms ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f7f8f8', fontWeight: 700 }}>
                <Calculator size={18} color="#d97448" />
                Cost & Margin Calculator
              </div>
              <ArrowRight size={16} color="#8a9195" />
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#8a9195' }}>
              Interactive platform calculator calculating unit infrastructure costs, gross margins, and recommended pricing.
            </p>
          </Link>

          {/* AI Usage & Metering */}
          <Link
            to="/platform/ai-analytics"
            style={{
              background: '#232a2d',
              border: '1px solid #2c3438',
              borderRadius: '10px',
              padding: '1.25rem',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'border-color 150ms ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f7f8f8', fontWeight: 700 }}>
                <Sparkles size={18} color="#d97448" />
                AI Analytics & Metering
              </div>
              <ArrowRight size={16} color="#8a9195" />
            </div>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#8a9195' }}>
              Track Gemini 2.5 Flash-Lite LLM token usage, tool breakdowns, and agency consumption in real time.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
