package com.autorepair.tenantadmin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {
    "com.autorepair.tenantadmin",
    "com.autorepair.common.security",
    "com.autorepair.common.error",
    "com.autorepair.common.idempotency",
    "com.autorepair.common.outbox"
})
@EnableJpaRepositories(basePackages = {
    "com.autorepair.tenantadmin",
    "com.autorepair.common.idempotency",
    "com.autorepair.common.outbox"
})
@EntityScan(basePackages = {
    "com.autorepair.tenantadmin",
    "com.autorepair.common.idempotency",
    "com.autorepair.common.outbox"
})
@EnableScheduling
public class TenantAdminApplication {
    public static void main(String[] args) {
        SpringApplication.run(TenantAdminApplication.class, args);
    }
}
