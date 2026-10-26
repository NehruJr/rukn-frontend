import { useState, useEffect } from 'react';
import { Calculator, DollarSign, Sparkles, Eye, TrendingUp, CheckCircle, ShieldCheck } from 'lucide-react';
import platformApi from '@/services/platformApi';
import styles from './CostCalculator.module.css';

const FX_RATES = {
  USD: 1.0,
  EGP: 50.0,
  AED: 3.67,
  SAR: 3.75
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EGP: 'EGP',
  AED: 'AED',
  SAR: 'SAR'
};

const PRESETS = [
  { name: 'Starter Agency', users: 5, properties: 150, leads: 500, ai: 200, margin: 70 },
  { name: 'Growth Brokerage', users: 20, properties: 1000, leads: 5000, ai: 1500, margin: 70 },
  { name: 'Large Brokerage', users: 50, properties: 5000, leads: 25000, ai: 5000, margin: 75 },
  { name: 'Enterprise Scale', users: 150, properties: 20000, leads: 100000, ai: 20000, margin: 80 }
];

const CostCalculator = () => {
  const [users, setUsers] = useState(15);
  const [properties, setProperties] = useState(500);
  const [leads, setLeads] = useState(2500);
  const [aiRequests, setAiRequests] = useState(1000);
  const [targetMargin, setTargetMargin] = useState(70);
  const [currency, setCurrency] = useState('EGP');
  const [apiData, setApiData] = useState(null);

  // Benchmarks
  const baseCost = 15.00;
  const usersCost = Number((users * 1.20).toFixed(2));
  const propertiesCost = Number((properties * 0.015).toFixed(2));
  const leadsCost = Number((leads * 0.001).toFixed(2));
  const aiCost = Number((aiRequests * 0.00035).toFixed(2));
  const totalCostUSD = Number((baseCost + usersCost + propertiesCost + leadsCost + aiCost).toFixed(2));

  // Margin Multiplier
  const marginMultiplier = targetMargin >= 100 ? 100 : (targetMargin <= 0 ? 1 : 1 / (1 - (targetMargin / 100)));
  const suggestedMonthlyUSD = Number((totalCostUSD * marginMultiplier).toFixed(2));
  const suggestedAnnualUSD = Number((suggestedMonthlyUSD * 10).toFixed(2)); // 2 months free discount
  const monthlyProfitUSD = Number((suggestedMonthlyUSD - totalCostUSD).toFixed(2));

  const fx = FX_RATES[currency] || 1.0;
  const sym = CURRENCY_SYMBOLS[currency] || currency;

  const formatPrice = (usdAmount) => {
    const converted = usdAmount * fx;
    if (currency === 'USD') return `$${converted.toFixed(2)}`;
    return `${Math.round(converted).toLocaleString()} ${sym}`;
  };

  const applyPreset = (p) => {
    setUsers(p.users);
    setProperties(p.properties);
    setLeads(p.leads);
    setAiRequests(p.ai);
    setTargetMargin(p.margin);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <Calculator size={28} className={styles.titleIcon} />
          <div>
            <h1 className={styles.title}>Infrastructure Cost & Margin Calculator</h1>
            <p className={styles.subtitle}>
              Real-time unit economics, multi-currency quote generator, and Gemini 2.5 Flash-Lite costing
            </p>
          </div>
        </div>

        <div className={styles.presetsBar}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              className={styles.presetBtn}
              onClick={() => applyPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Column: Sizing & Inputs */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <TrendingUp size={20} color="#d97448" />
            Scale Inputs & Resource Allocations
          </h2>

          {/* Users */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Team Members (Users)</span>
              <span className={styles.unitBenchmark}>$1.20 / user / mo</span>
            </div>
            <div className={styles.inputRow}>
              <input
                type="range"
                min="1"
                max="300"
                value={users}
                onChange={(e) => setUsers(Number(e.target.value))}
                className={styles.slider}
              />
              <input
                type="number"
                min="1"
                max="10000"
                value={users}
                onChange={(e) => setUsers(Math.max(1, Number(e.target.value)))}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* Properties */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Active Property Listings</span>
              <span className={styles.unitBenchmark}>$0.015 / property / mo</span>
            </div>
            <div className={styles.inputRow}>
              <input
                type="range"
                min="10"
                max="10000"
                step="50"
                value={properties}
                onChange={(e) => setProperties(Number(e.target.value))}
                className={styles.slider}
              />
              <input
                type="number"
                min="0"
                max="100000"
                value={properties}
                onChange={(e) => setProperties(Math.max(0, Number(e.target.value)))}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* Leads */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Monthly CRM Leads</span>
              <span className={styles.unitBenchmark}>$0.001 / lead / mo</span>
            </div>
            <div className={styles.inputRow}>
              <input
                type="range"
                min="50"
                max="50000"
                step="100"
                value={leads}
                onChange={(e) => setLeads(Number(e.target.value))}
                className={styles.slider}
              />
              <input
                type="number"
                min="0"
                max="500000"
                value={leads}
                onChange={(e) => setLeads(Math.max(0, Number(e.target.value)))}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* AI Co-Pilot Requests */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Gemini 2.5 Flash-Lite AI Requests</span>
              <span className={styles.unitBenchmark}>$0.00035 / request / mo</span>
            </div>
            <div className={styles.inputRow}>
              <input
                type="range"
                min="0"
                max="20000"
                step="100"
                value={aiRequests}
                onChange={(e) => setAiRequests(Number(e.target.value))}
                className={styles.slider}
              />
              <input
                type="number"
                min="0"
                max="500000"
                value={aiRequests}
                onChange={(e) => setAiRequests(Math.max(0, Number(e.target.value)))}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* Target Margin % */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <span className={styles.label}>Target Gross Margin</span>
              <span className={styles.unitBenchmark}>{targetMargin}% profit margin</span>
            </div>
            <div className={styles.inputRow}>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Number(e.target.value))}
                className={styles.slider}
              />
              <input
                type="number"
                min="0"
                max="95"
                value={targetMargin}
                onChange={(e) => setTargetMargin(Math.min(95, Math.max(0, Number(e.target.value))))}
                className={styles.numInput}
              />
            </div>
          </div>

          {/* 360 Virtual Tour Free Mandate Notice */}
          <div className={styles.freeCard}>
            <ShieldCheck size={28} className={styles.freeIcon} />
            <div>
              <p className={styles.freeTitle}>360° Virtual Tours: Always Free & Unlimited</p>
              <p className={styles.freeDesc}>
                Self-hosted Three.js rendering engine has zero license or per-tour platform cost. Never metered or capped across any plan tier.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Cost Breakdown & Suggested Pricing */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>
              <DollarSign size={20} color="#34d399" />
              Quote & Costing Breakdown
            </h2>

            {/* Currency Selector */}
            <div className={styles.currencyBar} style={{ margin: 0 }}>
              {['USD', 'EGP', 'AED', 'SAR'].map((c) => (
                <button
                  key={c}
                  className={`${styles.currencyBtn} ${currency === c ? styles.active : ''}`}
                  onClick={() => setCurrency(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Itemized Table */}
          <table className={styles.breakdownTable}>
            <tbody>
              <tr>
                <td>Base Cloud DB & Serverless Allocation</td>
                <td>${baseCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td>User State & Authentication ({users} users)</td>
                <td>${usersCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Property Media & CDN ({properties} listings)</td>
                <td>${propertiesCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Lead Ingestion & Notifications ({leads} leads)</td>
                <td>${leadsCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Gemini 2.5 Flash-Lite ({aiRequests} calls)</td>
                <td>${aiCost.toFixed(2)}</td>
              </tr>
              <tr>
                <td>360° Virtual Tour Hosting</td>
                <td style={{ color: '#34d399' }}>$0.00 (Free)</td>
              </tr>
              <tr className={styles.totalRow}>
                <td>Total Monthly Infrastructure Cost</td>
                <td>${totalCostUSD.toFixed(2)} USD</td>
              </tr>
            </tbody>
          </table>

          {/* Suggested Price Result Box */}
          <div className={styles.pricingResultBox}>
            <div className={styles.priceHeading}>Recommended Monthly Subscription</div>
            <div className={styles.priceDisplay}>
              {formatPrice(suggestedMonthlyUSD)}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: '#8a9195' }}> / month</span>
            </div>
            <div className={styles.priceSub}>
              Annual Plan (2 months free): <strong>{formatPrice(suggestedAnnualUSD)} / year</strong>
            </div>
          </div>

          {/* Profit & Unit Economics */}
          <div className={styles.metricPills}>
            <div className={styles.metricPill}>
              <div className={styles.metricPillLabel}>Estimated Monthly Gross Profit</div>
              <div className={styles.metricPillVal}>{formatPrice(monthlyProfitUSD)}</div>
            </div>
            <div className={styles.metricPill}>
              <div className={styles.metricPillLabel}>Break-Even Monthly Floor</div>
              <div className={styles.metricPillVal} style={{ color: '#f59e0b' }}>
                {formatPrice(totalCostUSD)}
              </div>
            </div>
            <div className={styles.metricPill}>
              <div className={styles.metricPillLabel}>Effective Gross Margin</div>
              <div className={styles.metricPillVal}>{targetMargin}%</div>
            </div>
            <div className={styles.metricPill}>
              <div className={styles.metricPillLabel}>Infra Cost Per User</div>
              <div className={styles.metricPillVal} style={{ color: '#cbd5e1' }}>
                ${(totalCostUSD / users).toFixed(2)} USD
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;
