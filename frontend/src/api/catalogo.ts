import { api } from './client';
import type { Catalogo } from '@/types';

export const catalogoApi = {
  /** GET /api/catalogo/{slug} — público (sin token). */
  porSlug: (slug: string) =>
    api.get<Catalogo>(`/api/catalogo/${slug}`).then((r) => r.data),
};
