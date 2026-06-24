import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { tiendasApi } from '@/api/tiendas';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataState } from '@/components/ui/DataState';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, FieldWrapper } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductImage } from '@/components/ProductImage';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';
import { openCloudinaryUploadWidget, cloudinaryConfigured } from '@/lib/cloudinary';
import type { Tienda, TiendaRequest } from '@/types';

const emptyForm = {
  nombre: '',
  slug: '',
  descripcion: '',
  logoUrl: '',
  bannerUrl: '',
  telefonoContacto: '',
  emailContacto: '',
};

/**
 * Configuración de la tienda del admin (su propia tienda, por user.tiendaId).
 * Permite editar nombre, descripción, logo, banner y datos de contacto. El slug es de
 * solo lectura (se usa en la URL pública de la tienda y no se modifica al actualizar).
 */
export default function MiTiendaPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();

  const { data, loading, error, reload } = useAsync<Tienda>(() => tiendasApi.obtener(tiendaId), [tiendaId]);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      nombre: data.nombre ?? '',
      slug: data.slug ?? '',
      descripcion: data.descripcion ?? '',
      logoUrl: data.logoUrl ?? '',
      bannerUrl: data.bannerUrl ?? '',
      telefonoContacto: data.telefonoContacto ?? '',
      emailContacto: data.emailContacto ?? '',
    });
  }, [data]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function subirImagen(campo: 'logoUrl' | 'bannerUrl') {
    setUploading(campo === 'logoUrl' ? 'logo' : 'banner');
    openCloudinaryUploadWidget(
      (url) => {
        set(campo, url);
        toast.success('Imagen subida.');
      },
      (message) => {
        setUploading(null);
        toast.error(message);
      },
      () => setUploading(null),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setErrors({ nombre: 'El nombre es obligatorio.' });
      return;
    }
    setErrors({});
    setSubmitting(true);
    const body: TiendaRequest = {
      nombre: form.nombre.trim(),
      slug: form.slug, // requerido por el backend; el update no lo cambia
      descripcion: form.descripcion.trim() || null,
      bannerUrl: form.bannerUrl.trim() || null,
      logoUrl: form.logoUrl.trim() || undefined,
      telefonoContacto: form.telefonoContacto.trim() || undefined,
      emailContacto: form.emailContacto.trim() || undefined,
    };
    try {
      await tiendasApi.actualizar(tiendaId, body);
      toast.success('Tienda actualizada.');
      reload();
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...getFieldErrors(err) }));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Mi tienda" description="Datos de tu tienda que se muestran en el marketplace." />
      <DataState
        loading={loading}
        error={error}
        onRetry={reload}
        loadingFallback={
          <Card className="space-y-4 p-5 sm:p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </Card>
        }
      >
        <Card className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              className="sm:col-span-2"
              label="Nombre de la tienda"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              error={errors.nombre}
              required
            />
            <Input label="Slug (URL pública)" value={form.slug} readOnly hint="No editable: identifica la tienda en la URL." />
            <Input
              label="Teléfono de contacto"
              value={form.telefonoContacto}
              onChange={(e) => set('telefonoContacto', e.target.value)}
            />
            <Input
              label="Email de contacto"
              type="email"
              value={form.emailContacto}
              onChange={(e) => set('emailContacto', e.target.value)}
            />
            <Textarea
              className="sm:col-span-2"
              label="Descripción / tagline"
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              hint="Ej: «Tienda de productos tecnológicos». Aparece en la cabecera de tu tienda."
            />

            <FieldWrapper
              label="Logo"
              hint={cloudinaryConfigured ? 'Subí un archivo o pegá una URL.' : 'Falta configurar Cloudinary; pegá una URL.'}
            >
              <div className="flex items-start gap-3">
                <ProductImage src={form.logoUrl || undefined} alt="Logo" className="h-20 w-20 shrink-0 rounded-lg border border-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => subirImagen('logoUrl')}
                      loading={uploading === 'logo'}
                      disabled={!cloudinaryConfigured}
                    >
                      Subir logo
                    </Button>
                    {form.logoUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => set('logoUrl', '')}>
                        Quitar
                      </Button>
                    )}
                  </div>
                  <input
                    className="input-base"
                    value={form.logoUrl}
                    onChange={(e) => set('logoUrl', e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </FieldWrapper>

            <FieldWrapper
              label="Banner (opcional)"
              hint={cloudinaryConfigured ? 'Imagen de cabecera de tu tienda.' : 'Falta configurar Cloudinary; pegá una URL.'}
            >
              <div className="flex items-start gap-3">
                <ProductImage src={form.bannerUrl || undefined} alt="Banner" className="h-20 w-32 shrink-0 rounded-lg border border-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => subirImagen('bannerUrl')}
                      loading={uploading === 'banner'}
                      disabled={!cloudinaryConfigured}
                    >
                      Subir banner
                    </Button>
                    {form.bannerUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => set('bannerUrl', '')}>
                        Quitar
                      </Button>
                    )}
                  </div>
                  <input
                    className="input-base"
                    value={form.bannerUrl}
                    onChange={(e) => set('bannerUrl', e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>
            </FieldWrapper>

            <div className="sm:col-span-2">
              <Button type="submit" loading={submitting}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>
      </DataState>
    </div>
  );
}
