package com.africom.ccgateway.web.rest;

import java.util.Map;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.WebSession;
import reactor.core.publisher.Mono;

/**
 * REST controller for managing global OIDC logout.
 */
@RestController
public class LogoutResource {

    private final Mono<ClientRegistration> registration;

    /**
     * Context path of this app behind the nginx reverse-proxy.
     * Hardcoded because nginx strips "/cc" before forwarding to this gateway.
     */
    private static final String APP_CONTEXT_PATH = "/cc/";

    public LogoutResource(ReactiveClientRegistrationRepository registrations) {
        this.registration = registrations.findByRegistrationId("oidc");
    }

    @PostMapping("/api/logout")
    public Mono<Map<String, String>> logout(
        @AuthenticationPrincipal(expression = "idToken") OidcIdToken idToken,
        ServerHttpRequest request,
        WebSession session
    ) {
        return session.invalidate().then(this.registration.map(oidc -> prepareLogoutUri(request, oidc, idToken)));
    }

    private Map<String, String> prepareLogoutUri(ServerHttpRequest request, ClientRegistration clientRegistration, OidcIdToken idToken) {
        StringBuilder logoutUrl = new StringBuilder();
        String issuerUri = clientRegistration.getProviderDetails().getIssuerUri();
        if (issuerUri.contains("auth0.com")) {
            logoutUrl.append(issuerUri.endsWith("/") ? issuerUri + "v2/logout" : issuerUri + "/v2/logout");
        } else {
            logoutUrl.append(clientRegistration.getProviderDetails().getConfigurationMetadata().get("end_session_endpoint").toString());
        }

        String originUrl = buildPostLogoutRedirectUri(request);

        if (issuerUri.contains("auth0.com")) {
            logoutUrl.append("?client_id=").append(clientRegistration.getClientId()).append("&returnTo=").append(originUrl);
        } else {
            logoutUrl.append("?id_token_hint=").append(idToken.getTokenValue()).append("&post_logout_redirect_uri=").append(originUrl);
        }
        return Map.of("logoutUrl", logoutUrl.toString());
    }

    private String buildPostLogoutRedirectUri(ServerHttpRequest request) {
        String scheme = request.getURI().getScheme();
        String host = request.getURI().getHost();
        int port = request.getURI().getPort();

        StringBuilder uri = new StringBuilder();
        uri.append(scheme).append("://").append(host);
        if (port != -1 && !((scheme.equals("http") && port == 80) || (scheme.equals("https") && port == 443))) {
            uri.append(":").append(port);
        }
        uri.append(APP_CONTEXT_PATH);

        return uri.toString();
    }
}
