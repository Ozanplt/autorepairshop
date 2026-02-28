package com.autorepair.appointment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
public class AppointmentResponse {
    private UUID id;
    private UUID tenantId;
    private UUID customerId;
    private UUID vehicleId;
    private UUID workOrderId;
    private String title;
    private String description;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private UUID assignedToUserId;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
