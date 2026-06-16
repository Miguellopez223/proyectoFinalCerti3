import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { productosApi, type ListarPaginadoParams } from '@/api/productos';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Table, Th, Td, Tr } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { DataState } from '@/components/ui/DataState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { ProductImage } from '@/components/ProductImage';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';
import { useDebounced } from '@/hooks/useDebounced';
import { ProductoFormModal } from './ProductoFormModal';
import { AtributosModal } from './AtributosModal';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconTag, IconBox } from '@/components/icons';
import type { Producto } from '@/types';

const SORT_OPTIONS = [
  { value: 'nombre,ASC', label: 'Nombre (A-Z)' },
  { value: 'nombre,DESC', label: 'Nombre (Z-A)' },
  { value: 'precio,ASC', label: 'Precio (menor)' },
  { value: 'precio,DESC', label: 'Precio (mayor)' },
  { value: 'stock,ASC', label: 'Stock (menor)' },
  { value: 'stock,DESC', label: 'Stock (mayor)' },
];

export default function ProductosPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('nombre,ASC');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);

  const [sortBy, sortDir] = sort.split(',') as [string, 'ASC' | 'DESC'];
  const params: ListarPaginadoParams = { page, size: 10, sortBy, sortDir };

  const { data, loading, error, reload } = useAsync(
    () => productosApi.listarPaginado(tiendaId, params),
    [tiendaId, page, sort],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [attrProducto, setAttrProducto] = useState<Producto | null>(null);

  // Filtro por nombre en cliente sobre la página actual (el backend pagina; el
  // buscador refina lo visible sin un endpoint de búsqueda dedicado).
  const visibles = (data?.content ?? []).filter((p) =>
    p.nombre.toLowerCase().includes(debouncedSearch.trim().toLowerCase()),
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: Producto) {
    setEditing(p);
    setFormOpen(true);
  }

  function handleDelete(p: Producto) {
    confirm(
      {
        title: 'Eliminar producto',
        message: (
          <>
            ¿Seguro que deseas eliminar <strong>{p.nombre}</strong>? Se desactivará del catálogo.
          </>
        ),
        confirmLabel: 'Eliminar',
      },
      async () => {
        await productosApi.eliminar(tiendaId, p.id);
        toast.success('Producto eliminado.');
        reload();
      },
    );
  }

  return (
    <>
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de tu tienda."
        actions={
          <Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>
            Nuevo producto
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Buscar en esta página…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar producto"
          />
        </div>
        <Select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(0);
          }}
          className="sm:w-56"
          aria-label="Ordenar por"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <DataState
        loading={loading}
        error={error}
        isEmpty={visibles.length === 0}
        onRetry={reload}
        loadingFallback={
          <div className="card-base p-4">
            <SkeletonTable rows={8} cols={5} />
          </div>
        }
        emptyFallback={
          <EmptyState
            title={debouncedSearch ? 'Sin coincidencias' : 'Aún no hay productos'}
            message={debouncedSearch ? 'Prueba con otro término de búsqueda.' : 'Crea tu primer producto para empezar a vender.'}
            icon={<IconBox />}
            action={
              !debouncedSearch ? (
                <Button leftIcon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>
                  Nuevo producto
                </Button>
              ) : undefined
            }
          />
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Producto</Th>
              <Th>Categoría</Th>
              <Th align="right">Precio</Th>
              <Th align="right">Stock</Th>
              <Th align="center">Estado</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((p) => {
              const agotado = p.stock === 0;
              const bajo = !agotado && p.stockMinimo != null && p.stock <= p.stockMinimo;
              return (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <ProductImage src={p.imagenUrl} alt={p.nombre} className="h-11 w-11 shrink-0 rounded-lg" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{p.nombre}</p>
                        <p className="truncate font-mono text-xs text-slate-400">{p.slugProducto}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>{p.categoriaNombre ?? <span className="text-slate-400">—</span>}</Td>
                  <Td align="right" className="font-mono font-medium text-slate-800">
                    {formatCurrency(p.precio)}
                  </Td>
                  <Td align="right">
                    <Badge tone={agotado ? 'danger' : bajo ? 'warning' : 'neutral'}>{p.stock}</Badge>
                  </Td>
                  <Td align="center">
                    <Badge tone={p.estado ? 'success' : 'neutral'}>{p.estado ? 'Activo' : 'Inactivo'}</Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton label="Atributos" onClick={() => setAttrProducto(p)}>
                        <IconTag className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Editar" onClick={() => openEdit(p)}>
                        <IconEdit className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Eliminar" danger onClick={() => handleDelete(p)}>
                        <IconTrash className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>

        {data && (
          <div className="mt-4">
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onChange={setPage}
            />
          </div>
        )}
      </DataState>

      <ProductoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
        tiendaId={tiendaId}
        producto={editing}
      />
      <AtributosModal open={!!attrProducto} onClose={() => setAttrProducto(null)} producto={attrProducto} />
      {dialog}
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        'cursor-pointer rounded-lg p-2 text-slate-500 transition-colors ' +
        (danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-brand-50 hover:text-brand-600')
      }
    >
      {children}
    </button>
  );
}
