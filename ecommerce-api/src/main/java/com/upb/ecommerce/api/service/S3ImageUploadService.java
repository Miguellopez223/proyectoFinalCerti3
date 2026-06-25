package com.upb.ecommerce.api.service;

import com.upb.ecommerce.api.dto.UploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetUrlRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class S3ImageUploadService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/gif", "gif"
    );

    private final S3Client s3Client;
    private final String bucket;
    private final String publicBaseUrl;
    private final long maxFileSizeBytes;

    public S3ImageUploadService(S3Client s3Client,
                                @Value("${app.uploads.s3.bucket:}") String bucket,
                                @Value("${app.uploads.s3.public-base-url:}") String publicBaseUrl,
                                @Value("${app.uploads.max-file-size-bytes:5242880}") long maxFileSizeBytes) {
        this.s3Client = s3Client;
        this.bucket = bucket;
        this.publicBaseUrl = trimTrailingSlash(publicBaseUrl);
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public UploadResponse uploadImage(MultipartFile file, String folder) {
        validateFile(file);
        if (!StringUtils.hasText(bucket)) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "No esta configurado el bucket S3 para subir imagenes.");
        }

        String contentType = normalizeContentType(file.getContentType());
        String key = buildKey(folder, contentType);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(file.getSize())
                .build();

        try {
            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el archivo enviado.", ex);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo subir la imagen a S3.", ex);
        }

        return new UploadResponse(publicUrl(key), key, contentType, file.getSize());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes seleccionar una imagen.");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La imagen supera el tamanio maximo permitido.");
        }
        String contentType = normalizeContentType(file.getContentType());
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se permiten imagenes JPG, PNG, WEBP o GIF.");
        }
    }

    private String buildKey(String folder, String contentType) {
        LocalDate today = LocalDate.now();
        String safeFolder = sanitizeFolder(folder);
        String extension = EXTENSIONS.get(contentType);
        return "%s/%d/%02d/%s.%s".formatted(
                safeFolder,
                today.getYear(),
                today.getMonthValue(),
                UUID.randomUUID(),
                extension
        );
    }

    private String publicUrl(String key) {
        if (StringUtils.hasText(publicBaseUrl)) {
            return publicBaseUrl + "/" + key;
        }
        return s3Client.utilities()
                .getUrl(GetUrlRequest.builder().bucket(bucket).key(key).build())
                .toExternalForm();
    }

    private String sanitizeFolder(String folder) {
        if (!StringUtils.hasText(folder)) {
            return "productos";
        }
        String sanitized = folder.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9/_-]", "-");
        sanitized = sanitized.replaceAll("/{2,}", "/").replaceAll("^/|/$", "");
        return StringUtils.hasText(sanitized) ? sanitized : "productos";
    }

    private String normalizeContentType(String contentType) {
        return contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("/+$", "");
    }
}
