import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { productosApi } from '@/api/productos';
import { categoriasApi } from '@/api/categorias';
import { unidadesApi } from '@/api/unidades';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';
import { slugify } from '@/lib/format';
import type { Categoria, Producto, ProductoRequest, UnidadMedida } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  tiendaId: number;
  producto: Producto | null; // null = crear
}

const emptyForm = {
  nombre: '',
  slugProducto: '',
  descripcionLarga: '',
  precio: '',
  precioCosto: '',
  stock: '',
  stockMinimo: '',
  imagenUrl: '',
  categoriaId: '',
  unidadMedidaId: '',
};

export function ProductoFormModal({ open, onClose, onSaved, tiendaId, producto }: Props) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);

  // Carga selects al abrir.
  useEffect(() => {
    if (!open) return;
    categoriasApi.listarPorTienda(tiendaId).then(setCategorias).catch(() => setCategorias([]));
    unidadesApi.listarPorTienda(tiendaId).then(setUnidades).catch(() => setUnidades([]));
  }, [open, tiendaId]);

  // Rellena el formulario al abrir (editar o crear).
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSlugTouched(true);
    if (producto) {
      setForm({
        nombre: producto.nombre ?? '',
        slugProducto: producto.slugProducto ?? '',
        descripcionLarga: producto.descripcionLarga ?? '',
        precio: String(producto.precio ?? ''),
        precioCosto: producto.precioCosto != null ? String(producto.precioCosto) : '',
        stock: String(producto.stock ?? ''),
        stockMinimo: producto.stockMinimo != null ? String(producto.stockMinimo) : '',
        imagenUrl: producto.imagenUrl ?? '',
        categoriaId: producto.categoriaId != null ? String(producto.categoriaId) : '',
        unidadMedidaId: producto.unidadMedidaId != null ? String(producto.unidadMedidaId) : '',
      });
    } else {
      setForm(emptyForm);
      setSlugTouched(false);
    }
  }, [open, producto]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onNombreChange(value: string) {
    set('nombre', value);
    if (!slugTouched) set('slugProducto', slugify(value));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.';
    if (!form.slugProducto.trim()) next.slugProducto = 'El slug es obligatorio.';
    const precio = Number(form.precio);
    if (!form.precio || Number.isNaN(precio) || precio <= 0) next.precio = 'El precio debe ser mayor a 0.';
    if (form.stock === '' || Number.isNaN(Number(form.stock)) || Number(form.stock) < 0)
      next.stock = 'El stock es obligatorio (≥ 0).';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const body: ProductoRequest = {
      tiendaId,
      nombre: form.nombre.trim(),
      slugProducto: form.slugProducto.trim(),
      descripcionLarga: form.descripcionLarga.trim() || undefined,
      precio: Number(form.precio),
      precioCosto: form.precioCosto ? Number(form.precioCosto) : undefined,
      stock: Number(form.stock),
      stockMinimo: form.stockMinimo ? Number(form.stockMinimo) : undefined,
      imagenUrl: form.imagenUrl.trim() || undefined,
      categoriaId: form.categoriaId ? Number(form.categoriaId) : undefined,
      unidadMedidaId: form.unidadMedidaId ? Number(form.unidadMedidaId) : undefined,
    };
    try {
      if (producto) {
        await productosApi.actualizar(producto.id, body);
        toast.success('Producto actualizado.');
      } else {
        await productosApi.crear(body);
        toast.success('Producto creado.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...getFieldErrors(err) }));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={producto ? 'Editar producto' : 'Nuevo producto'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button form="producto-form" type="submit" loading={submitting}>
            {producto ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      }
    >
      <form id="producto-form" onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          className="sm:col-span-2"
          label="Nombre"
          value={form.nombre}
          onChange={(e) => onNombreChange(e.target.value)}
          error={errors.nombre}
          required
        />
        <Input
          label="Slug"
          value={form.slugProducto}
          onChange={(e) => {
            setSlugTouched(true);
            set('slugProducto', e.target.value);
          }}
          error={errors.slugProducto}
          hint="Identificador único en la URL."
          required
        />
        <Input
          label="URL de imagen"
          value={form.imagenUrl}
          onChange={(e) => set('imagenUrl', e.target.value)}
          placeholder="https://…"
        />
        <Input
          label="Precio (Bs)"
          type="number"
          step="0.01"
          min="0"
          value={form.precio}
          onChange={(e) => set('precio', e.target.value)}
          error={errors.precio}
          required
        />
        <Input
          label="Precio de costo (Bs)"
          type="number"
          step="0.01"
          min="0"
          value={form.precioCosto}
          onChange={(e) => set('precioCosto', e.target.value)}
          hint="Opcional, para el cálculo de utilidad."
        />
        <Input
          label="Stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={(e) => set('stock', e.target.value)}
          error={errors.stock}
          required
        />
        <Input
          label="Stock mínimo"
          type="number"
          min="0"
          value={form.stockMinimo}
          onChange={(e) => set('stockMinimo', e.target.value)}
          hint="Para alertas de stock bajo."
        />
        <Select label="Categoría" value={form.categoriaId} onChange={(e) => set('categoriaId', e.target.value)}>
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        <Select label="Unidad de medida" value={form.unidadMedidaId} onChange={(e) => set('unidadMedidaId', e.target.value)}>
          <option value="">Sin unidad</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
              {u.abreviatura ? ` (${u.abreviatura})` : ''}
            </option>
          ))}
        </Select>
        <Textarea
          className="sm:col-span-2"
          label="Descripción"
          value={form.descripcionLarga}
          onChange={(e) => set('descripcionLarga', e.target.value)}
        />
      </form>
    </Modal>
  );
}
