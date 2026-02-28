package com.autorepair.customer.service;

import com.autorepair.common.security.TenantContext;
import com.autorepair.common.security.exception.ResourceNotFoundException;
import com.autorepair.customer.dto.CreateCustomerRequest;
import com.autorepair.customer.dto.CustomerResponse;
import com.autorepair.customer.entity.Customer;
import com.autorepair.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerResponse create(CreateCustomerRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID branchId = TenantContext.getBranchId();
        String userId = TenantContext.getUserId();

        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setTenantId(tenantId);
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
        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public Page<CustomerResponse> list(String query, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Customer> page;
        if (query != null && !query.isBlank()) {
            page = customerRepository.findByTenantIdAndFullNameContainingIgnoreCaseAndActiveTrue(tenantId, query, pageable);
        } else {
            page = customerRepository.findByTenantIdAndActiveTrue(tenantId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Customer customer = customerRepository.findById(id)
                .filter(c -> c.isActive())
                .filter(c -> tenantId.equals(c.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        return toResponse(customer);
    }

    @Transactional
    public void delete(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Customer customer = customerRepository.findById(id)
                .filter(c -> c.isActive())
                .filter(c -> tenantId.equals(c.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        customer.setActive(false);
        customer.setUpdatedAt(Instant.now());
        customerRepository.save(customer);
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
