package com.autorepair.payment.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class InvoiceResponse {
    private UUID id;
    private UUID tenantId;
    private UUID workOrderId;
    private UUID customerId;
    private String invoiceNumber;
    private String currency;
    private BigDecimal subtotal;
    private BigDecimal taxTotal;
    private BigDecimal discountTotal;
    private BigDecimal grandTotal;
    private String status;
    private Instant issuedAt;
    private Instant dueAt;
    private Instant paidAt;
    private Instant createdAt;
}
