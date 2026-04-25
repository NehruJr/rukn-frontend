import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dealService } from '@/services/dealService';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, User, MapPin, DollarSign, Calendar, Edit2, Trash2 } from 'lucide-react';
import { DEAL_STAGES, DEAL_STATUSES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import styles from './DealDetails.module.css';

const DealDetails = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasRole } = useAuthStore();
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeal();
    }, [id]);

    const fetchDeal = async () => {
        try {
            setLoading(true);
            const response = await dealService.getDeal(id);
            setDeal(response?.data ?? response);
        } catch (err) {
            console.error('Error fetching deal:', err);
            alert('Failed to load deal details');
            navigate('/deals');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this deal?')) {
            try {
                await dealService.deleteDeal(id);
                navigate('/deals');
            } catch (err) {
                console.error('Error deleting deal:', err);
                alert('Failed to delete deal');
            }
        }
    };

    if (loading) return <div className={styles.loading}>{t('dashboard_extra.loading_deal_details') || 'Loading Deal Details...'}</div>;
    if (!deal) return null;

    const canDelete = hasRole('admin', 'manager') || user?._id === deal.agent?._id;

    const getStageLabel = (stageValue) => {
        return DEAL_STAGES.find(s => s.value === stageValue)?.label || stageValue;
    };

    const getStatusLabel = (statusValue) => {
        return DEAL_STATUSES.find(s => s.value === statusValue)?.label || statusValue;
    };

    return (
        <div className={styles.container}>
            <button onClick={() => navigate('/deals')} className={styles.backButton}>
                <ArrowLeft size={20} />{t('dashboard_extra.back_to_deals') || 'Back to Deals'}
            </button>

            <div className={styles.header}>
                <div>
                    <div className={styles.badges}>
                        <span className={`${styles.badge} ${styles[deal.status] || ''}`}>
                            {getStatusLabel(deal.status)}
                        </span>
                        <span className={styles.stageBadge}>
                            {getStageLabel(deal.stage)}
                        </span>
                    </div>
                    <h1 className={styles.title}>{deal.title}</h1>
                    <div className={styles.dealNumber}>
                        Deal #{deal.dealNumber}
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.price}>
                        {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: deal.currency || 'EGP',
                            maximumFractionDigits: 0
                        }).format(deal.dealValue)}
                    </div>
                    <div className={styles.actionButtons}>
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className={`${styles.iconButton} ${styles.deleteButton}`}
                                title="Delete"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.mainContent}>
                    <div className={styles.section}>
                        <h2>Overview</h2>
                        <div className={styles.features}>
                            <div className={styles.featureItem}>
                                <DollarSign size={24} />
                                <div>
                                    <span className={styles.featureValue}>{deal.probability}%</span>
                                    <span className={styles.featureLabel}>Probability</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Calendar size={24} />
                                <div>
                                    <span className={styles.featureValue}>
                                        {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                    <span className={styles.featureLabel}>Expected Close</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2>Notes</h2>
                        <p className={styles.description}>{deal.notes || 'No notes available.'}</p>
                    </div>
                </div>

                <div className={styles.sidebar}>
                    {deal.lead && (
                        <div className={styles.detailsCard}>
                            <h3>Associated Lead</h3>
                            <div className={styles.detailRow}>
                                <User size={16} />
                                <span><Link to={`/leads/${deal.lead._id}`}>{deal.lead.firstName} {deal.lead.lastName}</Link></span>
                            </div>
                            {deal.lead.email && (
                                <div className={styles.detailRow}>
                                    <span>{deal.lead.email}</span>
                                </div>
                            )}
                            {deal.lead.phone && (
                                <div className={styles.detailRow}>
                                    <span>{deal.lead.phone}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {deal.property && (
                        <div className={styles.detailsCard}>
                            <h3>Associated Property</h3>
                            <div className={styles.detailRow}>
                                <span><Link to={`/properties/${deal.property._id}`}>{deal.property.title}</Link></span>
                            </div>
                            <div className={styles.detailRow}>
                                <MapPin size={16} />
                                <span>{deal.property.location?.city || 'N/A'}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span>
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'EGP',
                                    maximumFractionDigits: 0
                                }).format(deal.property.price)}
                                </span>
                            </div>
                        </div>
                    )}

                    {deal.agent && (
                        <div className={styles.agentCard}>
                            <h3>Assigned Agent</h3>
                            <div className={styles.agentInfo}>
                                <div className={styles.agentAvatar}>
                                    {deal.agent.firstName?.[0]}{deal.agent.lastName?.[0]}
                                </div>
                                <div>
                                    <h4>{deal.agent.firstName} {deal.agent.lastName}</h4>
                                    <p>{deal.agent.email}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DealDetails;
