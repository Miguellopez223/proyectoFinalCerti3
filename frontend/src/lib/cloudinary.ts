/**
 * Integracion con el Upload Widget de Cloudinary (modo UNSIGNED, opcion A).
 *
 * Solo se usan valores publicos: el cloud name y un upload preset configurado
 * como "Unsigned" en el panel de Cloudinary. El API Key/Secret NO intervienen
 * en el navegador. El widget sube el archivo directo a Cloudinary y nos devuelve
 * la URL segura (https), que guardamos en producto.imagenUrl como hasta ahora.
 */

const SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js';
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/** true cuando hay cloud name + preset configurados en el .env. */
export const cloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

interface CloudinaryWidgetResult {
  event?: string;
  info?: { secure_url?: string };
}

interface CloudinaryWidget {
  open: () => void;
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: CloudinaryWidgetResult) => void,
      ) => CloudinaryWidget;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Carga el script del widget una sola vez (lazy). */
function loadWidgetScript(): Promise<void> {
  if (window.cloudinary) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('No se pudo cargar el widget de Cloudinary.'));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Abre el widget de subida. Llama a onSuccess con la URL https de la imagen
 * cuando la subida termina, o a onError con un mensaje si algo falla.
 */
export async function openCloudinaryUploadWidget(
  onSuccess: (url: string) => void,
  onError?: (message: string) => void,
  onClose?: () => void,
): Promise<void> {
  if (!cloudinaryConfigured) {
    onError?.('Falta configurar Cloudinary (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET).');
    return;
  }
  try {
    await loadWidgetScript();
  } catch (e) {
    onError?.((e as Error).message);
    return;
  }
  if (!window.cloudinary) {
    onError?.('El widget de Cloudinary no esta disponible.');
    return;
  }
  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      sources: ['local', 'url', 'camera'], // archivo, URL (se re-aloja) o camara
      multiple: false,
      folder: 'productos',
      maxFileSize: 5_000_000, // 5 MB
      clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    },
    (error, result) => {
      if (error) {
        onError?.('Error al subir la imagen.');
        return;
      }
      if (result?.event === 'success' && result.info?.secure_url) {
        onSuccess(result.info.secure_url);
      }
      // El widget se cerro (con o sin subida): liberamos el estado "subiendo".
      if (result?.event === 'close') {
        onClose?.();
      }
    },
  );
  widget.open();
}
