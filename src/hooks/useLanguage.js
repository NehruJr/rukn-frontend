import { useQuery } from '@tanstack/react-query';
import { getSettings } from '@/services/settingsService';
import { useAuthStore } from '@/store/authStore';
import { createTranslator } from '@/locales/messages';

/**
 * Resolved UI language: 'ar' (default) or 'en', plus translator and locale for Intl APIs.
 */
export function useLanguage() {
  const { isAuthenticated } = useAuthStore();
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: !!isAuthenticated
  });

  const raw = settingsData?.data?.language;
  const language = raw === 'en' ? 'en' : 'ar';
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const { t, leadPriority, taskPriority, leadSource, userRole, taskTitle } = createTranslator(language);

  return {
    language,
    locale,
    t,
    leadPriority,
    taskPriority,
    leadSource,
    userRole,
    taskTitle
  };
}
