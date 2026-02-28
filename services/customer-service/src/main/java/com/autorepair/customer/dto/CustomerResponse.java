package com.autorepair.customer.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CustomerResponse {
    private UUID id;
    private UUID tenantId;
    private String fullName;
    private String phoneE164;
    private String emailNormalized;
    private String type;
    private String status;
    private Instant createdAt;
}
