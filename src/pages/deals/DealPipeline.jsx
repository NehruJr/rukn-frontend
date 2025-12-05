import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { dealService } from '@/services/dealService';
import { DEAL_STAGES } from '@/utils/constants';
import styles from './DealPipeline.module.css';

const DealPipeline = () => {
    const [activeId, setActiveId] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['deal-pipeline'],
        queryFn: () => dealService.getPipeline()
    });

    const updateStageMutation = useMutation({
        mutationFn: ({ dealId, stage }) => dealService.updateDealStage(dealId, stage),
        onSuccess: () => queryClient.invalidateQueries(['deal-pipeline'])
    });

    const pipeline = data?.data?.pipeline || {};
    const stats = data?.data?.stats || {};

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) {
            setActiveId(null);
            return;
        }

        const dealId = active.id;
        const newStage = over.id;

        updateStageMutation.mutate({ dealId, stage: newStage });
        setActiveId(null);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(value);
    };

    const allDeals = Object.values(pipeline).flat();
    const activeDeal = activeId ? allDeals.find(d => d._id === activeId) : null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Deal Pipeline</h1>
                    <p>Drag and drop deals to update their stage</p>
                </div>
                <a href="/deals" className={styles.listViewLink}>List View</a>
            </div>

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Deals</div>
                    <div className={styles.statValue}>{stats.totalDeals || 0}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Value</div>
                    <div className={styles.statValue}>{formatCurrency(stats.totalValue || 0)}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Avg Probability</div>
                    <div className={styles.statValue}>{Math.round(stats.averageProbability || 0)}%</div>
                </div>
            </div>

            {isLoading && <div className={styles.loading}>Loading pipeline...</div>}

            {!isLoading && (
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
                    <div className={styles.pipeline}>
                        {DEAL_STAGES.map(stage => (
                            <DroppableColumn
                                key={stage.value}
                                id={stage.value}
                                title={stage.label}
                                deals={pipeline[stage.value] || []}
                                formatCurrency={formatCurrency}
                            />
                        ))}
                    </div>
                    <DragOverlay>
                        {activeDeal && <DealCard deal={activeDeal} formatCurrency={formatCurrency} isDragging />}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    );
};

const DroppableColumn = ({ id, title, deals, formatCurrency }) => {
    const { setNodeRef } = useDroppable({ id });

    const getStageColor = (stage) => {
        const colors = {
            negotiation: '#F59E0B', contract_sent: '#3B82F6', contract_signed: '#8B5CF6',
            payment_pending: '#EF4444', completed: '#10B981', cancelled: '#6B7280'
        };
        return colors[stage] || '#6B7280';
    };

    return (
        <div ref={setNodeRef} className={styles.column}>
            <div className={styles.columnHeader} style={{ borderTopColor: getStageColor(id) }}>
                <h3>{title}</h3>
                <span className={styles.count}>{deals.length}</span>
            </div>
            <div className={styles.columnContent}>
                {deals.map(deal => (
                    <DraggableDealCard key={deal._id} deal={deal} formatCurrency={formatCurrency} />
                ))}
                {deals.length === 0 && <div className={styles.emptyColumn}>No deals</div>}
            </div>
        </div>
    );
};

const DraggableDealCard = ({ deal, formatCurrency }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal._id });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <DealCard deal={deal} formatCurrency={formatCurrency} />
        </div>
    );
};

const DealCard = ({ deal, formatCurrency, isDragging = false }) => (
    <a href={`/deals/${deal._id}`} className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
        onClick={(e) => isDragging && e.preventDefault()}>
        <div className={styles.cardHeader}>
            <div className={styles.dealNumber}>{deal.dealNumber}</div>
            <div className={styles.probability}>{deal.probability}%</div>
        </div>
        <div className={styles.title}>{deal.title}</div>
        <div className={styles.value}>{formatCurrency(deal.dealValue)}</div>
        {deal.lead && (
            <div className={styles.lead}>{deal.lead.firstName} {deal.lead.lastName}</div>
        )}
        {deal.agent && (
            <div className={styles.agent}>{deal.agent.firstName} {deal.agent.lastName}</div>
        )}
        {deal.expectedCloseDate && (
            <div className={styles.date}>Expected: {new Date(deal.expectedCloseDate).toLocaleDateString()}</div>
        )}
    </a>
);

export default DealPipeline;
