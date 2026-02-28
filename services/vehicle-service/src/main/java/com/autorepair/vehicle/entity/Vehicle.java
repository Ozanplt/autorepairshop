package com.autorepair.vehicle.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
public class Vehicle {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "raw_plate", nullable = false, length = 20)
    private String rawPlate;

    @Column(name = "normalized_plate", nullable = false, length = 20)
    private String normalizedPlate;

    @Column(length = 100)
    private String make;

    @Column(length = 100)
    private String model;

    private Integer year;

    @Column(length = 17)
    private String vin;

    @Column(length = 50)
    private String color;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    @Column(name = "updated_by_user_id")
    private UUID updatedByUserId;

    @Column(name = "is_deleted", nullable = false)
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Version
    private Long version = 0L;
}
