package com.autorepair.inventory.service;

import com.autorepair.common.security.TenantContext;
import com.autorepair.common.security.exception.ResourceNotFoundException;
import com.autorepair.inventory.dto.CreateInventoryPartRequest;
import com.autorepair.inventory.dto.InventoryPartResponse;
import com.autorepair.inventory.entity.InventoryPart;
import com.autorepair.inventory.repository.InventoryPartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryPartRepository repository;

    @Transactional
    public InventoryPartResponse create(CreateInventoryPartRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID branchId = TenantContext.getBranchId();

        InventoryPart part = new InventoryPart();
        part.setId(UUID.randomUUID());
        part.setTenantId(tenantId);
        part.setBranchId(branchId);
        part.setPartCode(request.getPartCode().trim());
        part.setName(request.getName().trim());
        part.setDescription(request.getDescription());
        part.setCategory(request.getCategory());
        part.setBrand(request.getBrand());
        part.setUnitPrice(request.getUnitPrice());
        part.setCurrency(request.getCurrency() != null ? request.getCurrency() : "TRY");
        part.setQuantityOnHand(request.getQuantityOnHand());
        part.setReorderLevel(request.getReorderLevel());
        part.setUnit(request.getUnit());
        part.setLocation(request.getLocation());
        part.setCreatedAt(Instant.now());
        part.setUpdatedAt(Instant.now());

        repository.save(part);
        return toResponse(part);
    }

    @Transactional(readOnly = true)
    public Page<InventoryPartResponse> list(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<InventoryPart> page;
        page = repository.findByTenantIdAndActiveTrue(tenantId, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public InventoryPartResponse getById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        InventoryPart part = repository.findByIdAndActiveTrue(id)
                .filter(p -> tenantId.equals(p.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("InventoryPart", id));
        return toResponse(part);
    }

    @Transactional
    public InventoryPartResponse adjustStock(UUID id, int adjustment) {
        UUID tenantId = TenantContext.getTenantId();
        InventoryPart part = repository.findByIdAndActiveTrue(id)
                .filter(p -> tenantId.equals(p.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("InventoryPart", id));
        int newQty = part.getQuantityOnHand() + adjustment;
        if (newQty < 0) {
            throw new IllegalStateException("Insufficient stock for part: " + part.getPartCode());
        }
        part.setQuantityOnHand(newQty);
        part.setUpdatedAt(Instant.now());
        repository.save(part);
        return toResponse(part);
    }

    private InventoryPartResponse toResponse(InventoryPart p) {
        return InventoryPartResponse.builder()
                .id(p.getId())
                .tenantId(p.getTenantId())
                .partCode(p.getPartCode())
                .name(p.getName())
                .description(p.getDescription())
                .category(p.getCategory())
                .brand(p.getBrand())
                .unitPrice(p.getUnitPrice())
                .currency(p.getCurrency())
                .quantityOnHand(p.getQuantityOnHand())
                .reorderLevel(p.getReorderLevel())
                .unit(p.getUnit())
                .location(p.getLocation())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
