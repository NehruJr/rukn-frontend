import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSettings } from '@/services/settingsService';
import { getMySubscription } from '@/services/subscriptionService';
import { useAuthStore } from '@/store/authStore';

export const useBranding = () => {
  const { isAuthenticated } = useAuthStore();

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: getMySubscription,
    enabled: !!isAuthenticated,
    staleTime: 5 * 60 * 1000
  });

  const settings = settingsData?.data || {};
  const subData = subscriptionData?.data || {};

  const isBrandingUnlocked = Boolean(subData?.features?.customBranding);

  const agencyName = isBrandingUnlocked && settings.agencyName?.trim()
    ? settings.agencyName
    : 'Rukn';

  const agencyLogo = isBrandingUnlocked && settings.agencyLogo?.trim()
    ? settings.agencyLogo
    : '/ruknlogo.png';

  const primaryColor = isBrandingUnlocked && settings.primaryColor
    ? settings.primaryColor
    : null;

  const secondaryColor = isBrandingUnlocked && settings.secondaryColor
    ? settings.secondaryColor
    : null;

  useEffect(() => {
    const root = document.documentElement;

    if (isBrandingUnlocked && primaryColor) {
      root.style.setProperty('--color-primary-500', primaryColor);
      root.style.setProperty('--color-border-focus', primaryColor);
      root.style.setProperty('--color-primary-600', primaryColor);
    } else {
      root.style.removeProperty('--color-primary-500');
      root.style.removeProperty('--color-border-focus');
      root.style.removeProperty('--color-primary-600');
    }

    if (isBrandingUnlocked && secondaryColor) {
      root.style.setProperty('--color-neutral-700', secondaryColor);
    } else {
      root.style.removeProperty('--color-neutral-700');
    }

    return () => {
      // Clean up on unmount or logout
      root.style.removeProperty('--color-primary-500');
      root.style.removeProperty('--color-border-focus');
      root.style.removeProperty('--color-primary-600');
      root.style.removeProperty('--color-neutral-700');
    };
  }, [isBrandingUnlocked, primaryColor, secondaryColor]);

  return {
    isBrandingUnlocked,
    agencyName,
    agencyLogo,
    primaryColor: primaryColor || '#b4562d',
    secondaryColor: secondaryColor || '#2c3438',
    settings,
    subscription: subData
  };
};
