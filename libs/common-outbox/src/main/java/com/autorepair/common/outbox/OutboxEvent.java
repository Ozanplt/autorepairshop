package com.autorepair.common.outbox;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "outbox_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxEvent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private UUID tenantId;
    
    private UUID branchId;
    
    @Column(nullable = false, length = 100)
    private String eventType;
    
    @Column(nullable = false)
    private Integer eventVersion;
    
    @Column(nullable = false)
    private Instant occurredAt;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;
    
    @Column(nullable = false, length = 100)
    private String topic;
    
    private Instant publishedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OutboxStatus status;
    
    private String errorMessage;
    
    @Column(nullable = false)
    private Integer retryCount = 0;
    
    @Column(nullable = false)
    private Instant createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (occurredAt == null) {
            occurredAt = Instant.now();
        }
        if (status == null) {
            status = OutboxStatus.PENDING;
        }
    }
    
    public enum OutboxStatus {
        PENDING,
        PUBLISHED,
        FAILED
    }
}
