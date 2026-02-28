package com.autorepair.inventory.controller;

import com.autorepair.inventory.dto.CreateInventoryPartRequest;
import com.autorepair.inventory.dto.InventoryPartResponse;
import com.autorepair.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/parts")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping
    public ResponseEntity<InventoryPartResponse> create(@Valid @RequestBody CreateInventoryPartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.create(request));
    }

    @GetMapping
    public ResponseEntity<Page<InventoryPartResponse>> list(
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(inventoryService.list(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryPartResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(inventoryService.getById(id));
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<InventoryPartResponse> adjustStock(
            @PathVariable UUID id,
            @RequestBody Map<String, Integer> body) {
        Integer adjustment = body.get("adjustment");
        if (adjustment == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(inventoryService.adjustStock(id, adjustment));
    }
}
