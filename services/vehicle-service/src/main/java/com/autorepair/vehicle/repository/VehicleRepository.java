package com.autorepair.vehicle.repository;

import com.autorepair.vehicle.entity.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    Page<Vehicle> findByTenantIdAndIsDeletedFalse(UUID tenantId, Pageable pageable);

    Page<Vehicle> findByIsDeletedFalse(Pageable pageable);

    Page<Vehicle> findByTenantIdAndRawPlateContainingIgnoreCaseAndIsDeletedFalse(UUID tenantId, String plate, Pageable pageable);

    Page<Vehicle> findByRawPlateContainingIgnoreCaseAndIsDeletedFalse(String plate, Pageable pageable);
}
