package com.autorepair.vehicle.repository;

import com.autorepair.vehicle.entity.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    Page<Vehicle> findByTenantIdAndActiveTrue(UUID tenantId, Pageable pageable);

    Page<Vehicle> findByActiveTrue(Pageable pageable);

    Page<Vehicle> findByTenantIdAndRawPlateContainingIgnoreCaseAndActiveTrue(UUID tenantId, String plate, Pageable pageable);

    Page<Vehicle> findByRawPlateContainingIgnoreCaseAndActiveTrue(String plate, Pageable pageable);
}
