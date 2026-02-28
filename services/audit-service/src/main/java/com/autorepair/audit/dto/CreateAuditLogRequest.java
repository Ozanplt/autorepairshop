package com.autorepair.audit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateAuditLogRequest {

    private UUID userId;

    private String userEmail;

    @NotBlank
    private String action;

    @NotBlank
    private String entityType;

    private UUID entityId;

    private String oldValue;

    private String newValue;

    private String ipAddress;
}
