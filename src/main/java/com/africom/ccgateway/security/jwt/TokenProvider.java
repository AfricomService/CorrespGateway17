package com.africom.ccgateway.security.jwt;

import com.africom.ccgateway.management.SecurityMetersService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import tech.jhipster.config.JHipsterProperties;

@Component
public class TokenProvider {

    private final SecurityMetersService securityMetersService;

    public TokenProvider(JHipsterProperties jHipsterProperties, SecurityMetersService securityMetersService) {
        this.securityMetersService = securityMetersService;
    }

    /**
     * Dummy implementation.
     */
    public String createToken(Authentication authentication, boolean rememberMe) {
        return "";
    }

    /**
     * Dummy implementation.
     */
    public Authentication getAuthentication(String token) {
        return new UsernamePasswordAuthenticationToken(null, null, null);
    }

    /**
     * Dummy implementation.
     */
    public boolean validateToken(String authToken) {
        return true;
    }
}
