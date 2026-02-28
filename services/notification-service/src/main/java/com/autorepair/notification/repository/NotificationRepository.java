package com.autorepair.notification.repository;

import com.autorepair.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByTenantId(UUID tenantId, Pageable pageable);

    Page<Notification> findByTenantIdAndUserId(UUID tenantId, UUID userId, Pageable pageable);

    Page<Notification> findByTenantIdAndStatus(UUID tenantId, String status, Pageable pageable);
}
