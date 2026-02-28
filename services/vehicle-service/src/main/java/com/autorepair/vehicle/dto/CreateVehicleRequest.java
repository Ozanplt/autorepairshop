package com.autorepair.vehicle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateVehicleRequest {

    private UUID customerId;

    @NotBlank
    @Size(min = 2, max = 64)
    private String rawPlate;

    @NotBlank
    @Size(min = 1, max = 60)
    private String make;

    @Size(max = 60)
    private String model;

    private Integer year;

    private String vin;

    private String color;

    private Integer mileage;

    private String engineNo;

    private String notes;
}
