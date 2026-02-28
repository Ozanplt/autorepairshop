package com.autorepair.workorder.controller;

import com.autorepair.workorder.dto.FastIntakeRequest;
import com.autorepair.workorder.dto.WorkOrderResponse;
import com.autorepair.workorder.service.WorkOrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/workorders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @PostMapping("/fast-intake")
    public ResponseEntity<WorkOrderResponse> fastIntake(@RequestBody FastIntakeRequest request) {
        WorkOrderResponse response = workOrderService.createFastIntake(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<WorkOrderResponse>> listWorkOrders(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(workOrderService.listWorkOrders(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderResponse> getWorkOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(workOrderService.getWorkOrder(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WorkOrderResponse> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(workOrderService.updateStatus(id, newStatus));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        workOrderService.deleteWorkOrder(id);
        return ResponseEntity.noContent().build();
    }
}
