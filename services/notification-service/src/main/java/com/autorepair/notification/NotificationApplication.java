package com.autorepair.notification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {
    "com.autorepair.notification",
    "com.autorepair.common.security",
    "com.autorepair.common.error",
    "com.autorepair.common.pii"
})
@EnableJpaRepositories
public class NotificationApplication {
    public static void main(String[] args) {
        SpringApplication.run(NotificationApplication.class, args);
    }
}
