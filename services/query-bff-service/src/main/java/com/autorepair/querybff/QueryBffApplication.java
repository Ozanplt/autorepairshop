package com.autorepair.querybff;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {
    "com.autorepair.querybff",
    "com.autorepair.common.security",
    "com.autorepair.common.error",
    "com.autorepair.common.pii"
})
public class QueryBffApplication {
    public static void main(String[] args) {
        SpringApplication.run(QueryBffApplication.class, args);
    }
}
