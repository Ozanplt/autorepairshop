package com.autorepair.common.events;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, UUID> {
    
    Optional<ProcessedEvent> findByTenantIdAndEventIdAndConsumerGroup(
        UUID tenantId, UUID eventId, String consumerGroup
    );
    
    boolean existsByTenantIdAndEventIdAndConsumerGroup(
        UUID tenantId, UUID eventId, String consumerGroup
    );
    
    void deleteByExpiresAtBefore(Instant expiresAt);
}
