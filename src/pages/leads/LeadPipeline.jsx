import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { leadService } from '@/services/leadService';
import { LEAD_STATUSES, LEAD_PRIORITIES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import { Search, Filter } from 'lucide-react';
import Input from '@/components/ui/Input';
import styles from './LeadPipeline.module.css';

const LeadPipeline = () => {
    const [filters, setFilters] = useState({
        search: '',
        priority: '',
        assignedTo: ''
    });
    const [activeId, setActiveId] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['leads', filters],
        queryFn: () => leadService.getLeads({ ...filters, limit: 1000 })
    });

    const updateLeadMutation = useMutation({
        mutationFn: ({ leadId, status }) => leadService.updateLead(leadId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries(['leads']);
        }
    });

    const leads = data?.data || [];

    // Group leads by status
    const groupedLeads = LEAD_STATUSES.reduce((acc, status) => {
        acc[status.value] = leads.filter(lead => lead.status === status.value);
        return acc;
    }, {});

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const leadId = active.id;
        const newStatus = over.id;

        const lead = leads.find(l => l._id === leadId);
        if (lead && lead.status !== newStatus) {
            updateLeadMutation.mutate({ leadId, status: newStatus });
        }

        setActiveId(null);
    };

    const getPriorityColor = (priority) => {
        return LEAD_PRIORITIES.find(p => p.value === priority)?.color || '#6B7280';
    };

    const activeLead = activeId ? leads.find(l => l._id === activeId) : null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Lead Pipeline</h1>
                    <p>Drag and drop leads to update their status</p>
                </div>
            </div>

            <div className={styles.toolbar}>
                <Input
                    placeholder="Search leads..."
                    leftIcon={<Search size={18} />}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={styles.searchInput}
                />

                <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className={styles.select}
                >
                    <option value="">All Priorities</option>
                    {LEAD_PRIORITIES.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                </select>

                <Button variant="outline" leftIcon={<Filter size={18} />}>
                    More Filters
                </Button>
            </div>

            {isLoading && <div className={styles.loading}>Loading pipeline...</div>}

            {!isLoading && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className={styles.pipeline}>
                        {LEAD_STATUSES.map(status => (
                            <DroppableColumn
                                key={status.value}
                                id={status.value}
                                title={status.label}
                                color={status.color}
                                leads={groupedLeads[status.value] || []}
                                getPriorityColor={getPriorityColor}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeLead && (
                            <LeadCard
                                lead={activeLead}
                                getPriorityColor={getPriorityColor}
                                isDragging
                            />
                        )}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    );
};

// Droppable Column Component
const DroppableColumn = ({ id, title, color, leads, getPriorityColor }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={styles.column}>
            <div className={styles.columnHeader} style={{ borderTopColor: color }}>
                <h3>{title}</h3>
                <span className={styles.count}>{leads.length}</span>
            </div>
            <div className={styles.columnContent}>
                {leads.map(lead => (
                    <DraggableLeadCard
                        key={lead._id}
                        lead={lead}
                        getPriorityColor={getPriorityColor}
                    />
                ))}
                {leads.length === 0 && (
                    <div className={styles.emptyColumn}>No leads</div>
                )}
            </div>
        </div>
    );
};

// Draggable Lead Card Component
const DraggableLeadCard = ({ lead, getPriorityColor }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead._id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
        >
            <LeadCard lead={lead} getPriorityColor={getPriorityColor} />
        </div>
    );
};

// Lead Card Component
const LeadCard = ({ lead, getPriorityColor, isDragging = false }) => {
    return (
        <a
            href={`/leads/${lead._id}`}
            className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
            onClick={(e) => isDragging && e.preventDefault()}
        >
            <div className={styles.cardHeader}>
                <div className={styles.leadName}>
                    <div className={styles.avatar}>
                        {lead.firstName?.[0]}{lead.lastName?.[0]}
                    </div>
                    <div>
                        <div className={styles.name}>{lead.firstName} {lead.lastName}</div>
                        <div className={styles.phone}>{lead.phone}</div>
                    </div>
                </div>
                <span
                    className={styles.priorityBadge}
                    style={{ backgroundColor: `${getPriorityColor(lead.priority)}15`, color: getPriorityColor(lead.priority) }}
                >
                    {lead.priority}
                </span>
            </div>

            {lead.email && (
                <div className={styles.email}>{lead.email}</div>
            )}

            {lead.latestNote && (
                <div className={styles.note}>{lead.latestNote}</div>
            )}

            <div className={styles.cardFooter}>
                <span className={styles.source}>{lead.source}</span>
                {lead.assignedTo && (
                    <span className={styles.agent}>
                        {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                    </span>
                )}
            </div>
        </a>
    );
};

// Import missing hooks
import { useDraggable, useDroppable } from '@dnd-kit/core';

export default LeadPipeline;
