package com.autorepair.workorder.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class WorkOrderResponse {
    private UUID id;
    private UUID tenantId;
    private UUID customerId;
    private UUID vehicleId;
    private String status;
    private String subStatus;
    private String problemShortNote;
    private String customerName;
    private String vehiclePlate;
    private Instant createdAt;
    private Instant updatedAt;
}
