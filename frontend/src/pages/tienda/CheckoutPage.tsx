import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { direccionesApi } from '@/api/direcciones';
import { pedidosApi } from '@/api/pedidos';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/States';
import { Badge, estadoPedidoTone } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { IconCart, IconCheck, IconPlus, IconRefresh } from '@/components/icons';
import type { DireccionEnvio, Pedido, StereumCharge } from '@/types';

type Step = 'direccion' | 'pago';

export default function CheckoutPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const navigate = useNavigate();
  const toast = useToast();
  const { cart, refresh, setCart } = useCart();

  const [step, setStep] = useState<Step>('direccion');

  // Direcciones
  const [direcciones, setDirecciones] = useState<DireccionEnvio[]>([]);
  const [loadingDir, setLoadingDir] = useState(true);
  const [direccionId, setDireccionId] = useState<number | null>(null);
  const [showNewDir, setShowNewDir] = useState(false);
  const [newDir, setNewDir] = useState({ direccionCalle: '', ciudad: '', referencias: '' });
  const [dirErrors, setDirErrors] = useState<Record<string, string>>({});
  const [savingDir, setSavingDir] = useState(false);

  // Pedido + pago
  const [creating, setCreating] = useState(false);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [qr, setQr] = useState<StereumCharge | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    direccionesApi
      .listarPorUsuario(user!.userId)
      .then((d) => {
        setDirecciones(d);
        if (d.length > 0) setDireccionId(d[0].id);
        else setShowNewDir(true);
      })
      .catch(() => setShowNewDir(true))
      .finally(() => setLoadingDir(false));
  }, [user]);

  // Polling del estado del pedido mientras esté pendiente.
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!pedido || step !== 'pago') return;
    if (pedido.estadoPedido !== 'PENDIENTE') return;

    timerRef.current = window.setInterval(async () => {
      try {
        const fresh = await pedidosApi.obtener(tiendaId, pedido.id);
        setPedido(fresh);
        if (fresh.estadoPedido !== 'PENDIENTE') {
          if (timerRef.current) window.clearInterval(timerRef.current);
          if (fresh.estadoPedido === 'PAGADO') toast.success('¡Pago confirmado!');
        }
      } catch {
        // Ignorar errores transitorios del polling.
      }
    }, 5000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [pedido, step, tiendaId, toast]);

  const items = cart?.items ?? [];
  const pagado = pedido?.estadoPedido === 'PAGADO';

  async function saveNewDireccion(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!newDir.direccionCalle.trim()) next.direccionCalle = 'La dirección es obligatoria.';
    if (!newDir.ciudad.trim()) next.ciudad = 'La ciudad es obligatoria.';
    setDirErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingDir(true);
    try {
      const created = await direccionesApi.crear({
        usuarioId: user!.userId,
        direccionCalle: newDir.direccionCalle.trim(),
        ciudad: newDir.ciudad.trim(),
        referencias: newDir.referencias.trim() || undefined,
      });
      setDirecciones((d) => [...d, created]);
      setDireccionId(created.id);
      setShowNewDir(false);
      setNewDir({ direccionCalle: '', ciudad: '', referencias: '' });
      toast.success('Dirección guardada.');
    } catch (err) {
      setDirErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSavingDir(false);
    }
  }

  async function crearPedido() {
    setCreating(true);
    try {
      const nuevo = await pedidosApi.crearDesdeCarrito({
        tiendaId,
        usuarioId: user!.userId,
        direccionId: direccionId ?? undefined,
      });
      setPedido(nuevo);
      setStep('pago');
      // El carrito se consumió al crear el pedido.
      setCart(null);
      void refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function generarQr() {
    if (!pedido) return;
    setGeneratingQr(true);
    try {
      const charge = await pedidosApi.generarQr(tiendaId, pedido.id, {
        documentNumber: documentNumber.trim() || undefined,
      });
      setQr(charge);
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo generar el QR.'));
    } finally {
      setGeneratingQr(false);
    }
  }

  async function refrescarEstado() {
    if (!pedido) return;
    setPolling(true);
    try {
      const fresh = await pedidosApi.obtener(tiendaId, pedido.id);
      setPedido(fresh);
      if (fresh.estadoPedido === 'PAGADO') toast.success('¡Pago confirmado!');
      else toast.info(`Estado actual: ${fresh.estadoPedido}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPolling(false);
    }
  }

  // El carrito vacío solo bloquea el paso de dirección (en el paso de pago ya se consumió).
  if (step === 'direccion' && !loadingDir && items.length === 0) {
    return (
      <EmptyState
        title="No hay nada para pagar"
        message="Tu carrito está vacío."
        icon={<IconCart />}
        action={
          <Link to="/tienda">
            <Button>Ir al catálogo</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900">Finalizar compra</h1>

      {/* Indicador de pasos */}
      <div className="mb-8 flex items-center gap-3">
        <StepDot n={1} label="Envío" active={step === 'direccion'} done={step === 'pago'} />
        <span className="h-0.5 w-12 bg-slate-200" />
        <StepDot n={2} label="Pago" active={step === 'pago'} done={pagado} />
      </div>

      {step === 'direccion' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-5">
              <h2 className="text-base font-semibold text-slate-900">Dirección de envío</h2>
              <p className="mt-0.5 text-sm text-slate-500">Opcional. Puedes continuar sin dirección.</p>

              {loadingDir ? (
                <div className="py-6">
                  <Spinner label="Cargando direcciones…" />
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {direcciones.map((d) => (
                    <label
                      key={d.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                        direccionId === d.id ? 'border-brand-500 bg-brand-50/50' : 'border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <input
                        type="radio"
                        name="direccion"
                        className="mt-1 accent-brand-600"
                        checked={direccionId === d.id}
                        onChange={() => setDireccionId(d.id)}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{d.direccionCalle}</p>
                        <p className="text-sm text-slate-500">
                          {d.ciudad}
                          {d.referencias ? ` · ${d.referencias}` : ''}
                        </p>
                      </div>
                    </label>
                  ))}

                  {!showNewDir ? (
                    <Button variant="ghost" size="sm" leftIcon={<IconPlus className="h-4 w-4" />} onClick={() => setShowNewDir(true)}>
                      Agregar nueva dirección
                    </Button>
                  ) : (
                    <form onSubmit={saveNewDireccion} className="space-y-3 rounded-lg border border-slate-200 p-4">
                      <Input label="Dirección" value={newDir.direccionCalle} onChange={(e) => setNewDir((f) => ({ ...f, direccionCalle: e.target.value }))} error={dirErrors.direccionCalle} required />
                      <Input label="Ciudad" value={newDir.ciudad} onChange={(e) => setNewDir((f) => ({ ...f, ciudad: e.target.value }))} error={dirErrors.ciudad} required />
                      <Textarea label="Referencias" value={newDir.referencias} onChange={(e) => setNewDir((f) => ({ ...f, referencias: e.target.value }))} />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" loading={savingDir}>
                          Guardar dirección
                        </Button>
                        {direcciones.length > 0 && (
                          <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewDir(false)}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}
            </Card>
          </div>

          <OrderSummary items={items} total={cart?.totalEstimado}>
            <Button className="w-full" size="lg" variant="cta" loading={creating} onClick={crearPedido} disabled={items.length === 0}>
              Crear pedido
            </Button>
          </OrderSummary>
        </div>
      )}

      {step === 'pago' && pedido && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="p-6">
              {pagado ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cta-50 text-cta-600">
                    <IconCheck className="h-8 w-8" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-slate-900">¡Pago confirmado!</h2>
                  <p className="mt-1 text-sm text-slate-500">Tu pedido #{pedido.id} fue pagado correctamente.</p>
                  <div className="mt-6 flex gap-3">
                    <Button onClick={() => navigate('/tienda/pedidos')}>Ver mis pedidos</Button>
                    <Button variant="secondary" onClick={() => navigate('/tienda')}>
                      Seguir comprando
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-900">Pago por QR</h2>
                    <Badge tone={estadoPedidoTone(pedido.estadoPedido)}>{pedido.estadoPedido}</Badge>
                  </div>

                  {!qr ? (
                    <div className="mt-4">
                      <Input
                        label="Documento del pagador (CI)"
                        hint="Requerido por la pasarela para cobros en Bs."
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        placeholder="Ej. 1234567"
                      />
                      <Button className="mt-4" variant="cta" size="lg" loading={generatingQr} onClick={generarQr}>
                        Generar QR de pago
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-col items-center">
                      <QrImage qr={qr} />
                      <p className="mt-4 text-center text-sm text-slate-500">
                        Escanea el QR con tu app bancaria. El pago se confirma automáticamente; también puedes actualizar el estado.
                      </p>
                      <Button className="mt-4" variant="secondary" loading={polling} leftIcon={<IconRefresh className="h-4 w-4" />} onClick={refrescarEstado}>
                        Ya pagué / actualizar estado
                      </Button>
                      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <Spinner className="h-3 w-3" /> Verificando automáticamente cada 5 s…
                      </p>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>

          <OrderSummary items={pedido.items} total={pedido.total} />
        </div>
      )}
    </div>
  );
}

function QrImage({ qr }: { qr: StereumCharge }) {
  if (!qr.qr_base64) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-700">
        La pasarela no devolvió una imagen de QR.
        {qr.payment_link && (
          <a href={qr.payment_link} target="_blank" rel="noreferrer" className="mt-2 block font-medium text-brand-600 underline">
            Abrir enlace de pago
          </a>
        )}
      </div>
    );
  }
  const src = qr.qr_base64.startsWith('data:') ? qr.qr_base64 : `data:image/jpeg;base64,${qr.qr_base64}`;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <img src={src} alt="Código QR de pago" className="h-56 w-56 object-contain" />
    </div>
  );
}

function OrderSummary({
  items,
  total,
  children,
}: {
  items: { id: number; productoNombre: string; cantidad: number; subtotal: number }[];
  total?: number;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <Card className="p-5">
        <h2 className="text-base font-semibold text-slate-900">Resumen del pedido</h2>
        <ul className="mt-4 space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-slate-600">
                {it.cantidad}× {it.productoNombre}
              </span>
              <span className="font-mono text-slate-700">{formatCurrency(it.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="font-medium text-slate-700">Total</span>
          <span className="font-mono text-xl font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
        {children && <div className="mt-5">{children}</div>}
      </Card>
    </div>
  );
}

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
          done ? 'bg-cta-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400',
        )}
      >
        {done ? <IconCheck className="h-4 w-4" /> : n}
      </span>
      <span className={cn('text-sm font-medium', active || done ? 'text-slate-800' : 'text-slate-400')}>{label}</span>
    </div>
  );
}
