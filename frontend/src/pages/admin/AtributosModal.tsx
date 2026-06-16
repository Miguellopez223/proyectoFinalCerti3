import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/States';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { atributosApi } from '@/api/atributos';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { IconPlus, IconTrash, IconTag } from '@/components/icons';
import type { AtributoProducto, Producto } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  producto: Producto | null;
}

/** Gestiona los atributos (color, talla, etc.) de un producto. */
export function AtributosModal({ open, onClose, producto }: Props) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [atributos, setAtributos] = useState<AtributoProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [valor, setValor] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open || !producto) return;
    setLoading(true);
    atributosApi
      .listarPorProducto(producto.id)
      .then(setAtributos)
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [open, producto, toast]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!producto || !nombre.trim() || !valor.trim()) return;
    setAdding(true);
    try {
      const created = await atributosApi.agregar({ productoId: producto.id, nombre: nombre.trim(), valor: valor.trim() });
      setAtributos((a) => [...a, created]);
      setNombre('');
      setValor('');
      toast.success('Atributo agregado.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  function handleDelete(atributo: AtributoProducto) {
    confirm(
      {
        title: 'Eliminar atributo',
        message: `¿Eliminar "${atributo.nombre}: ${atributo.valor}"?`,
        confirmLabel: 'Eliminar',
      },
      async () => {
        await atributosApi.eliminar(atributo.id);
        setAtributos((a) => a.filter((x) => x.id !== atributo.id));
        toast.success('Atributo eliminado.');
      },
    );
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Atributos del producto"
        description={producto?.nombre}
        size="md"
        footer={
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        <form onSubmit={handleAdd} className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input label="Atributo" placeholder="Color" value={nombre} onChange={(e) => setNombre(e.target.value)} className="flex-1" />
          <Input label="Valor" placeholder="Rojo" value={valor} onChange={(e) => setValor(e.target.value)} className="flex-1" />
          <Button type="submit" loading={adding} leftIcon={<IconPlus className="h-4 w-4" />} disabled={!nombre.trim() || !valor.trim()}>
            Agregar
          </Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner label="Cargando atributos…" />
          </div>
        ) : atributos.length === 0 ? (
          <EmptyState title="Sin atributos" message="Agrega características como color o talla." icon={<IconTag />} />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {atributos.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm">
                  <span className="font-medium text-slate-700">{a.nombre}:</span>{' '}
                  <span className="text-slate-600">{a.valor}</span>
                </div>
                <button
                  onClick={() => handleDelete(a)}
                  aria-label={`Eliminar ${a.nombre}`}
                  className="cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
      {dialog}
    </>
  );
}
