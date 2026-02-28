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

    Page<InventoryPart> findByTenantIdAndIsDeletedFalse(UUID tenantId, Pageable pageable);

    Page<InventoryPart> findByIsDeletedFalse(Pageable pageable);

    Optional<InventoryPart> findByIdAndIsDeletedFalse(UUID id);

    Page<InventoryPart> findByTenantIdAndNameContainingIgnoreCaseAndIsDeletedFalse(UUID tenantId, String name, Pageable pageable);
}
