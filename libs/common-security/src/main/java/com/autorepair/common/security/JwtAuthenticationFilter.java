package com.autorepair.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") || path.startsWith("/v3/api-docs") || path.startsWith("/swagger");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            
            String tenantId = jwt.getClaimAsString("tenant_id");
            if (tenantId == null || tenantId.isBlank()) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Missing tenant_id claim in token\"}");
                return;
            }

            TenantContext context = new TenantContext();
            context.setUserId(jwt.getSubject());
            context.setTenantId(UUID.fromString(tenantId));
            
            String branchId = jwt.getClaimAsString("branch_id");
            if (branchId != null) {
                context.setBranchId(UUID.fromString(branchId));
            }

            List<String> roles = jwt.getClaimAsStringList("roles");
            if (roles != null) {
                context.setRoles(roles.toArray(new String[0]));
            }

            List<String> permissions = jwt.getClaimAsStringList("permissions");
            if (permissions != null) {
                context.setPermissions(permissions.toArray(new String[0]));
            }
            
            TenantContext.set(context);
        }
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
