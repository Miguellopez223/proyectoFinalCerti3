// Formateadores de moneda (Bs / BOB) y fechas.

const currencyFormatter = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto como moneda boliviana: "Bs 1.234,50". */
export function formatCurrency(value: number | string | null | undefined): string {
  const n = toNumber(value);
  if (n === null) return '—';
  // Intl usa "BOB" como símbolo; lo normalizamos a "Bs".
  return currencyFormatter.format(n).replace(/BOB\s?/, 'Bs ');
}

/** Convierte BigDecimal serializado (number | string) a number, o null. */
export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-BO', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFormatter.format(d);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : dateFormatter.format(d);
}

/** Fecha ISO yyyy-MM-dd (para los filtros de reportes). */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Genera un slug a partir de un nombre. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos/diacríticos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}