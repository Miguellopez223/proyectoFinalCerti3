import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea, FieldWrapper } from '@/components/ui/Field';
import { ProductImage } from '@/components/ProductImage';
import { productosApi } from '@/api/productos';
import { categoriasApi } from '@/api/categorias';
import { unidadesApi } from '@/api/unidades';
import { uploadsApi } from '@/api/uploads';
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
  precioOferta: '',
  ofertaInicio: '',
  ofertaFin: '',
  stock: '',
  stockMinimo: '',
  imagenUrl: '',
  categoriaId: '',
  unidadMedidaId: '',
};

export function ProductoFormModal({ open, onClose, onSaved, tiendaId, producto }: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        precioOferta: producto.precioOferta != null ? String(producto.precioOferta) : '',
        ofertaInicio: producto.ofertaInicio ? producto.ofertaInicio.slice(0, 16) : '',
        ofertaFin: producto.ofertaFin ? producto.ofertaFin.slice(0, 16) : '',
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

  function handleSubirImagen() {
    fileInputRef.current?.click();
  }

  async function handleImagenSeleccionada(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadsApi.subirImagen(file, 'productos');
      set('imagenUrl', uploaded.url);
      toast.success('Imagen subida.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.';
    if (!form.slugProducto.trim()) next.slugProducto = 'El slug es obligatorio.';
    const precio = Number(form.precio);
    if (!form.precio || Number.isNaN(precio) || precio <= 0) next.precio = 'El precio debe ser mayor a 0.';
    if (form.precioOferta) {
      const oferta = Number(form.precioOferta);
      if (Number.isNaN(oferta) || oferta <= 0) next.precioOferta = 'El precio de oferta debe ser mayor a 0.';
      else if (precio && oferta >= precio) next.precioOferta = 'La oferta debe ser menor al precio normal.';
    }
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
      precioOferta: form.precioOferta ? Number(form.precioOferta) : null,
      ofertaInicio: form.precioOferta && form.ofertaInicio ? form.ofertaInicio : null,
      ofertaFin: form.precioOferta && form.ofertaFin ? form.ofertaFin : null,
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
        <FieldWrapper
          label="Imagen del producto"
          hint="Subi un archivo para guardarlo en S3 o pega una URL."
        >
          <div className="flex items-start gap-3">
            <ProductImage
              src={form.imagenUrl || undefined}
              alt={form.nombre || 'Producto'}
              className="h-20 w-20 shrink-0 rounded-lg border border-slate-200"
            />
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleImagenSeleccionada}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSubirImagen}
                  loading={uploading}
                  disabled={uploading}
                >
                  Subir imagen
                </Button>
                {form.imagenUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => set('imagenUrl', '')}>
                    Quitar
                  </Button>
                )}
              </div>
              <input
                className="input-base"
                value={form.imagenUrl}
                onChange={(e) => set('imagenUrl', e.target.value)}
                placeholder="https://... (o subi un archivo)"
              />
            </div>
          </div>
        </FieldWrapper>
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
          className="sm:col-span-2"
          label="Precio de oferta (Bs)"
          type="number"
          step="0.01"
          min="0"
          value={form.precioOferta}
          onChange={(e) => set('precioOferta', e.target.value)}
          error={errors.precioOferta}
          hint="Opcional. Si lo llenás, el producto se muestra con descuento. Vacío = sin oferta."
        />
        <Input
          label="Oferta desde (opcional)"
          type="datetime-local"
          value={form.ofertaInicio}
          onChange={(e) => set('ofertaInicio', e.target.value)}
          hint="Vacío = desde ya."
          disabled={!form.precioOferta}
        />
        <Input
          label="Oferta hasta (opcional)"
          type="datetime-local"
          value={form.ofertaFin}
          onChange={(e) => set('ofertaFin', e.target.value)}
          hint="Vacío = sin vencimiento. Para flash sale, poné fecha."
          disabled={!form.precioOferta}
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
