package com.autorepair.appointment.repository;

import com.autorepair.appointment.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    Page<Appointment> findByTenantIdAndIsDeletedFalse(UUID tenantId, Pageable pageable);

    Page<Appointment> findByIsDeletedFalse(Pageable pageable);

    Page<Appointment> findByTenantIdAndAppointmentDateAndIsDeletedFalse(UUID tenantId, LocalDate date, Pageable pageable);

    List<Appointment> findByTenantIdAndAppointmentDateBetweenAndIsDeletedFalse(UUID tenantId, LocalDate from, LocalDate to);

    Optional<Appointment> findByIdAndIsDeletedFalse(UUID id);

    long countByTenantIdAndAppointmentDateAndIsDeletedFalse(UUID tenantId, LocalDate date);
}
