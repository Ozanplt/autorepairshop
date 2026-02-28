package com.autorepair.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateInventoryPartRequest {

    @NotBlank
    private String partCode;

    @NotBlank
    private String name;

    private String description;

    private String category;

    private String brand;

    @NotNull
    private BigDecimal unitPrice;

    private String currency;

    private int quantityOnHand;

    private int reorderLevel;

    private String unit;

    private String location;
}
