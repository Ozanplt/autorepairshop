package com.autorepair.customer.repository;

import com.autorepair.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Page<Customer> findByTenantIdAndActiveTrue(UUID tenantId, Pageable pageable);

    Page<Customer> findByActiveTrue(Pageable pageable);

    Page<Customer> findByTenantIdAndFullNameContainingIgnoreCaseAndActiveTrue(UUID tenantId, String query, Pageable pageable);

    Page<Customer> findByFullNameContainingIgnoreCaseAndActiveTrue(String query, Pageable pageable);
}
