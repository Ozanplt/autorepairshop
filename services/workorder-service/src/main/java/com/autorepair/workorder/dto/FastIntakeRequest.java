package com.autorepair.workorder.dto;

import lombok.Data;

@Data
public class FastIntakeRequest {
    private CustomerData customer;
    private VehicleData vehicle;
    private WorkOrderData workOrder;

    @Data
    public static class CustomerData {
        private String fullName;
        private String phoneE164;
        private String email;
        private String customerId;
    }

    @Data
    public static class VehicleData {
        private String rawPlate;
        private String make;
        private String model;
        private String vehicleId;
    }

    @Data
    public static class WorkOrderData {
        private String problemShortNote;
        private String problemDetails;
    }
}
