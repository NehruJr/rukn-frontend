import { useState, useEffect } from 'react';
import { platformAIService } from '@/services/platformAIService';
import {
  Sparkles,
  Zap,
  DollarSign,
  Cpu,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building2
} from 'lucide-react';
import styles from './AIAnalytics.module.css';

const AIAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [toolsBreakdown, setToolsBreakdown] = useState([]);
  const [topOrgs, setTopOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, toolsRes, orgsRes] = await Promise.all([
        platformAIService.getSummary(),
        platformAIService.getByTool(),
        platformAIService.getTopOrganizations()
      ]);

      setSummary(summaryRes.data);
      setToolsBreakdown(toolsRes.data || []);
      setTopOrgs(orgsRes.data || []);
    } catch (err) {
      console.error('Failed to load AI metrics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch AI usage analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleWrapper}>
          <Sparkles className={styles.titleIcon} size={28} />
          <div>
            <h1 className={styles.title}>AI Usage & Expense Metering</h1>
            <p className={styles.subtitle}>
              Monitor Gemini 2.5 Flash-Lite LLM compute costs, token usage, and tenant consumption
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          style={{
            background: '#232a2d',
            border: '1px solid #2c3438',
            borderRadius: '6px',
            color: '#c5cacd',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Pricing Transparency Banner */}
      <div className={styles.pricingBanner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="#d97448" />
          <span>
            <strong>LLM Engine:</strong> Google Gemini 2.5 Flash-Lite (Tier 1 Global Benchmark)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: '#c5cacd' }}>
          <span>Input / Prompt: <strong>$0.10 / 1M tokens</strong></span>
          <span>Output / Completion: <strong>$0.40 / 1M tokens</strong></span>
          <span>Fallbacks: <strong>$0.00 (Free)</strong></span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total AI Invocations</div>
          <div className={styles.kpiValue}>
            {loading ? '...' : (summary?.totalRequests ?? 0).toLocaleString()}
          </div>
          <div className={styles.kpiSubtext}>Aggregated requests</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Compute Cost (USD)</div>
          <div className={styles.kpiValue} style={{ color: '#34d399' }}>
            ${loading ? '...' : (summary?.totalCostUSD ?? 0).toFixed(4)}
          </div>
          <div className={styles.kpiSubtext}>Direct API expense</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Total Tokens Consumed</div>
          <div className={styles.kpiValue}>
            {loading ? '...' : (summary?.totalTokens ?? 0).toLocaleString()}
          </div>
          <div className={styles.kpiSubtext}>
            {((summary?.totalPromptTokens ?? 0) / 1000).toFixed(1)}k prompt / {((summary?.totalCompletionTokens ?? 0) / 1000).toFixed(1)}k comp
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Average Latency</div>
          <div className={styles.kpiValue}>
            {loading ? '...' : Math.round(summary?.avgDurationMs ?? 0)} ms
          </div>
          <div className={styles.kpiSubtext}>Response duration</div>
        </div>
      </div>

      {/* Tools Breakdown Table */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Usage by AI Feature / Tool</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#8a9195' }}>Loading tool breakdown...</div>
        ) : toolsBreakdown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#8a9195' }}>
            No AI requests logged in this period.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tool / Feature</th>
                <th>Invocations</th>
                <th>Prompt Tokens</th>
                <th>Completion Tokens</th>
                <th>Avg Latency</th>
                <th style={{ textAlign: 'right' }}>Total Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              {toolsBreakdown.map((t) => (
                <tr key={t.tool}>
                  <td style={{ fontWeight: 700, color: '#f7f8f8', textTransform: 'capitalize' }}>
                    {t.tool?.replace(/-/g, ' ')}
                  </td>
                  <td>{t.count?.toLocaleString()}</td>
                  <td>{t.promptTokens?.toLocaleString()}</td>
                  <td>{t.completionTokens?.toLocaleString()}</td>
                  <td>{Math.round(t.avgDurationMs || 0)} ms</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                    ${Number(t.costUSD || 0).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Top Consuming Organizations */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Top Consuming Customer Agencies</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#8a9195' }}>Loading top agencies...</div>
        ) : topOrgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#8a9195' }}>
            No agency usage records logged yet.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Invocations</th>
                <th>Total Tokens</th>
                <th style={{ textAlign: 'right' }}>Total Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              {topOrgs.map((o) => (
                <tr key={o.organizationId || o._id}>
                  <td style={{ fontWeight: 700, color: '#f7f8f8' }}>
                    {o.organizationName || o.name || 'Agency'}
                  </td>
                  <td>{o.requestsCount?.toLocaleString() || o.count?.toLocaleString()}</td>
                  <td>{o.totalTokens?.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                    ${Number(o.totalCostUSD || o.costUSD || 0).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AIAnalytics;
