package com.autorepair.appointment.service;

import com.autorepair.appointment.dto.AppointmentResponse;
import com.autorepair.appointment.dto.CreateAppointmentRequest;
import com.autorepair.appointment.entity.Appointment;
import com.autorepair.appointment.repository.AppointmentRepository;
import com.autorepair.common.security.TenantContext;
import com.autorepair.common.security.exception.ResourceNotFoundException;
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
        appointment.setTenantId(tenantId);
        appointment.setBranchId(branchId);
        appointment.setCustomerId(request.getCustomerId());
        appointment.setVehicleId(request.getVehicleId());
        appointment.setWorkOrderId(request.getWorkOrderId());
        appointment.setTitle(request.getTitle() != null ? request.getTitle().trim() : null);
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
        page = appointmentRepository.findByTenantIdAndActiveTrue(tenantId, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getById(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Appointment appointment = appointmentRepository.findByIdAndActiveTrue(id)
                .filter(a -> tenantId.equals(a.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        return toResponse(appointment);
    }

    @Transactional
    public AppointmentResponse updateStatus(UUID id, String newStatus) {
        UUID tenantId = TenantContext.getTenantId();
        Appointment appointment = appointmentRepository.findByIdAndActiveTrue(id)
                .filter(a -> tenantId.equals(a.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
        appointment.setStatus(newStatus);
        appointment.setUpdatedAt(Instant.now());
        appointmentRepository.save(appointment);
        return toResponse(appointment);
    }

    @Transactional
    public void cancel(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Appointment appointment = appointmentRepository.findByIdAndActiveTrue(id)
                .filter(a -> tenantId.equals(a.getTenantId()))
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", id));
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
