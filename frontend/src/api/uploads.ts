import { api } from './client';

export interface UploadResponse {
  url: string;
  key: string;
  contentType: string;
  size: number;
}

export const uploadsApi = {
  subirImagen: (file: File, folder = 'productos') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    return api
      .post<UploadResponse>('/api/uploads/imagenes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
