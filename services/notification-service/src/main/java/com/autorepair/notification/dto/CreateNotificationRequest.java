package com.autorepair.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateNotificationRequest {

    private UUID userId;

    private UUID customerId;

    @NotBlank
    private String channel;

    @NotBlank
    private String subject;

    private String body;

    private String referenceType;

    private UUID referenceId;
}
