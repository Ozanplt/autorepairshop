package com.autorepair.common.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {
    
    private final OutboxRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    
    @Scheduled(fixedDelay = 1000)
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pending = repository.findTop100ByStatusOrderByCreatedAtAsc(
            OutboxEvent.OutboxStatus.PENDING
        );
        
        for (OutboxEvent event : pending) {
            try {
                kafkaTemplate.send(event.getTopic(), event.getPayload()).get();
                
                event.setStatus(OutboxEvent.OutboxStatus.PUBLISHED);
                event.setPublishedAt(Instant.now());
                repository.save(event);
                
                log.info("Published event: eventType={}, eventId={}", 
                    event.getEventType(), event.getId());
                
            } catch (Exception e) {
                log.error("Failed to publish event: eventId={}", event.getId(), e);
                
                event.setRetryCount(event.getRetryCount() + 1);
                event.setErrorMessage(e.getMessage());
                
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxEvent.OutboxStatus.FAILED);
                    log.error("Event failed after {} retries: eventId={}", 
                        event.getRetryCount(), event.getId());
                }
                
                repository.save(event);
            }
        }
    }
}
