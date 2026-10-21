import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Calculator, Calendar, Clock, Percent, DollarSign,
    CheckCircle, ChevronDown, ChevronUp, RotateCcw,
    Copy, Check, Layers, Sliders, Info, AlertTriangle,
    CreditCard, ShieldCheck, Sparkles
} from 'lucide-react';
import styles from './PaymentPlanCalculator.module.css';

/**
 * Frequency configuration multipliers and timing interval in months
 */
const FREQUENCY_CONFIG = {
    monthly: { label: 'Monthly', multiplier: 12, intervalMonths: 1, tag: 'Month' },
    quarterly: { label: 'Quarterly', multiplier: 4, intervalMonths: 3, tag: 'Quarter' },
    semi_annual: { label: 'Semi-Annual', multiplier: 2, intervalMonths: 6, tag: '6-Month' },
    annual: { label: 'Annual', multiplier: 1, intervalMonths: 12, tag: 'Year' }
};

/**
 * Common off-plan market presets across Egypt, UAE, and Saudi Arabia
 */
const MARKET_PRESETS = [
    { label: 'Standard 10/7 (Quarterly)', downPayment: 10, years: 7, frequency: 'quarterly', handover: 10, maintenance: 8 },
    { label: 'Developer Promo 5/8', downPayment: 5, years: 8, frequency: 'quarterly', handover: 10, maintenance: 8 },
    { label: 'Accelerated 15/5 (Monthly)', downPayment: 15, years: 5, frequency: 'monthly', handover: 10, maintenance: 7 },
    { label: 'Fast Equity 20/3', downPayment: 20, years: 3, frequency: 'quarterly', handover: 10, maintenance: 5 }
];

const PaymentPlanCalculator = ({
    price = 0,
    currency = 'EGP',
    paymentPlan = null,
    deliveryDate = null,
    developerName = '',
    projectName = '',
    title = 'Payment Plan & Installment Calculator',
    compact = false,
    onPlanChange = null
}) => {
    // 1. Resolve Initial Defaults from Property Record or Fallbacks
    const initialValues = useMemo(() => {
        const dp = typeof paymentPlan?.downPaymentPercent === 'number' && paymentPlan.downPaymentPercent >= 0
            ? paymentPlan.downPaymentPercent
            : 10;
        const yrs = typeof paymentPlan?.installmentYears === 'number' && paymentPlan.installmentYears > 0
            ? paymentPlan.installmentYears
            : 7;
        const freq = paymentPlan?.installmentFrequency && FREQUENCY_CONFIG[paymentPlan.installmentFrequency]
            ? paymentPlan.installmentFrequency
            : 'quarterly';
        const handover = typeof paymentPlan?.handoverPaymentPercent === 'number' && paymentPlan.handoverPaymentPercent >= 0
            ? paymentPlan.handoverPaymentPercent
            : 10;
        const maint = typeof paymentPlan?.maintenancePercent === 'number' && paymentPlan.maintenancePercent >= 0
            ? paymentPlan.maintenancePercent
            : 8;

        return {
            downPaymentPercent: dp,
            installmentYears: yrs,
            installmentFrequency: freq,
            handoverPaymentPercent: handover,
            maintenancePercent: maint
        };
    }, [paymentPlan]);

    // 2. Interactive Simulation State
    const [downPaymentPercent, setDownPaymentPercent] = useState(initialValues.downPaymentPercent);
    const [installmentYears, setInstallmentYears] = useState(initialValues.installmentYears);
    const [installmentFrequency, setInstallmentFrequency] = useState(initialValues.installmentFrequency);
    const [handoverPaymentPercent, setHandoverPaymentPercent] = useState(initialValues.handoverPaymentPercent);
    const [maintenancePercent, setMaintenancePercent] = useState(initialValues.maintenancePercent);

    // 3. UI State
    const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
    const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all' | 'installments' | 'milestones'
    const [copied, setCopied] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Currency Formatter Helper
    const formatMoney = useCallback((amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) return '0';
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency || 'EGP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        } catch {
            return `${currency || 'EGP'} ${Math.round(amount).toLocaleString('en-US')}`;
        }
    }, [currency]);

    // Check if current simulation differs from initial property values
    const isCustomized = useMemo(() => {
        return (
            downPaymentPercent !== initialValues.downPaymentPercent ||
            installmentYears !== initialValues.installmentYears ||
            installmentFrequency !== initialValues.installmentFrequency ||
            handoverPaymentPercent !== initialValues.handoverPaymentPercent ||
            maintenancePercent !== initialValues.maintenancePercent
        );
    }, [downPaymentPercent, installmentYears, installmentFrequency, handoverPaymentPercent, maintenancePercent, initialValues]);

    // Reset to property terms
    const handleReset = () => {
        setDownPaymentPercent(initialValues.downPaymentPercent);
        setInstallmentYears(initialValues.installmentYears);
        setInstallmentFrequency(initialValues.installmentFrequency);
        setHandoverPaymentPercent(initialValues.handoverPaymentPercent);
        setMaintenancePercent(initialValues.maintenancePercent);
    };

    // Apply preset
    const handleApplyPreset = (preset) => {
        setDownPaymentPercent(preset.downPayment);
        setInstallmentYears(preset.years);
        setInstallmentFrequency(preset.frequency);
        setHandoverPaymentPercent(preset.handover);
        setMaintenancePercent(preset.maintenance);
    };

    // 4. Mathematical Calculations
    const calculations = useMemo(() => {
        const numPrice = Math.max(0, Number(price) || 0);
        const dpPct = Math.max(0, Math.min(100, Number(downPaymentPercent) || 0));
        const handoverPct = Math.max(0, Math.min(100 - dpPct, Number(handoverPaymentPercent) || 0));
        const maintPct = Math.max(0, Number(maintenancePercent) || 0);
        const years = Math.max(0, Number(installmentYears) || 0);

        const downPaymentAmount = Math.round(numPrice * (dpPct / 100));
        const handoverPaymentAmount = Math.round(numPrice * (handoverPct / 100));
        const financedBalance = Math.max(0, Math.round(numPrice - downPaymentAmount - handoverPaymentAmount));

        const freqInfo = FREQUENCY_CONFIG[installmentFrequency] || FREQUENCY_CONFIG.quarterly;
        const totalInstallments = Math.round(years * freqInfo.multiplier);

        const periodicInstallment = totalInstallments > 0
            ? Math.round(financedBalance / totalInstallments)
            : 0;

        const maintenanceDeposit = Math.round(numPrice * (maintPct / 100));
        const totalInvestment = numPrice + maintenanceDeposit;

        const financedPercent = numPrice > 0 ? (financedBalance / numPrice) * 100 : 0;

        // Notify parent callback if subscribed
        if (typeof onPlanChange === 'function') {
            onPlanChange({
                price: numPrice,
                downPaymentPercent: dpPct,
                downPaymentAmount,
                handoverPaymentPercent: handoverPct,
                handoverPaymentAmount,
                financedBalance,
                installmentYears: years,
                installmentFrequency,
                totalInstallments,
                periodicInstallment,
                maintenancePercent: maintPct,
                maintenanceDeposit,
                totalInvestment
            });
        }

        return {
            price: numPrice,
            downPaymentPercent: dpPct,
            downPaymentAmount,
            handoverPaymentPercent: handoverPct,
            handoverPaymentAmount,
            financedBalance,
            financedPercent,
            installmentYears: years,
            installmentFrequency,
            totalInstallments,
            periodicInstallment,
            maintenancePercent: maintPct,
            maintenanceDeposit,
            totalInvestment,
            freqInfo
        };
    }, [price, downPaymentPercent, handoverPaymentPercent, maintenancePercent, installmentYears, installmentFrequency, onPlanChange]);

    // 5. Generate Detailed Installment Schedule
    const schedule = useMemo(() => {
        const {
            price: numPrice,
            downPaymentAmount,
            downPaymentPercent: dpPct,
            financedBalance,
            totalInstallments,
            periodicInstallment,
            handoverPaymentAmount,
            handoverPaymentPercent: handoverPct,
            maintenanceDeposit,
            maintenancePercent: maintPct,
            freqInfo
        } = calculations;

        if (numPrice <= 0) return [];

        const rows = [];
        let cumulativePaid = 0;
        const baseDate = new Date();

        // 1. Contract Signing Down Payment
        cumulativePaid += downPaymentAmount;
        rows.push({
            id: 'milestone-dp',
            number: 'DP',
            type: 'down_payment',
            title: 'Down Payment (Contract Signing)',
            interval: 'Immediate (Signing)',
            date: baseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            amount: downPaymentAmount,
            percent: dpPct,
            cumulativePaid,
            remainingBalance: Math.max(0, numPrice - cumulativePaid),
            isMilestone: true
        });

        // 2. Periodic Installments
        let remainingFinanced = financedBalance;
        for (let i = 1; i <= totalInstallments; i++) {
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(baseDate.getMonth() + (i * freqInfo.intervalMonths));

            // On the final installment, absorb rounding residue so sum matches financedBalance exactly
            const amount = i === totalInstallments
                ? remainingFinanced
                : Math.min(remainingFinanced, periodicInstallment);

            remainingFinanced = Math.max(0, remainingFinanced - amount);
            cumulativePaid += amount;

            const installmentPercent = numPrice > 0 ? (amount / numPrice) * 100 : 0;

            rows.push({
                id: `installment-${i}`,
                number: `#${i}`,
                type: 'installment',
                title: `${freqInfo.label} Installment #${i}`,
                interval: `${freqInfo.tag} ${i} (+${i * freqInfo.intervalMonths} mos)`,
                date: installmentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                amount,
                percent: installmentPercent,
                cumulativePaid,
                remainingBalance: Math.max(0, numPrice - cumulativePaid),
                isMilestone: false
            });
        }

        // 3. Handover Milestone
        if (handoverPaymentAmount > 0) {
            let handoverDateStr = 'Upon Key Delivery';
            if (deliveryDate) {
                const d = new Date(deliveryDate);
                if (!isNaN(d.getTime())) {
                    handoverDateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }
            } else if (totalInstallments > 0) {
                const estDelivery = new Date(baseDate);
                estDelivery.setMonth(baseDate.getMonth() + (totalInstallments * freqInfo.intervalMonths));
                handoverDateStr = estDelivery.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }

            cumulativePaid += handoverPaymentAmount;
            rows.push({
                id: 'milestone-handover',
                number: 'HO',
                type: 'handover',
                title: 'Handover Payment (Key Delivery)',
                interval: 'Completion Milestone',
                date: handoverDateStr,
                amount: handoverPaymentAmount,
                percent: handoverPct,
                cumulativePaid,
                remainingBalance: Math.max(0, numPrice - cumulativePaid),
                isMilestone: true
            });
        }

        // 4. Maintenance Escrow Fund
        if (maintenanceDeposit > 0) {
            let maintDateStr = 'At Handover';
            if (deliveryDate) {
                const d = new Date(deliveryDate);
                if (!isNaN(d.getTime())) {
                    maintDateStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }
            }

            rows.push({
                id: 'milestone-maintenance',
                number: 'MF',
                type: 'maintenance',
                title: 'Maintenance Escrow Deposit',
                interval: 'Delivery Escrow',
                date: maintDateStr,
                amount: maintenanceDeposit,
                percent: maintPct,
                cumulativePaid,
                remainingBalance: 0,
                isMilestone: true
            });
        }

        return rows;
    }, [calculations, deliveryDate]);

    // Filter schedule rows
    const filteredSchedule = useMemo(() => {
        if (scheduleFilter === 'milestones') {
            return schedule.filter(row => row.isMilestone);
        }
        if (scheduleFilter === 'installments') {
            return schedule.filter(row => !row.isMilestone);
        }
        return schedule;
    }, [schedule, scheduleFilter]);

    // Rows to render (clamped if not expanded)
    const displayedRows = useMemo(() => {
        if (isScheduleExpanded) return filteredSchedule;
        return filteredSchedule.slice(0, 8);
    }, [filteredSchedule, isScheduleExpanded]);

    // Copy schedule breakdown to clipboard
    const handleCopySchedule = async () => {
        try {
            const header = `Payment Schedule for ${projectName || developerName || 'Property'} (${formatMoney(calculations.price)})\n`;
            const summary = `Down Payment: ${formatMoney(calculations.downPaymentAmount)} (${calculations.downPaymentPercent}%)\n` +
                `Installments: ${calculations.totalInstallments} x ${formatMoney(calculations.periodicInstallment)} (${calculations.installmentFrequency})\n` +
                `Handover: ${formatMoney(calculations.handoverPaymentAmount)} (${calculations.handoverPaymentPercent}%)\n` +
                `Maintenance: ${formatMoney(calculations.maintenanceDeposit)} (${calculations.maintenancePercent}%)\n\n`;

            const rowsText = schedule.map(r =>
                `${r.number}\t${r.title}\t${r.date}\t${formatMoney(r.amount)}\t${r.percent.toFixed(1)}%\tRemaining: ${formatMoney(r.remainingBalance)}`
            ).join('\n');

            await navigator.clipboard.writeText(header + summary + rowsText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error('Failed to copy schedule:', err);
        }
    };

    return (
        <div className={`${styles.calculatorCard} ${compact ? styles.compact : ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTitleWrap}>
                    <div className={styles.calculatorIcon}>
                        <Calculator size={22} />
                    </div>
                    <div>
                        <h2 className={styles.title}>{title}</h2>
                        {(developerName || projectName) && (
                            <p className={styles.projectSubtitle}>
                                {projectName ? `${projectName} by ${developerName}` : developerName}
                            </p>
                        )}
                    </div>
                </div>

                <div className={styles.headerActions}>
                    {isCustomized && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className={styles.resetButton}
                            title="Reset to property defaults"
                        >
                            <RotateCcw size={14} />
                            <span>Reset Defaults</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Market Presets Pill Bar */}
            <div className={styles.presetsSection}>
                <span className={styles.presetsLabel}>
                    <Sparkles size={14} /> Quick Presets:
                </span>
                <div className={styles.presetButtons}>
                    {MARKET_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={styles.presetButton}
                            onClick={() => handleApplyPreset(preset)}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Interactive Simulation Controls */}
            <div className={styles.controlsGrid}>
                {/* 1. Down Payment Control */}
                <div className={styles.controlBox}>
                    <div className={styles.controlHeader}>
                        <label htmlFor="downPaymentInput" className={styles.controlLabel}>
                            <Percent size={14} /> Down Payment
                        </label>
                        <div className={styles.valueDisplay}>
                            <input
                                id="downPaymentInput"
                                type="number"
                                min="0"
                                max="80"
                                step="1"
                                value={downPaymentPercent}
                                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                className={styles.numberInput}
                            />
                            <span className={styles.percentSymbol}>%</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="60"
                        step="1"
                        value={downPaymentPercent}
                        onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                        className={styles.rangeSlider}
                        aria-label="Down payment percentage"
                    />
                    <div className={styles.subAmount}>
                        {formatMoney(calculations.downPaymentAmount)}
                    </div>
                </div>

                {/* 2. Installment Duration (Years) */}
                <div className={styles.controlBox}>
                    <div className={styles.controlHeader}>
                        <label htmlFor="durationInput" className={styles.controlLabel}>
                            <Calendar size={14} /> Duration (Years)
                        </label>
                        <div className={styles.valueDisplay}>
                            <input
                                id="durationInput"
                                type="number"
                                min="1"
                                max="15"
                                step="1"
                                value={installmentYears}
                                onChange={(e) => setInstallmentYears(Number(e.target.value))}
                                className={styles.numberInput}
                            />
                            <span className={styles.percentSymbol}>Yrs</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={installmentYears}
                        onChange={(e) => setInstallmentYears(Number(e.target.value))}
                        className={styles.rangeSlider}
                        aria-label="Installment duration in years"
                    />
                    <div className={styles.durationPills}>
                        {[1, 3, 5, 7, 8, 10].map(yr => (
                            <button
                                key={yr}
                                type="button"
                                className={`${styles.durationPill} ${installmentYears === yr ? styles.activePill : ''}`}
                                onClick={() => setInstallmentYears(yr)}
                            >
                                {yr}y
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Installment Frequency Selector */}
                <div className={styles.controlBox}>
                    <div className={styles.controlHeader}>
                        <label className={styles.controlLabel}>
                            <Clock size={14} /> Frequency
                        </label>
                        <span className={styles.badgeHint}>
                            {calculations.totalInstallments} total installments
                        </span>
                    </div>
                    <div className={styles.frequencyButtons}>
                        {Object.entries(FREQUENCY_CONFIG).map(([key, cfg]) => (
                            <button
                                key={key}
                                type="button"
                                className={`${styles.freqButton} ${installmentFrequency === key ? styles.activeFreq : ''}`}
                                onClick={() => setInstallmentFrequency(key)}
                            >
                                <span className={styles.freqName}>{cfg.label}</span>
                                <span className={styles.freqSub}>{cfg.multiplier}/yr</span>
                            </button>
                        ))}
                    </div>
                    <div className={styles.subAmount}>
                        {calculations.totalInstallments} periodic installments over {installmentYears} years
                    </div>
                </div>

                {/* 4. Handover Payment Milestone */}
                <div className={styles.controlBox}>
                    <div className={styles.controlHeader}>
                        <label htmlFor="handoverInput" className={styles.controlLabel}>
                            <CreditCard size={14} /> Handover Milestone
                        </label>
                        <div className={styles.valueDisplay}>
                            <input
                                id="handoverInput"
                                type="number"
                                min="0"
                                max="40"
                                step="1"
                                value={handoverPaymentPercent}
                                onChange={(e) => setHandoverPaymentPercent(Number(e.target.value))}
                                className={styles.numberInput}
                            />
                            <span className={styles.percentSymbol}>%</span>
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={handoverPaymentPercent}
                        onChange={(e) => setHandoverPaymentPercent(Number(e.target.value))}
                        className={styles.rangeSlider}
                        aria-label="Handover payment percentage"
                    />
                    <div className={styles.subAmount}>
                        {formatMoney(calculations.handoverPaymentAmount)}
                    </div>
                </div>
            </div>

            {/* Advanced Toggle (Maintenance Deposit) */}
            <div className={styles.advancedToggleRow}>
                <button
                    type="button"
                    className={styles.advancedToggleBtn}
                    onClick={() => setShowAdvanced(prev => !prev)}
                >
                    <Sliders size={14} />
                    <span>{showAdvanced ? 'Hide Additional Deposit Options' : 'Adjust Maintenance Escrow Deposit'}</span>
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {showAdvanced && (
                <div className={styles.advancedControls}>
                    <div className={styles.controlBox}>
                        <div className={styles.controlHeader}>
                            <label htmlFor="maintenanceInput" className={styles.controlLabel}>
                                <ShieldCheck size={14} /> Maintenance Escrow Fund
                            </label>
                            <div className={styles.valueDisplay}>
                                <input
                                    id="maintenanceInput"
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="1"
                                    value={maintenancePercent}
                                    onChange={(e) => setMaintenancePercent(Number(e.target.value))}
                                    className={styles.numberInput}
                                />
                                <span className={styles.percentSymbol}>%</span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="15"
                            step="1"
                            value={maintenancePercent}
                            onChange={(e) => setMaintenancePercent(Number(e.target.value))}
                            className={styles.rangeSlider}
                            aria-label="Maintenance deposit percentage"
                        />
                        <div className={styles.subAmount}>
                            {formatMoney(calculations.maintenanceDeposit)} (held in compound escrow fund)
                        </div>
                    </div>
                </div>
            )}

            {/* Stacked Financial Allocation Bar */}
            <div className={styles.allocationBarContainer}>
                <div className={styles.allocationBarHeader}>
                    <span>Financial Structure Allocation</span>
                    <span className={styles.allocationTotal}>Total: {formatMoney(calculations.price)}</span>
                </div>
                <div className={styles.stackedBar}>
                    <div
                        className={styles.barSegmentDp}
                        style={{ width: `${calculations.downPaymentPercent}%` }}
                        title={`Down Payment: ${calculations.downPaymentPercent}% (${formatMoney(calculations.downPaymentAmount)})`}
                    />
                    <div
                        className={styles.barSegmentFinanced}
                        style={{ width: `${calculations.financedPercent}%` }}
                        title={`Financed Balance: ${calculations.financedPercent.toFixed(1)}% (${formatMoney(calculations.financedBalance)})`}
                    />
                    <div
                        className={styles.barSegmentHandover}
                        style={{ width: `${calculations.handoverPaymentPercent}%` }}
                        title={`Handover Milestone: ${calculations.handoverPaymentPercent}% (${formatMoney(calculations.handoverPaymentAmount)})`}
                    />
                </div>
                <div className={styles.allocationLegend}>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.dotDp}`} />
                        <span>Down Payment ({calculations.downPaymentPercent}%)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.dotFinanced}`} />
                        <span>Installments ({calculations.financedPercent.toFixed(0)}%)</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.dotHandover}`} />
                        <span>Handover ({calculations.handoverPaymentPercent}%)</span>
                    </div>
                    {calculations.maintenanceDeposit > 0 && (
                        <div className={styles.legendItem}>
                            <span className={`${styles.legendDot} ${styles.dotMaint}`} />
                            <span>Maintenance Escrow (+{calculations.maintenancePercent}%)</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Key KPI Metrics Cards */}
            <div className={styles.metricsGrid}>
                {/* 1. Down Payment Amount */}
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Down Payment ({calculations.downPaymentPercent}%)</span>
                    <div className={styles.metricValuePrimary}>
                        {formatMoney(calculations.downPaymentAmount)}
                    </div>
                    <span className={styles.metricSub}>Due at contract signing</span>
                </div>

                {/* 2. Periodic Installment Amount */}
                <div className={`${styles.metricCard} ${styles.metricCardHighlight}`}>
                    <div className={styles.highlightHeader}>
                        <span className={styles.metricLabel}>Periodic Payment</span>
                        <span className={styles.freqTag}>{calculations.freqInfo.label}</span>
                    </div>
                    <div className={styles.metricValueLarge}>
                        {formatMoney(calculations.periodicInstallment)}
                    </div>
                    <span className={styles.metricSub}>
                        {calculations.totalInstallments} equal payments
                    </span>
                </div>

                {/* 3. Financed Balance */}
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Financed Balance</span>
                    <div className={styles.metricValue}>
                        {formatMoney(calculations.financedBalance)}
                    </div>
                    <span className={styles.metricSub}>Spread over {installmentYears} years</span>
                </div>

                {/* 4. Handover Payment */}
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Handover ({calculations.handoverPaymentPercent}%)</span>
                    <div className={styles.metricValue}>
                        {formatMoney(calculations.handoverPaymentAmount)}
                    </div>
                    <span className={styles.metricSub}>Due upon delivery</span>
                </div>

                {/* 5. Maintenance Deposit */}
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Maintenance Deposit</span>
                    <div className={styles.metricValue}>
                        {formatMoney(calculations.maintenanceDeposit)}
                    </div>
                    <span className={styles.metricSub}>
                        {calculations.maintenancePercent}% escrow deposit
                    </span>
                </div>

                {/* 6. Total Commitment */}
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Total Investment</span>
                    <div className={styles.metricValue}>
                        {formatMoney(calculations.totalInvestment)}
                    </div>
                    <span className={styles.metricSub}>Price + Maintenance</span>
                </div>
            </div>

            {/* Installment Breakdown Schedule Table */}
            <div className={styles.scheduleSection}>
                <div className={styles.scheduleHeader}>
                    <div>
                        <h3 className={styles.scheduleTitle}>Payment Schedule Breakdown</h3>
                        <p className={styles.scheduleSubtitle}>
                            Estimated payment milestone timetable based on {calculations.freqInfo.label.toLowerCase()} installments
                        </p>
                    </div>

                    <div className={styles.scheduleActions}>
                        {/* Filter Tabs */}
                        <div className={styles.filterTabs}>
                            <button
                                type="button"
                                className={`${styles.filterTab} ${scheduleFilter === 'all' ? styles.activeFilter : ''}`}
                                onClick={() => setScheduleFilter('all')}
                            >
                                All ({schedule.length})
                            </button>
                            <button
                                type="button"
                                className={`${styles.filterTab} ${scheduleFilter === 'installments' ? styles.activeFilter : ''}`}
                                onClick={() => setScheduleFilter('installments')}
                            >
                                Installments ({calculations.totalInstallments})
                            </button>
                            <button
                                type="button"
                                className={`${styles.filterTab} ${scheduleFilter === 'milestones' ? styles.activeFilter : ''}`}
                                onClick={() => setScheduleFilter('milestones')}
                            >
                                Milestones
                            </button>
                        </div>

                        {/* Copy Schedule */}
                        <button
                            type="button"
                            className={styles.copyButton}
                            onClick={handleCopySchedule}
                            title="Copy schedule to clipboard"
                        >
                            {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                            <span>{copied ? 'Copied' : 'Copy Schedule'}</span>
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className={styles.tableResponsive}>
                    <table className={styles.scheduleTable}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Milestone / Payment</th>
                                <th>Interval Timing</th>
                                <th>Estimated Due</th>
                                <th>Amount ({currency})</th>
                                <th>% of Price</th>
                                <th>Cumulative Paid</th>
                                <th>Remaining Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={row.isMilestone ? styles.milestoneRow : ''}
                                >
                                    <td className={styles.colNumber}>
                                        <span className={`${styles.badgeNumber} ${row.isMilestone ? styles.badgeMilestone : ''}`}>
                                            {row.number}
                                        </span>
                                    </td>
                                    <td className={styles.colTitle}>
                                        <span className={styles.rowTitle}>{row.title}</span>
                                    </td>
                                    <td className={styles.colInterval}>{row.interval}</td>
                                    <td className={styles.colDate}>{row.date}</td>
                                    <td className={styles.colAmount}>
                                        <span className={row.isMilestone ? styles.boldAmount : ''}>
                                            {formatMoney(row.amount)}
                                        </span>
                                    </td>
                                    <td className={styles.colPercent}>{row.percent.toFixed(1)}%</td>
                                    <td className={styles.colCumulative}>{formatMoney(row.cumulativePaid)}</td>
                                    <td className={styles.colRemaining}>{formatMoney(row.remainingBalance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Show All / Show Less Toggle Button */}
                {filteredSchedule.length > 8 && (
                    <div className={styles.expandRow}>
                        <button
                            type="button"
                            className={styles.expandButton}
                            onClick={() => setIsScheduleExpanded(prev => !prev)}
                        >
                            <span>
                                {isScheduleExpanded
                                    ? 'Show Less (First 8 Installments)'
                                    : `View All ${filteredSchedule.length} Installment Milestones`}
                            </span>
                            {isScheduleExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Disclaimer Footer */}
            <div className={styles.disclaimer}>
                <Info size={14} />
                <span>
                    Calculations are estimates intended for buyer guidance and simulation. Exact developer contract schedules, delivery milestones, and escrow disbursements are subject to official sale agreement terms.
                </span>
            </div>
        </div>
    );
};

PaymentPlanCalculator.propTypes = {
    price: PropTypes.number,
    currency: PropTypes.string,
    paymentPlan: PropTypes.shape({
        downPaymentPercent: PropTypes.number,
        installmentYears: PropTypes.number,
        installmentFrequency: PropTypes.oneOf(['monthly', 'quarterly', 'semi_annual', 'annual']),
        handoverPaymentPercent: PropTypes.number,
        maintenancePercent: PropTypes.number
    }),
    deliveryDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    developerName: PropTypes.string,
    projectName: PropTypes.string,
    title: PropTypes.string,
    compact: PropTypes.bool,
    onPlanChange: PropTypes.func
};

export default PaymentPlanCalculator;
