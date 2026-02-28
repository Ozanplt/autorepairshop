package com.autorepair.customer.repository;

import com.autorepair.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Page<Customer> findByTenantIdAndIsDeletedFalse(UUID tenantId, Pageable pageable);

    Page<Customer> findByIsDeletedFalse(Pageable pageable);

    Page<Customer> findByTenantIdAndFullNameContainingIgnoreCaseAndIsDeletedFalse(UUID tenantId, String query, Pageable pageable);

    Page<Customer> findByFullNameContainingIgnoreCaseAndIsDeletedFalse(String query, Pageable pageable);
}
