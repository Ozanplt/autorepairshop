package com.autorepair.appointment.service;

import com.autorepair.appointment.dto.AppointmentResponse;
import com.autorepair.appointment.dto.CreateAppointmentRequest;
import com.autorepair.appointment.entity.Appointment;
import com.autorepair.appointment.repository.AppointmentRepository;
import com.autorepair.common.security.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    @Transactional
    public AppointmentResponse create(CreateAppointmentRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        UUID branchId = TenantContext.getBranchId();

        Appointment appointment = new Appointment();
        appointment.setId(UUID.randomUUID());
        appointment.setTenantId(tenantId != null ? tenantId : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        appointment.setBranchId(branchId);
        appointment.setCustomerId(request.getCustomerId());
        appointment.setVehicleId(request.getVehicleId());
        appointment.setWorkOrderId(request.getWorkOrderId());
        appointment.setTitle(request.getTitle().trim());
        appointment.setDescription(request.getDescription());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setStatus("SCHEDULED");
        appointment.setAssignedToUserId(request.getAssignedToUserId());
        appointment.setNotes(request.getNotes());
        appointment.setCreatedAt(Instant.now());
        appointment.setUpdatedAt(Instant.now());

        appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> list(Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Appointment> page;
        if (tenantId != null) {
            page = appointmentRepository.findByTenantIdAndIsDeletedFalse(tenantId, pageable);
        } else {
            page = appointmentRepository.findByIsDeletedFalse(pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Appointment appointment = appointmentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (tenantId != null && !tenantId.equals(appointment.getTenantId())) {
            throw new RuntimeException("Appointment not found: " + id);
        }
        return toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse updateStatus(UUID id, String newStatus) {
        UUID tenantId = TenantContext.getTenantId();
        Appointment appointment = appointmentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (tenantId != null && !tenantId.equals(appointment.getTenantId())) {
            throw new RuntimeException("Appointment not found: " + id);
        }
        appointment.setStatus(newStatus);
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    @Transactional
    public void cancel(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Appointment appointment = appointmentRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + id));
        if (tenantId != null && !tenantId.equals(appointment.getTenantId())) {
            throw new RuntimeException("Appointment not found: " + id);
        }
        appointment.setStatus("CANCELED");
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .tenantId(a.getTenantId())
                .customerId(a.getCustomerId())
                .vehicleId(a.getVehicleId())
                .workOrderId(a.getWorkOrderId())
                .title(a.getTitle())
                .description(a.getDescription())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .assignedToUserId(a.getAssignedToUserId())
                .notes(a.getNotes())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
