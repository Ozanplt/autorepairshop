package com.autorepair.common.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventEnvelope<T> {
    
    private UUID eventId;
    private String eventType;
    private Integer eventVersion;
    private Instant occurredAt;
    private String producer;
    private String traceId;
    private String requestId;
    private UUID tenantId;
    private UUID branchId;
    private UUID aggregateId;
    private T payload;
}
