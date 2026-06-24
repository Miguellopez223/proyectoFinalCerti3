import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { direccionesApi } from '@/api/direcciones';
import { pedidosApi } from '@/api/pedidos';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import type { DireccionEnvio, Pedido, StereumCharge } from '@/types';

/**
 * Checkout multi-tienda: 1) dirección, 2) crea un pedido por tienda y 3) paga cada uno con QR.
 * Estructura mínima; el estilo lo pulirá un colaborador.
 */
export default function CheckoutPage() {
  const { user } = useAuth();
  const { carritos, refresh } = useCart();
  const toast = useToast();

  const [step, setStep] = useState<'direccion' | 'pago'>('direccion');
  const [direcciones, setDirecciones] = useState<DireccionEnvio[]>([]);
  const [direccionId, setDireccionId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newDir, setNewDir] = useState({ direccionCalle: '', ciudad: '', referencias: '' });
  const [savingDir, setSavingDir] = useState(false);

  const [creating, setCreating] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [documento, setDocumento] = useState('');
  const [qrs, setQrs] = useState<Record<number, StereumCharge>>({});
  const [genId, setGenId] = useState<number | null>(null);

  useEffect(() => {
    direccionesApi
      .listarPorUsuario(user!.userId)
      .then((d) => {
        setDirecciones(d);
        if (d.length > 0) setDireccionId(d[0].id);
        else setShowNew(true);
      })
      .catch(() => setShowNew(true));
  }, [user]);

  // Polling de los pedidos pendientes mientras se paga.
  useEffect(() => {
    if (step !== 'pago') return;
    if (!pedidos.some((p) => p.estadoPedido === 'PENDIENTE')) return;
    const t = window.setInterval(async () => {
      const actualizados = await Promise.all(
        pedidos.map((p) =>
          p.estadoPedido === 'PENDIENTE' ? pedidosApi.obtener(p.tiendaId, p.id).catch(() => p) : Promise.resolve(p),
        ),
      );
      setPedidos(actualizados);
    }, 5000);
    return () => window.clearInterval(t);
  }, [step, pedidos]);

  const totalGeneral = carritos.reduce((s, c) => s + (c.totalEstimado ?? 0), 0);
  const todosPagados = pedidos.length > 0 && pedidos.every((p) => p.estadoPedido === 'PAGADO');

  async function guardarDireccion(e: FormEvent) {
    e.preventDefault();
    if (!newDir.direccionCalle.trim() || !newDir.ciudad.trim()) {
      toast.error('Dirección y ciudad son obligatorias.');
      return;
    }
    setSavingDir(true);
    try {
      const creada = await direccionesApi.crear({
        usuarioId: user!.userId,
        direccionCalle: newDir.direccionCalle.trim(),
        ciudad: newDir.ciudad.trim(),
        referencias: newDir.referencias.trim() || undefined,
      });
      setDirecciones((d) => [...d, creada]);
      setDireccionId(creada.id);
      setShowNew(false);
      setNewDir({ direccionCalle: '', ciudad: '', referencias: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingDir(false);
    }
  }

  async function crearPedidos() {
    setCreating(true);
    try {
      const creados = await pedidosApi.checkout(user!.userId, direccionId);
      setPedidos(creados);
      setStep('pago');
      void refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function generarQr(pedido: Pedido) {
    setGenId(pedido.id);
    try {
      const charge = await pedidosApi.generarQr(pedido.tiendaId, pedido.id, {
        documentNumber: documento.trim() || undefined,
      });
      setQrs((m) => ({ ...m, [pedido.id]: charge }));
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo generar el QR.'));
    } finally {
      setGenId(null);
    }
  }

  if (step === 'direccion' && carritos.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">Tu carrito está vacío.</p>
        <Link to="/tienda" className="mt-3 inline-block text-cta-600 hover:underline">Ir a comprar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Finalizar compra</h1>

      {step === 'direccion' && (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-1 font-semibold text-slate-800">Dirección de envío</h2>
            <p className="mb-3 text-sm text-slate-500">Opcional. Podés continuar sin dirección.</p>
            <div className="space-y-2">
              {direcciones.map((d) => (
                <label key={d.id} className="flex items-start gap-2 rounded-md border border-slate-200 p-3 text-sm">
                  <input type="radio" name="dir" className="mt-1" checked={direccionId === d.id} onChange={() => setDireccionId(d.id)} />
                  <span><span className="font-medium text-slate-800">{d.direccionCalle}</span> — {d.ciudad}{d.referencias ? ` · ${d.referencias}` : ''}</span>
                </label>
              ))}
              {!showNew ? (
                <button onClick={() => setShowNew(true)} className="text-sm text-cta-600 hover:underline">+ Agregar dirección</button>
              ) : (
                <form onSubmit={guardarDireccion} className="space-y-2 rounded-md border border-slate-200 p-3">
                  <input className="input-base" placeholder="Dirección / calle" value={newDir.direccionCalle} onChange={(e) => setNewDir((f) => ({ ...f, direccionCalle: e.target.value }))} />
                  <input className="input-base" placeholder="Ciudad" value={newDir.ciudad} onChange={(e) => setNewDir((f) => ({ ...f, ciudad: e.target.value }))} />
                  <input className="input-base" placeholder="Referencias (opcional)" value={newDir.referencias} onChange={(e) => setNewDir((f) => ({ ...f, referencias: e.target.value }))} />
                  <button type="submit" disabled={savingDir} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50">Guardar</button>
                </form>
              )}
            </div>
          </section>

          {/* Resumen por tienda */}
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Resumen ({carritos.length} {carritos.length === 1 ? 'tienda' : 'tiendas'})</h2>
            {carritos.map((c) => (
              <div key={c.id} className="mb-3 border-b border-slate-100 pb-2 last:border-0">
                <p className="text-xs font-semibold uppercase text-slate-400">Tienda #{c.tiendaId}</p>
                {c.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm text-slate-600">
                    <span>{it.cantidad}× {it.productoNombre}</span>
                    <span>{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold text-slate-900">
              <span>Total</span><span>{formatCurrency(totalGeneral)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Se generará un pedido y un pago QR por cada tienda.</p>
            <button onClick={crearPedidos} disabled={creating || carritos.length === 0} className="mt-4 w-full rounded-md bg-cta-600 px-4 py-2.5 font-semibold text-white hover:bg-cta-500 disabled:opacity-50">
              {creating ? 'Creando pedidos…' : 'Crear pedidos'}
            </button>
          </section>
        </div>
      )}

      {step === 'pago' && (
        <div className="space-y-6">
          {todosPagados && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800">
              ¡Todos los pedidos fueron pagados! <Link to="/tienda/pedidos" className="font-semibold underline">Ver mis pedidos</Link>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="text-sm text-slate-600">
              Documento del pagador (CI){' '}
              <input className="input-base mt-1" placeholder="Ej. 1234567" value={documento} onChange={(e) => setDocumento(e.target.value)} />
            </label>
          </div>

          {pedidos.map((p) => (
            <section key={p.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Pedido #{p.id} · Tienda #{p.tiendaId}</p>
                  <p className="text-sm text-slate-500">{formatCurrency(p.total)} — {p.codigoSeguimiento}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${p.estadoPedido === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.estadoPedido}
                </span>
              </div>

              {p.estadoPedido !== 'PAGADO' && (
                qrs[p.id] ? (
                  <QrImage qr={qrs[p.id]} />
                ) : (
                  <button onClick={() => generarQr(p)} disabled={genId === p.id} className="rounded-md border border-cta-600 px-3 py-1.5 text-sm font-medium text-cta-600 hover:bg-cta-600/5 disabled:opacity-50">
                    {genId === p.id ? 'Generando…' : 'Generar QR de pago'}
                  </button>
                )
              )}
            </section>
          ))}
          <p className="text-center text-xs text-slate-400">El pago se confirma solo (se verifica cada 5 s).</p>
        </div>
      )}
    </div>
  );
}

function QrImage({ qr }: { qr: StereumCharge }) {
  if (!qr.qr_base64) {
    return (
      <div className="text-sm text-amber-700">
        La pasarela no devolvió imagen de QR.
        {qr.payment_link && <a href={qr.payment_link} target="_blank" rel="noreferrer" className="ml-1 underline">Abrir enlace de pago</a>}
      </div>
    );
  }
  const src = qr.qr_base64.startsWith('data:') ? qr.qr_base64 : `data:image/jpeg;base64,${qr.qr_base64}`;
  return <img src={src} alt="QR de pago" className="h-48 w-48 object-contain" />;
}
