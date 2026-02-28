package com.autorepair.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCustomerRequest {

    @NotBlank
    @Size(min = 1, max = 120)
    private String fullName;

    private String phoneE164;

    private String emailNormalized;

    private String address;

    private String type;
}
