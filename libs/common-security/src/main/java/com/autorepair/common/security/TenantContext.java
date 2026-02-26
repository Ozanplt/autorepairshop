package com.autorepair.common.security;

import lombok.Data;

import java.util.UUID;

@Data
public class TenantContext {
    private UUID tenantId;
    private UUID branchId;
    private String userId;
    private String[] roles;
    private String[] permissions;

    private static final ThreadLocal<TenantContext> CONTEXT = new ThreadLocal<>();

    public static void set(TenantContext context) {
        CONTEXT.set(context);
    }

    public static TenantContext get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }

    public static UUID getTenantId() {
        TenantContext context = get();
        return context != null ? context.tenantId : null;
    }

    public static UUID getBranchId() {
        TenantContext context = get();
        return context != null ? context.branchId : null;
    }

    public static String getUserId() {
        TenantContext context = get();
        return context != null ? context.userId : null;
    }
}
