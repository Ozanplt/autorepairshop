package com.autorepair.inventory.repository;

import com.autorepair.inventory.entity.InventoryPart;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryPartRepository extends JpaRepository<InventoryPart, UUID> {

    Page<InventoryPart> findByTenantIdAndActiveTrue(UUID tenantId, Pageable pageable);

    Page<InventoryPart> findByActiveTrue(Pageable pageable);

    Optional<InventoryPart> findByIdAndActiveTrue(UUID id);

    Page<InventoryPart> findByTenantIdAndNameContainingIgnoreCaseAndActiveTrue(UUID tenantId, String name, Pageable pageable);
}
