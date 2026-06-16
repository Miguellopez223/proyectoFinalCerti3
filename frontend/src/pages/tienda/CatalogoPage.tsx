import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { productosApi } from '@/api/productos';
import { categoriasApi } from '@/api/categorias';
import { carritoApi } from '@/api/carrito';
import { useAsync } from '@/hooks/useAsync';
import { useDebounced } from '@/hooks/useDebounced';
import { DataState } from '@/components/ui/DataState';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/ProductImage';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { IconSearch, IconCart, IconBox } from '@/components/icons';

export default function CatalogoPage() {
  const { user } = useAuth();
  const tiendaId = user!.tiendaId;
  const toast = useToast();
  const { refresh } = useCart();

  const productosState = useAsync(() => productosApi.listarPorTienda(tiendaId), [tiendaId]);
  const categoriasState = useAsync(() => categoriasApi.listarPorTienda(tiendaId), [tiendaId]);

  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const [addingId, setAddingId] = useState<number | null>(null);

  const productos = useMemo(() => {
    let list = productosState.data ?? [];
    if (categoriaId != null) list = list.filter((p) => p.categoriaId === categoriaId);
    const q = debounced.trim().toLowerCase();
    if (q) list = list.filter((p) => p.nombre.toLowerCase().includes(q));
    return list;
  }, [productosState.data, categoriaId, debounced]);

  async function addToCart(productoId: number) {
    setAddingId(productoId);
    try {
      await carritoApi.agregarItem({ tiendaId, usuarioId: user!.userId, productoId, cantidad: 1 });
      await refresh();
      toast.success('Agregado al carrito.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Catálogo</h1>
        <p className="mt-1 text-sm text-slate-500">Explora los productos disponibles y arma tu pedido.</p>
      </div>

      {/* Buscador */}
      <div className="mb-4 max-w-md">
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Buscar producto…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
        </div>
      </div>

      {/* Filtro de categorías */}
      {(categoriasState.data?.length ?? 0) > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <CategoryChip active={categoriaId == null} onClick={() => setCategoriaId(null)}>
            Todas
          </CategoryChip>
          {categoriasState.data?.map((c) => (
            <CategoryChip key={c.id} active={categoriaId === c.id} onClick={() => setCategoriaId(c.id)}>
              {c.nombre}
            </CategoryChip>
          ))}
        </div>
      )}

      <DataState
        loading={productosState.loading}
        error={productosState.error}
        isEmpty={productos.length === 0}
        onRetry={productosState.reload}
        loadingFallback={<SkeletonCards count={8} />}
        emptyFallback={
          <EmptyState
            title={debounced || categoriaId != null ? 'Sin coincidencias' : 'Catálogo vacío'}
            message={debounced || categoriaId != null ? 'Prueba con otro filtro o término.' : 'Esta tienda aún no publicó productos.'}
            icon={<IconBox />}
          />
        }
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map((p) => {
            const agotado = p.stock <= 0;
            return (
              <article key={p.id} className="card-base group flex flex-col overflow-hidden transition-shadow hover:shadow-soft">
                <Link to={`/tienda/producto/${p.id}`} className="block">
                  <div className="relative">
                    <ProductImage src={p.imagenUrl} alt={p.nombre} className="aspect-square w-full" />
                    {agotado && (
                      <span className="absolute right-2 top-2">
                        <Badge tone="danger">Agotado</Badge>
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  {p.categoriaNombre && (
                    <Badge tone="brand" className="mb-2 self-start">
                      {p.categoriaNombre}
                    </Badge>
                  )}
                  <Link to={`/tienda/producto/${p.id}`}>
                    <h3 className="line-clamp-2 text-sm font-medium text-slate-900 transition-colors group-hover:text-brand-700">
                      {p.nombre}
                    </h3>
                  </Link>
                  <p className="mt-2 font-mono text-lg font-semibold text-slate-900">{formatCurrency(p.precio)}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{agotado ? 'Sin stock' : `${p.stock} disponibles`}</p>
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    variant="cta"
                    disabled={agotado}
                    loading={addingId === p.id}
                    leftIcon={!agotado ? <IconCart className="h-4 w-4" /> : undefined}
                    onClick={() => addToCart(p.id)}
                  >
                    {agotado ? 'Agotado' : 'Agregar'}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </DataState>
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}
