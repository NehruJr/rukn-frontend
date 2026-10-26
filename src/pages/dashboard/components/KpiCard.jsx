import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './KpiCard.module.css';

const Sparkline = ({ data = [], color = 'var(--color-primary-600)' }) => {
  if (!data || data.length < 2) return null;

  const width = 100;
  const height = 32;
  const values = data.map((d) => d.value ?? 0);
  const min = Math.min(...values);
  const max = Math.max(...values, min + 1);

  const points = values
    .map((val, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const y = height - ((val - min) / (max - min)) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className={styles.sparklineContainer} aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.sparklineSvg}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
};

const KpiCard = ({
  id,
  title,
  value,
  subText,
  change,
  trend = 'flat',
  icon: Icon,
  color = 'var(--color-primary-600)',
  href,
  sparkline = [],
  byCurrency = []
}) => {
  const { t } = useLanguage();

  const renderTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} className={styles.trendIcon} aria-hidden="true" />;
      case 'down':
        return <TrendingDown size={14} className={styles.trendIcon} aria-hidden="true" />;
      case 'new':
        return <Sparkles size={14} className={styles.trendIcon} aria-hidden="true" />;
      case 'flat':
      default:
        return <Minus size={14} className={styles.trendIcon} aria-hidden="true" />;
    }
  };

  const trendLabel = trend === 'new'
    ? t('dashboard.changeNew')
    : `${change || '0%'} ${t('dashboard.vsLastPeriod')}`;

  const otherCurrencies = byCurrency.filter((c, idx) => idx > 0);

  const cardContent = (
    <>
      <div className={styles.topRow}>
        <div className={styles.iconWrapper} style={{ backgroundColor: `${color}15`, color }}>
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className={styles.trendWrapper}>
          <span
            className={`${styles.trendBadge} ${styles[trend]}`}
            title={trendLabel}
          >
            {renderTrendIcon()}
            <span>{trend === 'new' ? t('dashboard.changeNew') : change}</span>
          </span>
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <div className={styles.valueRow}>
          <h3 className={styles.value}>{value}</h3>
          {sparkline.length > 0 && <Sparkline data={sparkline} color={color} />}
        </div>

        {subText && <p className={styles.subText}>{subText}</p>}

        {otherCurrencies.length > 0 && (
          <div className={styles.multiCurrencyNotice}>
            <span className={styles.otherCurrencyBadge}>
              {t(
                otherCurrencies.length === 1
                  ? 'dashboard.otherCurrencies'
                  : 'dashboard.otherCurrenciesPlural',
                { count: otherCurrencies.length }
              )}
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={styles.card}
        aria-label={`${title}: ${value}. ${trendLabel}`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={styles.card} aria-label={`${title}: ${value}. ${trendLabel}`}>
      {cardContent}
    </div>
  );
};

export default KpiCard;
