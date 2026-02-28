package com.autorepair.inventory.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class InventoryPartResponse {
    private UUID id;
    private UUID tenantId;
    private String partCode;
    private String name;
    private String description;
    private String category;
    private String brand;
    private BigDecimal unitPrice;
    private String currency;
    private int quantityOnHand;
    private int reorderLevel;
    private String unit;
    private String location;
    private Instant createdAt;
    private Instant updatedAt;
}
