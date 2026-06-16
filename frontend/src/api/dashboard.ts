import { api } from './client';
import type { Dashboard } from '@/types';

export const dashboardApi = {
  obtener: (tiendaId: number) =>
    api.get<Dashboard>(`/api/dashboard/tienda/${tiendaId}`).then((r) => r.data),
};
