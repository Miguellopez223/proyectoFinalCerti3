package com.upb.ecommerce.api.controller;

import com.upb.ecommerce.api.dto.UploadResponse;
import com.upb.ecommerce.api.service.S3ImageUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Uploads", description = "Subida de imagenes a S3")
@SecurityRequirement(name = "bearerToken")
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final S3ImageUploadService imageUploadService;

    public UploadController(S3ImageUploadService imageUploadService) {
        this.imageUploadService = imageUploadService;
    }

    @Operation(summary = "Subir una imagen", description = "Guarda la imagen en S3 y devuelve la URL publica.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/imagenes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadResponse> uploadImage(@RequestParam("file") MultipartFile file,
                                                      @RequestParam(value = "folder", defaultValue = "productos")
                                                      String folder) {
        return ResponseEntity.ok(imageUploadService.uploadImage(file, folder));
    }
}
