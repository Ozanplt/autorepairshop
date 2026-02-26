package com.autorepair.vehicle;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {
    "com.autorepair.vehicle",
    "com.autorepair.common.security",
    "com.autorepair.common.error",
    "com.autorepair.common.idempotency",
    "com.autorepair.common.outbox",
    "com.autorepair.common.events"
})
@EnableJpaRepositories
@EnableScheduling
public class VehicleApplication {
    public static void main(String[] args) {
        SpringApplication.run(VehicleApplication.class, args);
    }
}
