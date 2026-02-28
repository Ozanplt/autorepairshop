package com.autorepair.customer.controller;

import com.autorepair.common.security.TenantContext;
import com.autorepair.customer.dto.CreateCustomerRequest;
import com.autorepair.customer.dto.CustomerResponse;
import com.autorepair.customer.entity.Customer;
import com.autorepair.customer.repository.CustomerRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/v1/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CreateCustomerRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID branchId = TenantContext.getBranchId();
        String userId = TenantContext.getUserId();

        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setTenantId(tenantId != null ? tenantId : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        customer.setBranchId(branchId);
        customer.setFullName(request.getFullName().trim());
        customer.setPhoneE164(request.getPhoneE164());
        customer.setEmailNormalized(request.getEmailNormalized() != null ? request.getEmailNormalized().toLowerCase().trim() : null);
        customer.setAddress(request.getAddress());
        customer.setType(request.getType() != null ? request.getType() : "GUEST");
        customer.setStatus("ACTIVE");
        customer.setPhoneVerified(false);
        customer.setEmailVerified(false);
        customer.setCreatedAt(Instant.now());
        customer.setUpdatedAt(Instant.now());
        customer.setCreatedByUserId(userId != null ? UUID.fromString(userId) : null);

        customerRepository.save(customer);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(customer));
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
        return ResponseEntity.ok(page.map(this::toResponse));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getById(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return customerRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .filter(c -> tenantId == null || c.getTenantId().equals(tenantId))
                .map(c -> ResponseEntity.ok(toResponse(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return customerRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .filter(c -> tenantId == null || c.getTenantId().equals(tenantId))
                .map(c -> {
                    c.setDeleted(true);
                    c.setDeletedAt(Instant.now());
                    c.setUpdatedAt(Instant.now());
                    customerRepository.save(c);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder()
                .id(c.getId())
                .tenantId(c.getTenantId())
                .fullName(c.getFullName())
                .phoneE164(c.getPhoneE164())
                .emailNormalized(c.getEmailNormalized())
                .type(c.getType())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
