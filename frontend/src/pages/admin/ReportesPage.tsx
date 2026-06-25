import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend,
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
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDate, formatDateTime, toIsoDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { IconChart, IconTrendUp, IconTrendDown, IconAlert } from '@/components/icons';
import type {
  MovimientoInventario,
  ProveedorCompra,
  ReporteAnalitico,
  ReporteClientes,
  ReporteProductos,
  ReporteRentabilidad,
  ReporteVentas,
  SerieItem,
  Usuario,
} from '@/types';

type Tab =
  | 'analitico'
  | 'ventas'
  | 'productos'
  | 'rentabilidad'
  | 'clientes'
  | 'proveedores'
  | 'movimientos';
const TABS: { id: Tab; label: string }[] = [
  { id: 'analitico', label: 'Dashboard' },
  { id: 'ventas', label: 'Rendimiento de ventas' },
  { id: 'productos', label: 'Inteligencia de productos' },
  { id: 'rentabilidad', label: 'Rentabilidad / ABC' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'movimientos', label: 'Movimientos' },
];

const CHART_COLORS = ['#0891B2', '#22C55E', '#22D3EE', '#155E75', '#16A34A', '#67E8F9', '#0E7490', '#86EFAC'];

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
      <PageHeader title="Reportes" description="Inteligencia de negocio: ventas, productos, clientes y proveedores." />

      {/* Filtros de fecha (el Dashboard usa su propio selector de periodo). */}
      {tab !== 'analitico' && (
        <Card className="mb-5 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Input label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-44" />
            <Input label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-44" />
            <p className="ml-auto self-center text-xs text-slate-400">
              Si dejas las fechas vacías se reportan los últimos 30 días.
            </p>
          </div>
        </Card>
      )}

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

      {tab === 'analitico' && <AnaliticoTab tiendaId={tiendaId} />}
      {tab === 'ventas' && <VentasTab tiendaId={tiendaId} rango={rango} />}
      {tab === 'productos' && <ProductosTab tiendaId={tiendaId} rango={rango} />}
      {tab === 'rentabilidad' && <RentabilidadTab tiendaId={tiendaId} rango={rango} />}
      {tab === 'clientes' && <ClientesTab tiendaId={tiendaId} rango={rango} />}
      {tab === 'proveedores' && <ProveedoresTab tiendaId={tiendaId} rango={rango} />}
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

// --- Tab 1: Dashboard ------------------------------------------------------
function AnaliticoTab({ tiendaId }: { tiendaId: number }) {
  const [periodo, setPeriodo] = useState(30); // 7 / 14 / 30 días

  const rango: RangoFechas = useMemo(() => {
    const fin = new Date();
    const ini = new Date();
    ini.setDate(fin.getDate() - periodo);
    return { desde: toIsoDate(ini), hasta: toIsoDate(fin) };
  }, [periodo]);

  const { data, loading } = useReporte<ReporteAnalitico>(
    () => reportesApi.analitico(tiendaId, rango),
    [tiendaId, rango.desde, rango.hasta],
  );

  const variacion = Number(data?.variacionPorcentaje ?? 0);
  const subio = variacion >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Periodo:</span>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setPeriodo(d)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              periodo === d ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {d} días
          </button>
        ))}
      </div>

      {/* Comparativa semanal */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Ingresos semana actual</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900">{formatCurrency(data?.ingresosSemanaActual ?? 0)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Ingresos semana anterior</p>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-900">{formatCurrency(data?.ingresosSemanaAnterior ?? 0)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Variación semanal</p>
          <p className={cn('mt-1 flex items-center gap-1.5 font-mono text-2xl font-bold', subio ? 'text-cta-600' : 'text-red-600')}>
            {subio ? <IconTrendUp className="h-5 w-5" /> : <IconTrendDown className="h-5 w-5" />}
            {variacion.toFixed(1)}%
          </p>
        </Card>
      </div>

      {loading ? (
        <Loading />
      ) : !data ? (
        <EmptyState title="Sin datos" icon={<IconChart />} />
      ) : (
        <>
          <Card>
            <CardHeader title="Ingresos por día" subtitle={`Últimos ${periodo} días`} />
            <div className="p-4">
              <ChartLine data={data.ventasPorDia} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Ventas por categoría" subtitle="Participación en ingresos" />
            <div className="p-4">
              <ChartDonut data={data.ventasPorCategoria} />
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader title="Mapa de calor por hora" subtitle="Ventas según la hora del día (00–23)" />
              <div className="p-4">
                <HeatMap items={data.ventasPorHora} cols={12} unidad="ventas" />
              </div>
            </Card>
            <Card>
              <CardHeader title="Mapa de calor por día" subtitle="Ventas según el día de la semana" />
              <div className="p-4">
                <HeatMap items={data.ventasPorDiaSemana} cols={7} unidad="ventas" />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// --- Tab 2: Rendimiento de ventas ------------------------------------------
function VentasTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const { data, loading } = useReporte<ReporteVentas>(
    () => reportesApi.ventas(tiendaId, rango),
    [tiendaId, rango.desde, rango.hasta],
  );
  if (loading) return <Loading />;
  if (!data) return <EmptyState title="Sin datos" icon={<IconChart />} />;

  const sinCosto = Number(data.costoVentas ?? 0) === 0;
  const margen = Number(data.margenPorcentaje ?? 0);
  const varMensual = Number(data.variacionMensual ?? 0);

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total ventas" value={String(data.totalVentas)} />
        <Stat label="Ingresos brutos" value={formatCurrency(data.ingresosBrutos)} />
        <Stat label="Utilidad bruta" value={formatCurrency(data.utilidadBruta)} tone="success" sub={`Margen ${margen.toFixed(1)}%`} />
        <Stat label="Ticket promedio" value={formatCurrency(data.ticketPromedio)} />
      </div>

      {sinCosto && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            El costo de ventas es 0: falta cargar el <strong>precio de costo</strong> de tus productos. La utilidad y el
            margen no son confiables hasta entonces.
          </span>
        </div>
      )}

      {/* KPIs secundarios */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Unidades vendidas" value={String(data.unidadesVendidas)} />
        <Stat label="Unidades por venta" value={Number(data.unidadesPorVenta ?? 0).toFixed(2)} />
        <Stat
          label="Ventas anuladas"
          value={String(data.ventasAnuladasCantidad)}
          tone="danger"
          sub={`${formatCurrency(data.montoAnulado)} revertido`}
        />
        <Stat
          label="Mes actual vs. anterior"
          value={`${varMensual >= 0 ? '+' : ''}${varMensual.toFixed(1)}%`}
          tone={varMensual >= 0 ? 'success' : 'danger'}
          sub={`${formatCurrency(data.ingresosMesActual)} este mes`}
        />
      </div>

      {/* Desglose financiero */}
      <Card>
        <CardHeader title="Desglose financiero" subtitle="Ingresos − Costo de ventas = Utilidad bruta" />
        <div className="space-y-3 p-5">
          <FilaFinanciera label="Ingresos brutos" value={formatCurrency(data.ingresosBrutos)} />
          <FilaFinanciera label="− Costo de ventas" value={formatCurrency(data.costoVentas)} muted />
          <div className="border-t border-slate-100 pt-3">
            <FilaFinanciera label="= Utilidad bruta" value={formatCurrency(data.utilidadBruta)} strong />
          </div>
          <div className="pt-1">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Margen de utilidad</span>
              <span className="font-mono">{margen.toFixed(1)}%</span>
            </div>
            <ProgressBar pct={margen} tone="success" />
          </div>
        </div>
      </Card>

      {/* Métodos de pago */}
      <Card>
        <CardHeader title="Ranking de métodos de pago" />
        <div className="p-4">
          {data.porMetodoPago && data.porMetodoPago.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <Th>Método</Th>
                  <Th align="right">Nº de ventas</Th>
                  <Th align="right">Ingresos</Th>
                </tr>
              </thead>
              <tbody>
                {data.porMetodoPago.map((m) => (
                  <Tr key={m.etiqueta}>
                    <Td className="font-medium text-slate-800">{m.etiqueta}</Td>
                    <Td align="right" className="font-mono">{m.cantidad}</Td>
                    <Td align="right" className="font-mono font-medium text-slate-800">{formatCurrency(m.ingresos)}</Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Sin pagos en el período" icon={<IconChart />} />
          )}
        </div>
      </Card>
    </div>
  );
}

// --- Tab 3: Inteligencia de productos --------------------------------------
function ProductosTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const [dias, setDias] = useState(30);
  const { data, loading } = useReporte<ReporteProductos>(
    () => reportesApi.productos(tiendaId, rango, dias),
    [tiendaId, rango.desde, rango.hasta, dias],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Valorización a costo" value={data ? formatCurrency(data.valorizacionCosto) : '—'} />
        <Stat label="Valorización a venta" value={data ? formatCurrency(data.valorizacionVenta) : '—'} tone="brand" />
        <Stat label="Total de SKUs" value={data ? String(data.totalSkus) : '—'} />
      </div>

      {loading ? (
        <Loading />
      ) : !data ? (
        <EmptyState title="Sin datos" icon={<IconChart />} />
      ) : (
        <>
          <Card>
            <CardHeader title="Top 10 productos más vendidos" subtitle="Unidades e ingresos de todo el historial" />
            <div className="overflow-x-auto">
              {data.masVendidos.length === 0 ? (
                <div className="p-5"><EmptyState title="Sin ventas registradas" icon={<IconChart />} /></div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <Th>#</Th>
                      <Th>Producto</Th>
                      <Th align="right">Unidades</Th>
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
            <CardHeader title="Rotación y cobertura" subtitle="Sobre las ventas de los últimos 30 días. Cobertura < 7 días en rojo." />
            <div className="overflow-x-auto">
              {data.rotacion.length === 0 ? (
                <div className="p-5"><EmptyState title="Sin rotación reciente" icon={<IconChart />} /></div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <Th>Producto</Th>
                      <Th align="right">Stock</Th>
                      <Th align="right">Vendidos (30d)</Th>
                      <Th align="right">Rotación</Th>
                      <Th align="right">Cobertura</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rotacion.map((r) => {
                      const cobertura = r.coberturaDias;
                      const critica = cobertura != null && cobertura < 7;
                      return (
                        <Tr key={r.productoId}>
                          <Td className="font-medium text-slate-800">{r.nombre}</Td>
                          <Td align="right" className="font-mono">{r.stock}</Td>
                          <Td align="right" className="font-mono">{r.vendidos30}</Td>
                          <Td align="right" className="font-mono">{r.rotacion == null ? '∞' : Number(r.rotacion).toFixed(2)}</Td>
                          <Td align="right" className={cn('font-mono font-medium', critica ? 'text-red-600' : 'text-slate-700')}>
                            {cobertura == null ? '∞' : `${Number(cobertura).toFixed(1)} d`}
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Stock crítico"
              subtitle="En o por debajo del mínimo. Sugerencia = mínimo × 2 − stock."
            />
            <div className="overflow-x-auto">
              {data.stockCritico.length === 0 ? (
                <div className="p-5"><EmptyState title="Sin alertas" message="Todos los productos tienen stock suficiente." icon={<IconChart />} /></div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <Th>Producto</Th>
                      <Th align="right">Stock</Th>
                      <Th align="right">Mínimo</Th>
                      <Th align="right">Sugerido a pedir</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stockCritico.map((p) => {
                      const sugerido = Math.max(0, (p.stockMinimo ?? 0) * 2 - (p.stock ?? 0));
                      return (
                        <Tr key={p.id}>
                          <Td className="font-medium text-slate-800">{p.nombre}</Td>
                          <Td align="right">
                            <Badge tone={(p.stock ?? 0) === 0 ? 'danger' : 'warning'}>{p.stock}</Badge>
                          </Td>
                          <Td align="right" className="font-mono text-slate-500">{p.stockMinimo ?? '—'}</Td>
                          <Td align="right" className="font-mono font-medium text-brand-700">{sugerido}</Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Productos muertos (sin rotación)"
              subtitle="Sin salidas en el período indicado. Muestra el capital retenido."
              action={
                <div className="w-40">
                  <Select value={String(dias)} onChange={(e) => setDias(Number(e.target.value))} aria-label="Días sin movimiento">
                    {[30, 60, 90].map((d) => (
                      <option key={d} value={d}>
                        {d} días
                      </option>
                    ))}
                  </Select>
                </div>
              }
            />
            <div className="overflow-x-auto">
              {data.productosMuertos.length === 0 ? (
                <div className="p-5"><EmptyState title="Todo en movimiento" message="No hay productos estancados." icon={<IconChart />} /></div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <Th>Producto</Th>
                      <Th align="right">Stock</Th>
                      <Th align="right">Costo unit.</Th>
                      <Th align="right">Capital retenido</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.productosMuertos.map((p) => {
                      const capital = (p.stock ?? 0) * Number(p.precioCosto ?? 0);
                      return (
                        <Tr key={p.id}>
                          <Td className="font-medium text-slate-800">{p.nombre}</Td>
                          <Td align="right" className="font-mono">{p.stock}</Td>
                          <Td align="right" className="font-mono text-slate-500">{formatCurrency(p.precioCosto ?? 0)}</Td>
                          <Td align="right" className="font-mono font-medium text-amber-700">{formatCurrency(capital)}</Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// --- Tab 4: Rentabilidad / ABC ---------------------------------------------
function RentabilidadTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const { data, loading } = useReporte<ReporteRentabilidad>(
    () => reportesApi.rentabilidad(tiendaId, rango),
    [tiendaId, rango.desde, rango.hasta],
  );
  if (loading) return <Loading />;
  if (!data) return <EmptyState title="Sin datos" icon={<IconChart />} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Productos clase A" value={String(data.claseA)} tone="success" sub="≤ 80% de ingresos" />
        <Stat label="Productos clase B" value={String(data.claseB)} tone="brand" sub="hasta 95%" />
        <Stat label="Productos clase C" value={String(data.claseC)} sub="el resto" />
      </div>

      <Card>
        <CardHeader title="Productos más rentables" subtitle="Ingresos, utilidad y margen del período" />
        <div className="overflow-x-auto">
          {data.productosRentables.length === 0 ? (
            <div className="p-5"><EmptyState title="Sin ventas en el período" icon={<IconChart />} /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <Th>Producto</Th>
                  <Th align="right">Ingresos</Th>
                  <Th align="right">Utilidad</Th>
                  <Th align="right">Margen</Th>
                </tr>
              </thead>
              <tbody>
                {data.productosRentables.map((p) => (
                  <Tr key={p.id ?? p.nombre}>
                    <Td className="font-medium text-slate-800">{p.nombre}</Td>
                    <Td align="right" className="font-mono">{formatCurrency(p.ingresos)}</Td>
                    <Td align="right" className="font-mono font-medium text-cta-700">{formatCurrency(p.utilidad)}</Td>
                    <Td align="right" className="font-mono">{Number(p.margenPorcentaje ?? 0).toFixed(1)}%</Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Rentabilidad por categoría" />
        <div className="overflow-x-auto">
          {data.porCategoria.length === 0 ? (
            <div className="p-5"><EmptyState title="Sin datos" icon={<IconChart />} /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <Th>Categoría</Th>
                  <Th align="right">Ingresos</Th>
                  <Th align="right">Utilidad</Th>
                  <Th align="right">Margen</Th>
                </tr>
              </thead>
              <tbody>
                {data.porCategoria.map((c) => (
                  <Tr key={c.nombre}>
                    <Td className="font-medium text-slate-800">{c.nombre}</Td>
                    <Td align="right" className="font-mono">{formatCurrency(c.ingresos)}</Td>
                    <Td align="right" className="font-mono font-medium text-cta-700">{formatCurrency(c.utilidad)}</Td>
                    <Td align="right" className="font-mono">{Number(c.margenPorcentaje ?? 0).toFixed(1)}%</Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Clasificación ABC (Pareto)" subtitle="Ordenado por ingresos; clase según el % acumulado" />
        <div className="overflow-x-auto">
          {data.abc.length === 0 ? (
            <div className="p-5"><EmptyState title="Sin datos" icon={<IconChart />} /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <Th>Producto</Th>
                  <Th align="center">Clase</Th>
                  <Th align="right">Ingresos</Th>
                  <Th align="right">% del total</Th>
                  <Th>% acumulado</Th>
                </tr>
              </thead>
              <tbody>
                {data.abc.map((a) => (
                  <Tr key={a.productoId}>
                    <Td className="font-medium text-slate-800">{a.nombre}</Td>
                    <Td align="center">
                      <Badge tone={a.clase === 'A' ? 'success' : a.clase === 'B' ? 'brand' : 'neutral'}>{a.clase}</Badge>
                    </Td>
                    <Td align="right" className="font-mono">{formatCurrency(a.ingresos)}</Td>
                    <Td align="right" className="font-mono">{Number(a.porcentaje ?? 0).toFixed(1)}%</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <ProgressBar pct={Number(a.porcentajeAcumulado ?? 0)} />
                        <span className="w-12 shrink-0 text-right font-mono text-xs text-slate-500">
                          {Number(a.porcentajeAcumulado ?? 0).toFixed(0)}%
                        </span>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

// --- Tab 5: Clientes -------------------------------------------------------
function ClientesTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const [dias, setDias] = useState(30);
  const { data, loading } = useReporte<ReporteClientes>(
    () => reportesApi.clientes(tiendaId, rango, dias),
    [tiendaId, rango.desde, rango.hasta, dias],
  );
  if (loading) return <Loading />;
  if (!data) return <EmptyState title="Sin datos" icon={<IconChart />} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total de clientes" value={String(data.totalClientes)} />
        <Stat label="Recurrentes" value={String(data.recurrentes)} tone="success" sub="más de 1 compra" />
        <Stat label="Una sola compra" value={String(data.unaCompra)} />
        <Stat label="Inactivos" value={String(data.inactivos)} tone="danger" sub={`sin comprar ${dias}+ días`} />
      </div>

      <Card>
        <CardHeader title="Top 10 mejores clientes" subtitle="Por monto gastado en el período" />
        <div className="overflow-x-auto">
          {data.topClientes.length === 0 ? (
            <div className="p-5"><EmptyState title="Sin clientes con compras" icon={<IconChart />} /></div>
          ) : (
            <table className="w-full text-left text-sm">
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
                {data.topClientes.map((c, i) => (
                  <Tr key={c.usuarioId}>
                    <Td className="font-mono text-slate-400">{i + 1}</Td>
                    <Td className="font-medium text-slate-800">{c.nombre}</Td>
                    <Td className="text-slate-600">{c.email}</Td>
                    <Td align="right" className="font-mono">{c.cantidadCompras}</Td>
                    <Td align="right" className="font-mono font-medium text-slate-800">{formatCurrency(c.totalGastado)}</Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Clientes inactivos"
          subtitle="Compraron antes pero no recientemente. Contáctalos para reactivarlos."
          action={
            <div className="w-40">
              <Select value={String(dias)} onChange={(e) => setDias(Number(e.target.value))} aria-label="Días de inactividad">
                {[30, 60, 90].map((d) => (
                  <option key={d} value={d}>
                    {d} días
                  </option>
                ))}
              </Select>
            </div>
          }
        />
        <div className="overflow-x-auto">
          {data.clientesInactivos.length === 0 ? (
            <div className="p-5"><EmptyState title="Sin inactivos" message="Todos tus clientes compraron recientemente." icon={<IconChart />} /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <Th>Cliente</Th>
                  <Th>Teléfono</Th>
                  <Th align="right">Compras</Th>
                  <Th align="right">Total gastado</Th>
                  <Th align="right">Última compra</Th>
                </tr>
              </thead>
              <tbody>
                {data.clientesInactivos.map((c) => (
                  <Tr key={c.usuarioId}>
                    <Td className="font-medium text-slate-800">{c.nombre}</Td>
                    <Td className="font-mono text-slate-600">{c.telefono || '—'}</Td>
                    <Td align="right" className="font-mono">{c.cantidadCompras}</Td>
                    <Td align="right" className="font-mono">{formatCurrency(c.totalGastado)}</Td>
                    <Td align="right" className="text-slate-500">{c.ultimaCompra ? formatDate(c.ultimaCompra) : '—'}</Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

// --- Tab 6: Proveedores ----------------------------------------------------
function ProveedoresTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const { data, loading } = useReporte<ProveedorCompra[]>(
    () => reportesApi.proveedores(tiendaId, rango),
    [tiendaId, rango.desde, rango.hasta],
  );
  if (loading) return <Loading />;
  if (!data || data.length === 0)
    return (
      <EmptyState
        title="Sin compras a proveedores"
        message="Registra entradas de inventario con proveedor para verlas aquí."
        icon={<IconChart />}
      />
    );

  const totalCompras = data.reduce((acc, p) => acc + Number(p.costoTotal ?? 0), 0);
  const maxCosto = Math.max(...data.map((p) => Number(p.costoTotal ?? 0)), 1);

  return (
    <div className="space-y-6">
      <Stat label="Total de compras a proveedores" value={formatCurrency(totalCompras)} tone="brand" />

      <Card>
        <CardHeader title="Compras por proveedor" subtitle="A partir de las entradas de inventario del período" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <Th>Proveedor</Th>
                <Th align="right">Entradas</Th>
                <Th align="right">Unidades</Th>
                <Th align="right">Costo total</Th>
                <Th>Participación</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => {
                const costo = Number(p.costoTotal ?? 0);
                return (
                  <Tr key={p.proveedor}>
                    <Td className="font-medium text-slate-800">{p.proveedor}</Td>
                    <Td align="right" className="font-mono">{p.numEntradas}</Td>
                    <Td align="right" className="font-mono">{p.unidades}</Td>
                    <Td align="right" className="font-mono font-medium text-slate-800">{formatCurrency(costo)}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <ProgressBar pct={(costo / maxCosto) * 100} />
                        <span className="w-12 shrink-0 text-right font-mono text-xs text-slate-500">
                          {totalCompras > 0 ? ((costo / totalCompras) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// --- Tab 7: Movimientos ----------------------------------------------------
const PAGE_SIZE = 15;
function MovimientosTab({ tiendaId, rango }: { tiendaId: number; rango: RangoFechas }) {
  const [tipo, setTipo] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [page, setPage] = useState(1);

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

  // Volver a la primera página cuando cambian los filtros o los datos.
  useEffect(() => setPage(1), [tipo, usuarioId, rango.desde, rango.hasta]);

  const total = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = (data ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function exportar() {
    if (!data || data.length === 0) return;
    const rows = data.map((m) => [
      formatDateTime(m.fecha),
      m.tipo,
      m.productoNombre,
      m.cantidad,
      m.precioUnitario ?? '',
      m.proveedor || m.referencia || '',
      m.usuarioNombre || '',
    ]);
    exportCsv(
      `movimientos_${rango.desde || 'inicio'}_${rango.hasta || 'hoy'}.csv`,
      ['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Precio unitario', 'Proveedor/Referencia', 'Registrado por'],
      rows,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
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
        <Button variant="secondary" className="ml-auto" onClick={exportar} disabled={total === 0}>
          Exportar CSV
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : total === 0 ? (
        <EmptyState title="Sin movimientos" message="No hay movimientos para estos filtros." icon={<IconChart />} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th align="center">Tipo</Th>
                <Th>Producto</Th>
                <Th align="right">Cantidad</Th>
                <Th align="right">Precio unit.</Th>
                <Th>Proveedor / Ref.</Th>
                <Th>Registrado por</Th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((m) => (
                <Tr key={m.id}>
                  <Td className="whitespace-nowrap text-slate-500">{formatDateTime(m.fecha)}</Td>
                  <Td align="center">
                    <Badge tone={m.tipo === 'ENTRADA' ? 'success' : 'warning'}>{m.tipo}</Badge>
                  </Td>
                  <Td className="font-medium text-slate-800">{m.productoNombre}</Td>
                  <Td align="right" className="font-mono">{m.cantidad}</Td>
                  <Td align="right" className="font-mono text-slate-600">
                    {m.precioUnitario != null ? formatCurrency(m.precioUnitario) : '—'}
                  </Td>
                  <Td className="text-slate-500">{m.proveedor || m.referencia || '—'}</Td>
                  <Td className="text-slate-500">{m.usuarioNombre || '—'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {total} movimiento{total !== 1 ? 's' : ''} · página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Anterior
                </Button>
                <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Componentes auxiliares ------------------------------------------------
function Stat({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'brand' | 'danger';
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 font-mono text-xl font-bold',
          tone === 'success'
            ? 'text-cta-600'
            : tone === 'brand'
              ? 'text-brand-700'
              : tone === 'danger'
                ? 'text-red-600'
                : 'text-slate-900',
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

function FilaFinanciera({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-sm', muted ? 'text-slate-400' : strong ? 'font-semibold text-slate-800' : 'text-slate-600')}>
        {label}
      </span>
      <span className={cn('font-mono', strong ? 'text-lg font-bold text-cta-700' : muted ? 'text-slate-500' : 'text-slate-800')}>
        {value}
      </span>
    </div>
  );
}

function ProgressBar({ pct, tone = 'brand' }: { pct: number; tone?: 'brand' | 'success' }) {
  const w = Math.min(100, Math.max(0, pct));
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={cn('h-2 rounded-full', tone === 'success' ? 'bg-cta-500' : 'bg-brand-500')} style={{ width: `${w}%` }} />
    </div>
  );
}

function HeatMap({ items, cols, unidad }: { items: SerieItem[]; cols: number; unidad: string }) {
  if (!items || items.length === 0) return <EmptyState title="Sin datos en el período" icon={<IconChart />} />;
  const max = Math.max(1, ...items.map((i) => i.cantidad));
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {items.map((it) => {
        const intensity = it.cantidad / max;
        const bg = it.cantidad === 0 ? '#F1F5F9' : `rgba(8, 145, 178, ${0.12 + intensity * 0.88})`;
        const fg = intensity > 0.55 ? '#FFFFFF' : '#334155';
        return (
          <div
            key={it.etiqueta}
            title={`${it.etiqueta}: ${it.cantidad} ${unidad}`}
            className="flex flex-col items-center justify-center rounded-md py-2 text-[11px]"
            style={{ backgroundColor: bg, color: fg }}
          >
            <span className="font-medium">{it.etiqueta}</span>
            <span className="font-mono opacity-90">{it.cantidad}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartLine({ data }: { data: SerieItem[] }) {
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

function ChartDonut({ data }: { data: SerieItem[] }) {
  if (!data || data.length === 0) return <EmptyState title="Sin datos en el período" icon={<IconChart />} />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="ingresos" nameKey="etiqueta" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  fontSize: 13,
  boxShadow: '0 4px 16px -2px rgb(15 23 42 / 0.12)',
};

// --- Exportación CSV (sin dependencias) ------------------------------------
function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
