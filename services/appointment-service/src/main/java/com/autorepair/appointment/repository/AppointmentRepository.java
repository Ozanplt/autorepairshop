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

    Page<Appointment> findByTenantIdAndActiveTrue(UUID tenantId, Pageable pageable);

    Page<Appointment> findByActiveTrue(Pageable pageable);

    Page<Appointment> findByTenantIdAndAppointmentDateAndActiveTrue(UUID tenantId, LocalDate date, Pageable pageable);

    List<Appointment> findByTenantIdAndAppointmentDateBetweenAndActiveTrue(UUID tenantId, LocalDate from, LocalDate to);

    Optional<Appointment> findByIdAndActiveTrue(UUID id);

    long countByTenantIdAndAppointmentDateAndActiveTrue(UUID tenantId, LocalDate date);
}
