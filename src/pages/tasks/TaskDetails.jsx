import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { useLanguage } from '@/hooks/useLanguage';
import Button from '@/components/ui/Button';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const { data, isLoading, error } = useQuery({
        queryKey: ['task', id],
        queryFn: () => taskService.getTask(id)
    });

    if (isLoading) return <div style={{ padding: '2rem' }}>Loading task...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error loading task</div>;

    const task = data?.data;

    if (!task) return <div style={{ padding: '2rem' }}>Task not found</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{task.title}</h1>
                <Button onClick={() => navigate(-1)} variant="outline">Back</Button>
            </div>
            
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{task.status}</span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Priority:</strong> <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{task.type}</span>
                </div>
                {task.dueDate && (
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Due Date:</strong> {new Date(task.dueDate).toLocaleString()}
                    </div>
                )}
                {task.assignedTo && (
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Assigned To:</strong> {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </div>
                )}
                {task.description && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                        <strong>Description:</strong>
                        <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: '#4b5563', lineHeight: '1.5' }}>{task.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
