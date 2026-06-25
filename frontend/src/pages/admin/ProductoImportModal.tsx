import { ChangeEvent, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { productosApi } from '@/api/productos';
import { useToast } from '@/context/ToastContext';
import { getErrorMessage } from '@/lib/errors';
import type { ProductoImportResponse } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
  tiendaId: number;
}

const template = [
  'nombre,slugProducto,descripcionLarga,precio,precioCosto,precioOferta,stock,stockMinimo,categoriaId,categoriaNombre,unidadMedidaId,unidadMedidaNombre,imagenUrl',
  '"Polera Negra","polera-negra","Polera de algodon",80,45,,20,5,,"Ropa",,"Unidad","https://example.com/polera.png"',
  '"Taza Blanca","taza-blanca","Taza ceramica",35,18,,50,10,,"Hogar",,"Unidad",""',
].join('\n');

export function ProductoImportModal({ open, onClose, onImported, tiendaId }: Props) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ProductoImportResponse | null>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setResult(null);
    setFile(e.target.files?.[0] ?? null);
  }

  function downloadTemplate() {
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-productos.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) {
      toast.error('Selecciona un archivo CSV.');
      return;
    }

    setImporting(true);
    try {
      const response = await productosApi.importarCsv(tiendaId, file);
      setResult(response);
      if (response.importados > 0) {
        onImported();
      }
      if (response.fallidos > 0) {
        toast.info(`Importados: ${response.importados}. Con errores: ${response.fallidos}.`);
      } else {
        toast.success(`Se importaron ${response.importados} productos.`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={importing ? () => {} : onClose}
      title="Importar productos"
      description="Sube un CSV con productos de esta tienda."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={importing}>
            Cerrar
          </Button>
          <Button onClick={handleImport} loading={importing}>
            Importar CSV
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Formato recomendado</p>
              <p className="mt-1 text-sm text-slate-500">
                Columnas obligatorias: nombre, precio y stock. El slug se genera si queda vacio.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
              Descargar plantilla
            </Button>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Archivo CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </label>

        {file && (
          <p className="text-sm text-slate-500">
            Seleccionado: <span className="font-medium text-slate-700">{file.name}</span>
          </p>
        )}

        {result && (
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <SummaryItem label="Filas" value={result.totalFilas} />
              <SummaryItem label="Importados" value={result.importados} />
              <SummaryItem label="Errores" value={result.fallidos} />
            </div>

            {result.errores.length > 0 && (
              <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-red-100 bg-red-50">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-red-100 text-red-900">
                    <tr>
                      <th className="px-3 py-2 font-medium">Fila</th>
                      <th className="px-3 py-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errores.slice(0, 100).map((error, index) => (
                      <tr key={`${error.fila}-${index}`} className="border-t border-red-100">
                        <td className="px-3 py-2 font-mono text-red-900">{error.fila}</td>
                        <td className="px-3 py-2 text-red-800">{error.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}
