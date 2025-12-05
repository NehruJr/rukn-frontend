import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { taskService } from '@/services/taskService';
import { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } from '@/utils/constants';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import TaskForm from '@/components/TaskForm';
import styles from './Calendar.module.css';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const { data: tasksData } = useQuery({
        queryKey: ['calendar-tasks', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
        queryFn: () => taskService.getCalendarTasks(
            format(monthStart, 'yyyy-MM-dd'),
            format(monthEnd, 'yyyy-MM-dd')
        )
    });

    const tasks = tasksData?.data || [];

    const createTaskMutation = useMutation({
        mutationFn: (taskData) => taskService.createTask(taskData),
        onSuccess: () => {
            queryClient.invalidateQueries(['calendar-tasks']);
            setIsModalOpen(false);
        }
    });

    const getTasksForDate = (date) => {
        return tasks.filter(task =>
            task.dueDate && isSameDay(new Date(task.dueDate), date)
        );
    };

    const getPriorityColor = (priority) => {
        return TASK_PRIORITIES.find(p => p.value === priority)?.color || '#6B7280';
    };

    const selectedDateTasks = getTasksForDate(selectedDate);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Calendar</h1>
                    <p>Manage your tasks and schedule</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    Add Task
                </Button>
            </div>

            <div className={styles.content}>
                <div className={styles.calendarSection}>
                    <div className={styles.calendarHeader}>
                        <button className={styles.navButton} onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <ChevronLeft size={20} />
                        </button>
                        <h2>{format(currentDate, 'MMMM yyyy')}</h2>
                        <button className={styles.navButton} onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <MonthView
                        currentDate={currentDate}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        getTasksForDate={getTasksForDate}
                        getPriorityColor={getPriorityColor}
                    />
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h3>{format(selectedDate, 'MMMM d, yyyy')}</h3>
                        <span className={styles.taskCount}>{selectedDateTasks.length} tasks</span>
                    </div>

                    <div className={styles.taskList}>
                        {selectedDateTasks.length === 0 && (
                            <div className={styles.emptyState}>
                                <p>No tasks for this day</p>
                                <Button size="sm" onClick={() => setIsModalOpen(true)}>Add Task</Button>
                            </div>
                        )}

                        {selectedDateTasks.map(task => (
                            <TaskCard key={task._id} task={task} getPriorityColor={getPriorityColor} />
                        ))}
                    </div>
                </div>
            </div>

            <TaskForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={(data) => createTaskMutation.mutate(data)}
                initialDate={selectedDate}
            />
        </div>
    );
};

const MonthView = ({ currentDate, selectedDate, onSelectDate, getTasksForDate, getPriorityColor }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startDayOfWeek = monthStart.getDay();

    return (
        <div className={styles.calendar}>
            <div className={styles.weekHeader}>
                {weekDays.map(day => (
                    <div key={day} className={styles.weekDay}>{day}</div>
                ))}
            </div>

            <div className={styles.daysGrid}>
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className={styles.emptyDay} />
                ))}

                {days.map(day => {
                    const dayTasks = getTasksForDate(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div
                            key={day.toISOString()}
                            className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
                            onClick={() => onSelectDate(day)}
                        >
                            <div className={styles.dayNumber}>{format(day, 'd')}</div>
                            <div className={styles.dayTasks}>
                                {dayTasks.slice(0, 3).map(task => (
                                    <div
                                        key={task._id}
                                        className={styles.taskDot}
                                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                                        title={task.title}
                                    />
                                ))}
                                {dayTasks.length > 3 && (
                                    <div className={styles.moreIndicator}>+{dayTasks.length - 3}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TaskCard = ({ task, getPriorityColor }) => {
    const getTypeLabel = (type) => {
        return TASK_TYPES.find(t => t.value === type)?.label || type;
    };

    return (
        <a href={`/tasks/${task._id}`} className={styles.taskCard}>
            <div className={styles.taskHeader}>
                <span
                    className={styles.priorityBadge}
                    style={{
                        backgroundColor: `${getPriorityColor(task.priority)}15`,
                        color: getPriorityColor(task.priority)
                    }}
                >
                    {task.priority}
                </span>
                <span className={styles.taskTime}>{task.dueTime || 'All day'}</span>
            </div>

            <div className={styles.taskTitle}>{task.title}</div>

            {task.description && (
                <div className={styles.taskDescription}>{task.description}</div>
            )}

            <div className={styles.taskFooter}>
                <span className={styles.taskType}>{getTypeLabel(task.type)}</span>
                {task.assignedTo && (
                    <span className={styles.taskAssignee}>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                )}
            </div>
        </a>
    );
};

export default Calendar;
