package com.autorepair.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateAppointmentRequest {

    @NotNull
    private UUID customerId;

    private UUID vehicleId;

    private UUID workOrderId;

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private LocalDate appointmentDate;

    @NotNull
    private LocalTime startTime;

    private LocalTime endTime;

    private UUID assignedToUserId;

    private String notes;
}
