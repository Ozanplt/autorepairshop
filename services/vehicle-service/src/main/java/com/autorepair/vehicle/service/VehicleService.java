package com.autorepair.vehicle.service;

import com.autorepair.common.security.TenantContext;
import com.autorepair.common.security.exception.ResourceNotFoundException;
import com.autorepair.vehicle.dto.CreateVehicleRequest;
import com.autorepair.vehicle.dto.VehicleResponse;
import com.autorepair.vehicle.entity.Vehicle;
import com.autorepair.vehicle.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    @Transactional
    public VehicleResponse create(CreateVehicleRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID branchId = TenantContext.getBranchId();
        String userId = TenantContext.getUserId();

        Vehicle vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setTenantId(tenantId);
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
        return toResponse(vehicle);
    }

    @Transactional(readOnly = true)
    public Page<VehicleResponse> list(String plate, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Vehicle> page;
        if (plate != null && !plate.isBlank()) {
            page = vehicleRepository.findByTenantIdAndRawPlateContainingIgnoreCaseAndActiveTrue(tenantId, plate, pageable);
        } else {
            page = vehicleRepository.findByTenantIdAndActiveTrue(tenantId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Vehicle vehicle = vehicleRepository.findById(id)
                .filter(v -> v.isActive())
                .filter(v -> tenantId.equals(v.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        vehicle.setActive(false);
        vehicle.setUpdatedAt(Instant.now());
        vehicleRepository.save(vehicle);
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
