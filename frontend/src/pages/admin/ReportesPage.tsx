import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { reportesApi, type RangoFechas } from '@/api/reportes';
import { usuariosApi } from '@/api/usuarios';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDateTime, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { IconChart, IconTrendUp, IconTrendDown } from '@/components/icons';
import type {
  MovimientoInventario,
  ReporteAnalitico,
  ReporteCliente,
  ReporteProductos,
  ReporteVentas,
  Usuario,
} from '@/types';

type Tab = 'analitico' | 'ventas' | 'productos' | 'clientes' | 'movimientos';
const TABS: { id: Tab; label: string }[] = [
  { id: 'analitico', label: 'Dashboard analítico' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'productos', label: 'Productos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'movimientos', label: 'Movimientos' },
];

const CHART_COLORS = ['#0891B2', '#22C55E', '#22D3EE', '#155E75', '#16A34A', '#67E8F9'];

export default function ReportesPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;

  // Rango por defecto: últimos 30 días.
  const hoy = new Date();
  const hace30 = new Date();
  hace30.setDate(hoy.getDate() - 30);
  const [desde, setDesde] = useState(toIsoDate(hace30));
  const [hasta, setHasta] = useState(toIsoDate(hoy));
  const [tab, setTab] = useState<Tab>('analitico');

  const rango: RangoFechas = useMemo(
    () => ({ desde: desde || undefined, hasta: hasta || undefined }),
    [desde, hasta],
  );

  return (
    <>
      <PageHeader title="Reportes" description="Análisis de ventas, productos y clientes." />

      {/* Filtros de fecha */}
      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-44" />
          <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-44" />
          <p className="ml-auto self-center text-xs text-slate-400">
            Si dejas las fechas vacías se reportan los últimos 30 días.
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analitico' && <AnaliticoTab tiendaId={tiendaId} rango={rango} />}
      {tab === 'ventas' && <VentasTab tiendaId={tiendaId} rango={rango} />}
      {tab === 'productos' && <ProductosTab tiendaId={tiendaId} rango={rango} />}
      {tab === 'clientes' && <ClientesTab tiendaId={tiendaId} rango={rango} />}
      {tab === 'movimientos' && <MovimientosTab tiendaId={tiendaId} rango={rango} />}
    </>
  );
}

// --- Hook genérico para cada tab ------------------------------------------
function useReporte<T>(loader: () => Promise<T>, deps: unknown[]) {
  const toast = useToast();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    loader()
      .then((d) => active && setData(d))
      .catch((err) => active && toast.error(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading };
}

function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Spinner label="Cargando reporte…" />
    </div>
  );
}

// --- Tab 1: Analítico ------------------------------------------------------
function AnaliticoTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const { data, loading } = useReporte<ReporteAnalitico>(
    () => reportesApi.analitico(tiendaId, rango),
    [tiendaId, rango.desde, rango.hasta],
  );
  if (loading) return <Loading />;
  if (!data) return <EmptyState title="Sin datos" icon={<IconChart />} />;

  const variacion = Number(data.variacionPorcentaje ?? 0);
  const subio = variacion >= 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Ingresos semana actual</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900">{formatCurrency(data.ingresosSemanaActual)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Ingresos semana anterior</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900">{formatCurrency(data.ingresosSemanaAnterior)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Variación</p>
          <p className={cn('mt-1 flex items-center gap-1.5 font-mono text-2xl font-bold', subio ? 'text-cta-600' : 'text-red-600')}>
            {subio ? <IconTrendUp className="h-5 w-5" /> : <IconTrendDown className="h-5 w-5" />}
            {variacion.toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Ventas por día" subtitle="Ingresos diarios del período" />
        <div className="p-4">
          <ChartLine data={data.ventasPorDia} />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Ventas por categoría" />
          <div className="p-4">
            <ChartBar data={data.ventasPorCategoria} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Ventas por hora" />
          <div className="p-4">
            <ChartBar data={data.ventasPorHora} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- Tab 2: Ventas ---------------------------------------------------------
function VentasTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const { data, loading } = useReporte<ReporteVentas>(
    () => reportesApi.ventas(tiendaId, rango),
    [tiendaId, rango.desde, rango.hasta],
  );
  if (loading) return <Loading />;
  if (!data) return <EmptyState title="Sin datos" icon={<IconChart />} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Total ventas" value={String(data.totalVentas)} />
        <Stat label="Ingresos brutos" value={formatCurrency(data.ingresosBrutos)} />
        <Stat label="Costo de ventas" value={formatCurrency(data.costoVentas)} />
        <Stat label="Utilidad bruta" value={formatCurrency(data.utilidadBruta)} tone="success" />
        <Stat label="Ticket promedio" value={formatCurrency(data.ticketPromedio)} />
        <Stat label="Margen" value={`${Number(data.margenPorcentaje ?? 0).toFixed(1)}%`} tone="brand" />
      </div>

      <Card>
        <CardHeader title="Ingresos por método de pago" />
        <div className="p-4">
          {data.porMetodoPago && data.porMetodoPago.length > 0 ? (
            <ChartBar data={data.porMetodoPago} />
          ) : (
            <EmptyState title="Sin pagos en el período" icon={<IconChart />} />
          )}
        </div>
      </Card>
    </div>
  );
}

// --- Tab 3: Productos ------------------------------------------------------
function ProductosTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const [dias, setDias] = useState(30);
  const { data, loading } = useReporte<ReporteProductos>(
    () => reportesApi.productos(tiendaId, rango, dias),
    [tiendaId, rango.desde, rango.hasta, dias],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Valorización a costo" value={data ? formatCurrency(data.valorizacionCosto) : '—'} />
        <Stat label="Valorización a venta" value={data ? formatCurrency(data.valorizacionVenta) : '—'} tone="brand" />
      </div>

      {loading ? (
        <Loading />
      ) : !data ? (
        <EmptyState title="Sin datos" icon={<IconChart />} />
      ) : (
        <>
          <Card>
            <CardHeader title="Productos más vendidos" />
            <div className="overflow-x-auto">
              {data.masVendidos.length === 0 ? (
                <div className="p-5"><EmptyState title="Sin ventas en el período" icon={<IconChart />} /></div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <Th>Producto</Th>
                      <Th align="right">Cantidad</Th>
                      <Th align="right">Ingresos</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.masVendidos.map((p, i) => (
                      <Tr key={p.productoId}>
                        <Td className="font-mono text-slate-400">{i + 1}</Td>
                        <Td className="font-medium text-slate-800">{p.nombre}</Td>
                        <Td align="right" className="font-mono">{p.cantidadVendida}</Td>
                        <Td align="right" className="font-mono font-medium text-slate-800">{formatCurrency(p.ingresos)}</Td>
                      </Tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Productos sin movimiento"
              subtitle="Sin salidas en el período indicado"
              action={
                <div className="w-40">
                  <Select value={String(dias)} onChange={(e) => setDias(Number(e.target.value))} aria-label="Días sin movimiento">
                    {[15, 30, 60, 90].map((d) => (
                      <option key={d} value={d}>
                        {d} días
                      </option>
                    ))}
                  </Select>
                </div>
              }
            />
            <div className="p-4">
              {data.productosMuertos.length === 0 ? (
                <EmptyState title="Todo en movimiento" message="No hay productos estancados." icon={<IconChart />} />
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {data.productosMuertos.map((p) => (
                    <li key={p.id}>
                      <Badge tone="warning">{p.nombre}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Stock crítico" subtitle="Productos en o por debajo del mínimo" />
            <div className="p-4">
              {data.stockCritico.length === 0 ? (
                <EmptyState title="Sin alertas" message="Todos los productos tienen stock suficiente." icon={<IconChart />} />
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {data.stockCritico.map((p) => (
                    <li key={p.id}>
                      <Badge tone={p.stock === 0 ? 'danger' : 'warning'}>
                        {p.nombre}: {p.stock}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// --- Tab 4: Clientes -------------------------------------------------------
function ClientesTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const { data, loading } = useReporte<ReporteCliente[]>(
    () => reportesApi.clientes(tiendaId, rango),
    [tiendaId, rango.desde, rango.hasta],
  );
  if (loading) return <Loading />;
  if (!data || data.length === 0)
    return <EmptyState title="Sin clientes con compras" message="Nadie compró en el período seleccionado." icon={<IconChart />} />;

  return (
    <Table>
      <thead>
        <tr>
          <Th>#</Th>
          <Th>Cliente</Th>
          <Th>Email</Th>
          <Th align="right">Compras</Th>
          <Th align="right">Total gastado</Th>
        </tr>
      </thead>
      <tbody>
        {data.map((c, i) => (
          <Tr key={c.usuarioId}>
            <Td className="font-mono text-slate-400">{i + 1}</Td>
            <Td className="font-medium text-slate-800">{c.nombre}</Td>
            <Td className="text-slate-600">{c.email}</Td>
            <Td align="right" className="font-mono">{c.cantidadCompras}</Td>
            <Td align="right" className="font-mono font-medium text-slate-800">{formatCurrency(c.totalGastado)}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

// --- Tab 5: Movimientos ----------------------------------------------------
function MovimientosTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const [tipo, setTipo] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    usuariosApi.listarPorTienda(tiendaId).then(setUsuarios).catch(() => setUsuarios([]));
  }, [tiendaId]);

  const { data, loading } = useReporte<MovimientoInventario[]>(
    () =>
      reportesApi.movimientos(tiendaId, {
        ...rango,
        tipo: tipo || undefined,
        usuarioId: usuarioId ? Number(usuarioId) : undefined,
      }),
    [tiendaId, rango.desde, rango.hasta, tipo, usuarioId],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-40">
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
          </Select>
        </div>
        <div className="w-56">
          <Select label="Usuario" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Sin movimientos" message="No hay movimientos para estos filtros." icon={<IconChart />} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Fecha</Th>
              <Th>Producto</Th>
              <Th align="center">Tipo</Th>
              <Th align="right">Cantidad</Th>
              <Th>Referencia</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <Tr key={m.id}>
                <Td className="whitespace-nowrap text-slate-500">{formatDateTime(m.fecha)}</Td>
                <Td className="font-medium text-slate-800">{m.productoNombre}</Td>
                <Td align="center">
                  <Badge tone={m.tipo === 'ENTRADA' ? 'success' : 'warning'}>{m.tipo}</Badge>
                </Td>
                <Td align="right" className="font-mono">{m.cantidad}</Td>
                <Td className="text-slate-500">{m.referencia || '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

// --- Componentes auxiliares ------------------------------------------------
function Stat({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'brand' }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 font-mono text-xl font-bold',
          tone === 'success' ? 'text-cta-600' : tone === 'brand' ? 'text-brand-700' : 'text-slate-900',
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function ChartLine({ data }: { data: { etiqueta: string; ingresos: number }[] }) {
  if (!data || data.length === 0) return <EmptyState title="Sin datos en el período" icon={<IconChart />} />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 12, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} width={48} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="ingresos" stroke="#0891B2" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ChartBar({ data }: { data: { etiqueta: string; ingresos: number; cantidad: number }[] }) {
  if (!data || data.length === 0) return <EmptyState title="Sin datos en el período" icon={<IconChart />} />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="etiqueta" tick={{ fontSize: 12, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} width={48} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} cursor={{ fill: '#F1F5F9' }} />
        <Bar dataKey="ingresos" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  fontSize: 13,
  boxShadow: '0 4px 16px -2px rgb(15 23 42 / 0.12)',
};
