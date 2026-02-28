package com.autorepair.audit.repository;

import com.autorepair.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByTenantId(UUID tenantId, Pageable pageable);

    Page<AuditLog> findByTenantIdAndEntityType(UUID tenantId, String entityType, Pageable pageable);

    Page<AuditLog> findByTenantIdAndEntityId(UUID tenantId, UUID entityId, Pageable pageable);
}
