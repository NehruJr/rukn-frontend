import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  DollarSign,
  Building,
  MapPin,
  Home,
  Tag,
  Clock,
  AlertCircle,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { aiService } from '@/services/aiService';
import { leadService } from '@/services/leadService';
import { taskService } from '@/services/taskService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import styles from './AINoteExtractor.module.css';

const AINoteExtractor = ({ lead, onSuccess }) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const handleExtract = async () => {
    if (!rawText.trim()) {
      addToast({ type: 'warning', message: 'Please enter or paste notes first.' });
      return;
    }

    setIsExtracting(true);
    setError(null);
    try {
      const res = await aiService.extractLeadNote({
        rawText: rawText.trim(),
        leadId: lead?._id
      });

      if (res?.data) {
        setExtractedData(res.data);
        addToast({ type: 'success', message: 'Structured data extracted by Gemini AI!' });
      } else {
        throw new Error('Invalid extraction response');
      }
    } catch (err) {
      console.error('Note extraction error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to extract note');
      addToast({ type: 'error', message: 'AI extraction failed. Please retry.' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyAndSchedule = async () => {
    if (!extractedData || !lead?._id) return;

    setIsApplying(true);
    try {
      // 1. Prepare lead update payload
      const leadPayload = {
        priority: extractedData.priority || lead.priority || 'warm',
        propertyType: extractedData.propertyType || lead.propertyType,
        transactionType: extractedData.transactionType || lead.transactionType || 'sale',
        budget: {
          min: extractedData.budget?.min ?? lead.budget?.min ?? 0,
          max: extractedData.budget?.max ?? lead.budget?.max ?? 0,
          currency: extractedData.budget?.currency || lead.budget?.currency || 'EGP'
        },
        location: {
          city: extractedData.location?.city || lead.location?.city || '',
          area: extractedData.location?.area || lead.location?.area || ''
        },
        requirements: {
          ...(lead.requirements || {}),
          notes: extractedData.summaryNote || lead.requirements?.notes || '',
          bedrooms: extractedData.bedrooms != null
            ? (typeof extractedData.bedrooms === 'object'
                ? extractedData.bedrooms
                : { min: Number(extractedData.bedrooms), max: Number(extractedData.bedrooms) })
            : lead.requirements?.bedrooms
        }
      };

      // 2. Update Lead via leadService
      await leadService.updateLead(lead._id, leadPayload);

      // 3. Create Follow-up Task via taskService if suggestedTask exists
      let createdTaskTitle = null;
      if (extractedData.suggestedTask) {
        const taskPayload = {
          title: extractedData.suggestedTask.title || `Follow up with ${lead.firstName} ${lead.lastName}`,
          description: `AI Extracted Follow-up: ${extractedData.summaryNote || ''}`,
          type: extractedData.suggestedTask.type || 'call',
          dueDate: extractedData.suggestedTask.dueDate || new Date().toISOString().substring(0, 10),
          dueTime: extractedData.suggestedTask.dueTime || '14:00',
          priority: extractedData.suggestedTask.priority || 'high',
          relatedLead: lead._id,
          assignedTo: lead.assignedTo?._id || user?._id
        };
        await taskService.createTask(taskPayload);
        createdTaskTitle = taskPayload.title;
      }

      // 4. Log Activity Note via leadService.addActivity
      await leadService.addActivity(lead._id, {
        type: 'note',
        title: 'Smart AI Note Extracted & Profile Updated',
        description: `Extracted: ${extractedData.summaryNote || 'Requirements synced'}${createdTaskTitle ? ` | Task: "${createdTaskTitle}"` : ''}`
      });

      // 5. Invalidate Queries
      queryClient.invalidateQueries(['lead', lead._id]);
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['tasks']);
      queryClient.invalidateQueries(['calendar-tasks']);
      queryClient.invalidateQueries(['lead-matches', lead._id]);

      addToast({
        type: 'success',
        message: 'Lead updated & follow-up task scheduled successfully!'
      });

      // Reset extraction state
      setExtractedData(null);
      setRawText('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to apply extracted lead data:', err);
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update lead and schedule task'
      });
    } finally {
      setIsApplying(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'hot':
        return styles.priorityHot;
      case 'warm':
        return styles.priorityWarm;
      case 'cold':
        return styles.priorityCold;
      default:
        return styles.priorityWarm;
    }
  };

  const formatBudgetDisplay = (budget) => {
    if (!budget) return 'N/A';
    const currency = budget.currency || 'EGP';
    if (budget.min && budget.max) {
      return `${Number(budget.min).toLocaleString()} – ${Number(budget.max).toLocaleString()} ${currency}`;
    }
    if (budget.max) {
      return `Up to ${Number(budget.max).toLocaleString()} ${currency}`;
    }
    if (budget.min) {
      return `From ${Number(budget.min).toLocaleString()} ${currency}`;
    }
    return 'Not specified';
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <div className={styles.titleRow}>
            <Sparkles size={20} className={styles.headerSparkle} />
            <h3 className={styles.title}>Smart AI Call/WhatsApp Note Extractor</h3>
            <span className={styles.aiBadge}>Gemini AI Co-Pilot</span>
          </div>
          <p className={styles.subtitle}>
            Paste unstructured phone notes, call transcripts, or WhatsApp messages. AI extracts CRM fields and schedules an automatic task.
          </p>
        </div>
      </div>

      {/* Input Textarea Area */}
      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          rows={3}
          placeholder="e.g. Spoke to Dr. Tarek. Looking for 3BR duplex in New Cairo up to 12M EGP. Wants Palm Hills. Urgent viewing Friday at 3:00 PM."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={isExtracting || isApplying}
        />
        <div className={styles.inputActions}>
          {rawText && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setRawText('');
                setExtractedData(null);
                setError(null);
              }}
              disabled={isExtracting || isApplying}
            >
              <RotateCcw size={14} /> Clear
            </button>
          )}
          <button
            type="button"
            className={styles.extractBtn}
            onClick={handleExtract}
            disabled={isExtracting || !rawText.trim()}
          >
            <Sparkles size={16} className={isExtracting ? styles.spinning : ''} />
            <span>{isExtracting ? 'Extracting with AI...' : 'Extract with AI'}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Structured Preview Card */}
      {extractedData && (
        <div className={styles.previewContainer}>
          <div className={styles.previewHeader}>
            <h4>Extracted Lead Intelligence</h4>
            <span className={`${styles.priorityBadge} ${getPriorityBadgeClass(extractedData.priority)}`}>
              {extractedData.priority?.toUpperCase() || 'WARM'} PRIORITY
            </span>
          </div>

          {/* Badges Grid */}
          <div className={styles.badgeGrid}>
            <div className={styles.badgeItem}>
              <DollarSign size={14} className={styles.badgeIcon} />
              <div className={styles.badgeText}>
                <span className={styles.badgeLabel}>Budget</span>
                <span className={styles.badgeValue}>{formatBudgetDisplay(extractedData.budget)}</span>
              </div>
            </div>

            <div className={styles.badgeItem}>
              <Building size={14} className={styles.badgeIcon} />
              <div className={styles.badgeText}>
                <span className={styles.badgeLabel}>Property Type</span>
                <span className={styles.badgeValue}>{extractedData.propertyType || 'Any'}</span>
              </div>
            </div>

            <div className={styles.badgeItem}>
              <MapPin size={14} className={styles.badgeIcon} />
              <div className={styles.badgeText}>
                <span className={styles.badgeLabel}>Location</span>
                <span className={styles.badgeValue}>
                  {[extractedData.location?.area, extractedData.location?.city].filter(Boolean).join(', ') || 'Flexible'}
                </span>
              </div>
            </div>

            <div className={styles.badgeItem}>
              <Home size={14} className={styles.badgeIcon} />
              <div className={styles.badgeText}>
                <span className={styles.badgeLabel}>Bedrooms</span>
                <span className={styles.badgeValue}>
                  {extractedData.bedrooms
                    ? typeof extractedData.bedrooms === 'object'
                      ? `${extractedData.bedrooms.min || extractedData.bedrooms.max} Beds`
                      : `${extractedData.bedrooms} Beds`
                    : 'Any'}
                </span>
              </div>
            </div>

            {extractedData.preferredDeveloper && (
              <div className={styles.badgeItem}>
                <Tag size={14} className={styles.badgeIcon} />
                <div className={styles.badgeText}>
                  <span className={styles.badgeLabel}>Developer</span>
                  <span className={styles.badgeValue}>{extractedData.preferredDeveloper}</span>
                </div>
              </div>
            )}
          </div>

          {/* Summary Note */}
          {extractedData.summaryNote && (
            <div className={styles.summaryBox}>
              <span className={styles.summaryLabel}>Summary Note:</span>
              <p className={styles.summaryText}>{extractedData.summaryNote}</p>
            </div>
          )}

          {/* Suggested Task Card */}
          {extractedData.suggestedTask && (
            <div className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <div className={styles.taskTitleRow}>
                  <Calendar size={16} color="#4f46e5" />
                  <span className={styles.taskTitle}>{extractedData.suggestedTask.title}</span>
                </div>
                <span className={styles.taskTypeTag}>
                  {extractedData.suggestedTask.type || 'follow_up'}
                </span>
              </div>
              <div className={styles.taskMeta}>
                {extractedData.suggestedTask.dueDate && (
                  <span className={styles.taskMetaItem}>
                    <Clock size={13} /> Due: {extractedData.suggestedTask.dueDate} {extractedData.suggestedTask.dueTime || ''}
                  </span>
                )}
                {extractedData.suggestedTask.priority && (
                  <span className={styles.taskMetaItem}>
                    Priority: <strong>{extractedData.suggestedTask.priority}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className={styles.previewActions}>
            <button
              type="button"
              className={styles.discardBtn}
              onClick={() => setExtractedData(null)}
              disabled={isApplying}
            >
              Discard
            </button>

            <button
              type="button"
              className={styles.applyBtn}
              onClick={handleApplyAndSchedule}
              disabled={isApplying}
            >
              <CheckCircle2 size={16} />
              <span>{isApplying ? 'Applying & Scheduling...' : 'Apply to Lead & Schedule Task'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AINoteExtractor;
