package com.upb.ecommerce.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Configuration
public class AwsS3Config {

    private final String region;
    private final String accessKey;
    private final String secretKey;

    public AwsS3Config(@Value("${app.uploads.s3.region:us-east-1}") String region,
                       @Value("${app.uploads.s3.access-key:}") String accessKey,
                       @Value("${app.uploads.s3.secret-key:}") String secretKey) {
        this.region = region;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
    }

    @Bean
    public S3Client s3Client() {
        // La región siempre se fija explícitamente (por defecto us-east-1) para que la app
        // arranque aunque no exista la variable de entorno AWS_REGION ni un perfil de AWS.
        S3ClientBuilder builder = S3Client.builder().region(Region.of(region));

        // Si se entregan credenciales por propiedades, se usan directamente; de lo contrario
        // se delega en la cadena por defecto del SDK (variables de entorno, perfil, rol EC2, etc.).
        if (StringUtils.hasText(accessKey) && StringUtils.hasText(secretKey)) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey)));
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }

        return builder.build();
    }
}
