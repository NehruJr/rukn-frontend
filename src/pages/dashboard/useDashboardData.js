import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { taskService } from '@/services/taskService';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export const useDashboardScope = () => {
  const { selectedCountry, selectedBranch, dashboardPeriod } = useUIStore();
  return {
    country: selectedCountry || undefined,
    branch: selectedBranch || undefined,
    period: dashboardPeriod || '30d'
  };
};

export const useDashboardStats = (scope) => {
  return useQuery({
    queryKey: ['dashboard', 'stats', scope],
    queryFn: () => dashboardService.getStats(scope),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: true
  });
};

export const useDashboardAgenda = (scope) => {
  return useQuery({
    queryKey: ['dashboard', 'agenda', scope.country, scope.branch],
    queryFn: () => dashboardService.getAgenda({ country: scope.country, branch: scope.branch }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: true
  });
};

export const useDashboardAttention = (scope) => {
  return useQuery({
    queryKey: ['dashboard', 'attention', scope.country, scope.branch],
    queryFn: () => dashboardService.getAttention({ country: scope.country, branch: scope.branch }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: true
  });
};

export const useTeamLeaderboard = (scope) => {
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  return useQuery({
    queryKey: ['dashboard', 'team', scope.period],
    queryFn: () => dashboardService.getTeamLeaderboard({ period: scope.period }),
    enabled: isManagerOrAdmin,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: true
  });
};

export const useRecentLeads = (limit = 5, scope) => {
  return useQuery({
    queryKey: ['dashboard', 'recentLeads', limit, scope.country, scope.branch],
    queryFn: () => dashboardService.getRecentLeads(limit, { country: scope.country, branch: scope.branch }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchOnWindowFocus: true
  });
};

export const useCompleteTaskMutation = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: ({ taskId, notes }) => taskService.completeTask(taskId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'agenda'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast({
        type: 'success',
        message: 'Task completed successfully'
      });
    },
    onError: (err) => {
      addToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to complete task'
      });
    }
  });
};
