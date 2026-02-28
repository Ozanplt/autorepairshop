package com.autorepair.payment.repository;

import com.autorepair.payment.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Page<Invoice> findByTenantIdAndIsDeletedFalse(UUID tenantId, Pageable pageable);

    Page<Invoice> findByIsDeletedFalse(Pageable pageable);

    Page<Invoice> findByTenantIdAndWorkOrderIdAndIsDeletedFalse(UUID tenantId, UUID workOrderId, Pageable pageable);

    Optional<Invoice> findByIdAndIsDeletedFalse(UUID id);
}
