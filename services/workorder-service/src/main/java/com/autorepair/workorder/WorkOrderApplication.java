package com.autorepair.workorder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {
    "com.autorepair.workorder",
    "com.autorepair.common.security",
    "com.autorepair.common.error",
    "com.autorepair.common.idempotency",
    "com.autorepair.common.outbox",
    "com.autorepair.common.events"
})
@EnableJpaRepositories(basePackages = {
    "com.autorepair.workorder",
    "com.autorepair.common.idempotency",
    "com.autorepair.common.outbox"
})
@EntityScan(basePackages = {
    "com.autorepair.workorder",
    "com.autorepair.common.idempotency",
    "com.autorepair.common.outbox"
})
@EnableScheduling
public class WorkOrderApplication {
    public static void main(String[] args) {
        SpringApplication.run(WorkOrderApplication.class, args);
    }
}
