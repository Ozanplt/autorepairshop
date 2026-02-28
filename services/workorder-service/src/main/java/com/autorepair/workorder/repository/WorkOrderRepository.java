package com.autorepair.workorder.repository;

import com.autorepair.workorder.entity.WorkOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID> {

    Page<WorkOrder> findByTenantIdAndIsDeletedFalse(UUID tenantId, Pageable pageable);

    Page<WorkOrder> findByIsDeletedFalse(Pageable pageable);

    Optional<WorkOrder> findByIdAndIsDeletedFalse(UUID id);
}
