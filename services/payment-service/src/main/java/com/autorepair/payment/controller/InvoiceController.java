package com.autorepair.payment.controller;

import com.autorepair.common.security.TenantContext;
import com.autorepair.payment.dto.InvoiceResponse;
import com.autorepair.payment.entity.Invoice;
import com.autorepair.payment.repository.InvoiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;

    public InvoiceController(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping
    public ResponseEntity<Page<InvoiceResponse>> list(@PageableDefault(size = 20) Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Invoice> page = tenantId != null
                ? invoiceRepository.findByTenantIdAndIsDeletedFalse(tenantId, pageable)
                : invoiceRepository.findByIsDeletedFalse(pageable);
        return ResponseEntity.ok(page.map(this::toResponse));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoice(@PathVariable UUID id) {
        Invoice inv = invoiceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return ResponseEntity.ok(toResponse(inv));
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
