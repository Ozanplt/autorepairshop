package com.autorepair.workorder.service;

import com.autorepair.common.security.TenantContext;
import com.autorepair.workorder.dto.FastIntakeRequest;
import com.autorepair.workorder.dto.WorkOrderResponse;
import com.autorepair.workorder.entity.WorkOrder;
import com.autorepair.workorder.repository.WorkOrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository) {
        this.workOrderRepository = workOrderRepository;
    }

    @Transactional
    public WorkOrderResponse createFastIntake(FastIntakeRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID branchId = TenantContext.getBranchId();

        UUID customerId = null;
        if (request.getCustomer() != null && request.getCustomer().getCustomerId() != null) {
            customerId = UUID.fromString(request.getCustomer().getCustomerId());
        }

        UUID vehicleId = null;
        if (request.getVehicle() != null && request.getVehicle().getVehicleId() != null) {
            vehicleId = UUID.fromString(request.getVehicle().getVehicleId());
        }

        WorkOrder wo = new WorkOrder();
        wo.setId(UUID.randomUUID());
        wo.setTenantId(tenantId != null ? tenantId : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        wo.setBranchId(branchId);
        wo.setCustomerId(customerId != null ? customerId : UUID.randomUUID());
        wo.setVehicleId(vehicleId != null ? vehicleId : UUID.randomUUID());
        wo.setStatus("INTAKE");
        wo.setProblemShortNote(request.getWorkOrder() != null ? request.getWorkOrder().getProblemShortNote() : null);
        wo.setProblemDetails(request.getWorkOrder() != null ? request.getWorkOrder().getProblemDetails() : null);
        wo.setCreatedAt(Instant.now());
        wo.setUpdatedAt(Instant.now());

        workOrderRepository.save(wo);

        return WorkOrderResponse.builder()
                .id(wo.getId())
                .tenantId(wo.getTenantId())
                .customerId(wo.getCustomerId())
                .vehicleId(wo.getVehicleId())
                .status(wo.getStatus())
                .problemShortNote(wo.getProblemShortNote())
                .customerName(request.getCustomer() != null ? request.getCustomer().getFullName() : null)
                .vehiclePlate(request.getVehicle() != null ? request.getVehicle().getRawPlate() : null)
                .createdAt(wo.getCreatedAt())
                .updatedAt(wo.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<WorkOrderResponse> listWorkOrders(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<WorkOrder> page;
        if (tenantId != null) {
            page = workOrderRepository.findByTenantIdAndIsDeletedFalse(tenantId, pageable);
        } else {
            page = workOrderRepository.findByIsDeletedFalse(pageable);
        }
        return page.map(wo -> WorkOrderResponse.builder()
                .id(wo.getId())
                .tenantId(wo.getTenantId())
                .customerId(wo.getCustomerId())
                .vehicleId(wo.getVehicleId())
                .status(wo.getStatus())
                .subStatus(wo.getSubStatus())
                .problemShortNote(wo.getProblemShortNote())
                .createdAt(wo.getCreatedAt())
                .updatedAt(wo.getUpdatedAt())
                .build());
    }

    @Transactional(readOnly = true)
    public WorkOrderResponse getWorkOrder(UUID id) {
        WorkOrder wo = workOrderRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Work order not found"));
        return WorkOrderResponse.builder()
                .id(wo.getId())
                .tenantId(wo.getTenantId())
                .customerId(wo.getCustomerId())
                .vehicleId(wo.getVehicleId())
                .status(wo.getStatus())
                .subStatus(wo.getSubStatus())
                .problemShortNote(wo.getProblemShortNote())
                .createdAt(wo.getCreatedAt())
                .updatedAt(wo.getUpdatedAt())
                .build();
    }
}
