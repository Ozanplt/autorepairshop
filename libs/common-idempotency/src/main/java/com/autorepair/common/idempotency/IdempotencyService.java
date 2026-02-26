package com.autorepair.common.idempotency;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IdempotencyService {
    
    private final IdempotencyRepository repository;
    
    @Transactional
    public Optional<StoredResponse> check(UUID tenantId, String endpointKey, String idempotencyKey, String requestBody) {
        String requestHash = computeHash(requestBody);
        
        Optional<IdempotencyRecord> existing = repository.findByTenantIdAndEndpointKeyAndIdempotencyKey(
            tenantId, endpointKey, idempotencyKey
        );
        
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            
            if (!record.getRequestHash().equals(requestHash)) {
                throw new IdempotencyHashMismatchException(
                    "Idempotency key reused with different payload"
                );
            }
            
            return Optional.of(new StoredResponse(
                record.getResponseStatus(),
                record.getResponseBody()
            ));
        }
        
        return Optional.empty();
    }
    
    @Transactional
    public void store(UUID tenantId, String endpointKey, String idempotencyKey, 
                     String requestBody, int responseStatus, String responseBody, Duration ttl) {
        String requestHash = computeHash(requestBody);
        
        IdempotencyRecord record = IdempotencyRecord.builder()
            .tenantId(tenantId)
            .endpointKey(endpointKey)
            .idempotencyKey(idempotencyKey)
            .requestHash(requestHash)
            .responseStatus(responseStatus)
            .responseBody(responseBody)
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plus(ttl))
            .build();
        
        repository.save(record);
    }
    
    @Transactional
    public void cleanup() {
        repository.deleteByExpiresAtBefore(Instant.now());
    }
    
    private String computeHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
    
    public record StoredResponse(int status, String body) {}
}
