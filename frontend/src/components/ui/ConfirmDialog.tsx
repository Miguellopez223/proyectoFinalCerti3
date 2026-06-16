import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { getErrorMessage } from '@/lib/errors';
import { useToast } from '@/context/ToastContext';

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  onConfirm: () => Promise<void> | void;
}

/**
 * Hook para confirmaciones. Devuelve `confirm(opts, action)` y el nodo `<dialog/>`.
 * El action se ejecuta dentro del propio diálogo, con loading y manejo de error vía toast.
 */
export function useConfirm() {
  const toast = useToast();
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions, action: () => Promise<void> | void) => {
    setState({ ...opts, open: true, onConfirm: action });
  }, []);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await state.onConfirm();
      close();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const dialog = (
    <Modal
      open={state.open}
      onClose={loading ? () => {} : close}
      title={state.title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            {state.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button
            variant={state.variant === 'primary' ? 'primary' : 'danger'}
            onClick={handleConfirm}
            loading={loading}
          >
            {state.confirmLabel ?? 'Confirmar'}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{state.message}</div>
    </Modal>
  );

  return { confirm, dialog };
}
