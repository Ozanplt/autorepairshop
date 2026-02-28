package com.autorepair.vehicle.controller;

import com.autorepair.common.security.TenantContext;
import com.autorepair.vehicle.dto.VehicleResponse;
import com.autorepair.vehicle.entity.Vehicle;
import com.autorepair.vehicle.repository.VehicleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/vehicles")
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    public VehicleController(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @GetMapping
    public ResponseEntity<Page<VehicleResponse>> list(
            @RequestParam(required = false) String plate,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Vehicle> page;
        if (plate != null && !plate.isBlank()) {
            page = tenantId != null
                    ? vehicleRepository.findByTenantIdAndRawPlateContainingIgnoreCaseAndIsDeletedFalse(tenantId, plate, pageable)
                    : vehicleRepository.findByRawPlateContainingIgnoreCaseAndIsDeletedFalse(plate, pageable);
        } else {
            page = tenantId != null
                    ? vehicleRepository.findByTenantIdAndIsDeletedFalse(tenantId, pageable)
                    : vehicleRepository.findByIsDeletedFalse(pageable);
        }
        return ResponseEntity.ok(page.map(v -> VehicleResponse.builder()
                .id(v.getId())
                .tenantId(v.getTenantId())
                .customerId(v.getCustomerId())
                .rawPlate(v.getRawPlate())
                .normalizedPlate(v.getNormalizedPlate())
                .make(v.getMake())
                .model(v.getModel())
                .year(v.getYear())
                .vin(v.getVin())
                .color(v.getColor())
                .status(v.getStatus())
                .createdAt(v.getCreatedAt())
                .build()));
    }
}
