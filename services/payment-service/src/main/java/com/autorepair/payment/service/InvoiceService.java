package com.autorepair.payment.service;

import com.autorepair.common.security.TenantContext;
import com.autorepair.common.security.exception.ResourceNotFoundException;
import com.autorepair.payment.dto.InvoiceResponse;
import com.autorepair.payment.entity.Invoice;
import com.autorepair.payment.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> list(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Invoice> page = invoiceRepository.findByTenantIdAndActiveTrue(tenantId, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Invoice inv = invoiceRepository.findByIdAndActiveTrue(id)
                .filter(i -> tenantId.equals(i.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        return toResponse(inv);
    }

    private InvoiceResponse toResponse(Invoice inv) {
        return InvoiceResponse.builder()
                .id(inv.getId())
                .tenantId(inv.getTenantId())
                .workOrderId(inv.getWorkOrderId())
                .customerId(inv.getCustomerId())
                .invoiceNumber(inv.getInvoiceNumber())
                .currency(inv.getCurrency())
                .subtotal(inv.getSubtotal())
                .taxTotal(inv.getTaxTotal())
                .discountTotal(inv.getDiscountTotal())
                .grandTotal(inv.getGrandTotal())
                .status(inv.getStatus())
                .issuedAt(inv.getIssuedAt())
                .dueAt(inv.getDueAt())
                .paidAt(inv.getPaidAt())
                .createdAt(inv.getCreatedAt())
                .build();
    }
}
