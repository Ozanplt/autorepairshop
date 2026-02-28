package com.autorepair.vehicle.controller;

import com.autorepair.common.security.TenantContext;
import com.autorepair.vehicle.dto.CreateVehicleRequest;
import com.autorepair.vehicle.dto.VehicleResponse;
import com.autorepair.vehicle.entity.Vehicle;
import com.autorepair.vehicle.repository.VehicleRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/v1/vehicles")
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    public VehicleController(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @PostMapping
    public ResponseEntity<VehicleResponse> create(@Valid @RequestBody CreateVehicleRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID branchId = TenantContext.getBranchId();
        String userId = TenantContext.getUserId();

        Vehicle vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setTenantId(tenantId != null ? tenantId : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        vehicle.setBranchId(branchId);
        vehicle.setCustomerId(request.getCustomerId());
        vehicle.setRawPlate(request.getRawPlate().trim());
        vehicle.setNormalizedPlate(normalizePlate(request.getRawPlate()));
        vehicle.setMake(request.getMake().trim());
        vehicle.setModel(request.getModel() != null ? request.getModel().trim() : null);
        vehicle.setYear(request.getYear());
        vehicle.setVin(request.getVin());
        vehicle.setColor(request.getColor());
        vehicle.setMileage(request.getMileage());
        vehicle.setEngineNo(request.getEngineNo());
        vehicle.setNotes(request.getNotes());
        vehicle.setStatus("ACTIVE");
        vehicle.setCreatedAt(Instant.now());
        vehicle.setUpdatedAt(Instant.now());
        vehicle.setCreatedByUserId(userId != null ? UUID.fromString(userId) : null);

        vehicleRepository.save(vehicle);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(vehicle));
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
        return ResponseEntity.ok(page.map(this::toResponse));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return vehicleRepository.findById(id)
                .filter(v -> !v.isDeleted())
                .filter(v -> tenantId == null || v.getTenantId().equals(tenantId))
                .map(v -> {
                    v.setDeleted(true);
                    v.setDeletedAt(Instant.now());
                    v.setUpdatedAt(Instant.now());
                    vehicleRepository.save(v);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private VehicleResponse toResponse(Vehicle v) {
        return VehicleResponse.builder()
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
                .mileage(v.getMileage())
                .engineNo(v.getEngineNo())
                .notes(v.getNotes())
                .status(v.getStatus())
                .createdAt(v.getCreatedAt())
                .build();
    }

    private String normalizePlate(String raw) {
        if (raw == null) return null;
        String upper = raw.trim().toUpperCase(Locale.ROOT);
        String cleaned = upper.replaceAll("[^A-Z0-9]", "");
        return cleaned.length() >= 2 ? cleaned : raw.trim().toUpperCase(Locale.ROOT);
    }
}
