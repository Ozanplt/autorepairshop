package com.autorepair.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {
    "com.autorepair.payment",
    "com.autorepair.common.security",
    "com.autorepair.common.error",
    "com.autorepair.common.idempotency",
    "com.autorepair.common.outbox"
})
@EnableJpaRepositories
@EnableScheduling
public class PaymentApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaymentApplication.class, args);
    }
}
