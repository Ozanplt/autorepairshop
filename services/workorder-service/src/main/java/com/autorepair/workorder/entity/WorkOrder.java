package com.autorepair.workorder.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "work_orders")
@Getter
@Setter
@NoArgsConstructor
public class WorkOrder {

    @Id
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "sub_status", length = 100)
    private String subStatus;

    @Column(name = "problem_short_note", length = 240)
    private String problemShortNote;

    @Column(name = "problem_details", columnDefinition = "TEXT")
    private String problemDetails;

    @Column(name = "assigned_to_user_id")
    private UUID assignedToUserId;

    @Column(name = "intake_mileage")
    private Integer intakeMileage;

    @Column(name = "diagnostics_notes", columnDefinition = "TEXT")
    private String diagnosticsNotes;

    @Column(length = 3)
    private String currency;

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    @Column(name = "updated_by_user_id")
    private UUID updatedByUserId;

    @Column(name = "is_actv", nullable = false)
    private boolean active = true;

    @Version
    private Long version = 0L;
}
