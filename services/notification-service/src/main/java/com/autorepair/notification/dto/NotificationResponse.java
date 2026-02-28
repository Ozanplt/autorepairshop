package com.autorepair.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private UUID tenantId;
    private UUID userId;
    private UUID customerId;
    private String channel;
    private String subject;
    private String body;
    private String status;
    private String referenceType;
    private UUID referenceId;
    private Instant sentAt;
    private Instant createdAt;
    private Instant updatedAt;
}
