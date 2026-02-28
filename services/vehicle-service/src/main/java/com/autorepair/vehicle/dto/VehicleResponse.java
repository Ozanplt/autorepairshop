package com.autorepair.vehicle.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class VehicleResponse {
    private UUID id;
    private UUID tenantId;
    private UUID customerId;
    private String rawPlate;
    private String normalizedPlate;
    private String make;
    private String model;
    private Integer year;
    private String vin;
    private String color;
    private Integer mileage;
    private String engineNo;
    private String notes;
    private String status;
    private Instant createdAt;
}
