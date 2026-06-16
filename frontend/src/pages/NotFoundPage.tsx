import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="font-mono text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-slate-500">La ruta que buscas no existe o fue movida.</p>
      <Link to="/login" className="mt-6">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
