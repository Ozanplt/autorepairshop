package com.autorepair.customer.controller;

import com.autorepair.common.security.TenantContext;
import com.autorepair.customer.dto.CustomerResponse;
import com.autorepair.customer.entity.Customer;
import com.autorepair.customer.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public ResponseEntity<Page<CustomerResponse>> list(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Customer> page;
        if (q != null && !q.isBlank()) {
            page = tenantId != null
                    ? customerRepository.findByTenantIdAndFullNameContainingIgnoreCaseAndIsDeletedFalse(tenantId, q, pageable)
                    : customerRepository.findByFullNameContainingIgnoreCaseAndIsDeletedFalse(q, pageable);
        } else {
            page = tenantId != null
                    ? customerRepository.findByTenantIdAndIsDeletedFalse(tenantId, pageable)
                    : customerRepository.findByIsDeletedFalse(pageable);
        }
        return ResponseEntity.ok(page.map(c -> CustomerResponse.builder()
                .id(c.getId())
                .tenantId(c.getTenantId())
                .fullName(c.getFullName())
                .phoneE164(c.getPhoneE164())
                .emailNormalized(c.getEmailNormalized())
                .type(c.getType())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build()));
    }
}
