package com.africom.ccgateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "application")
public class ApplicationProperties {

    private Frontend frontend = new Frontend();
    private KeycloakAdmin keycloakAdmin = new KeycloakAdmin();

    public Frontend getFrontend() {
        return frontend;
    }

    public void setFrontend(Frontend frontend) {
        this.frontend = frontend;
    }

    public KeycloakAdmin getKeycloakAdmin() {
        return keycloakAdmin;
    }

    public void setKeycloakAdmin(KeycloakAdmin keycloakAdmin) {
        this.keycloakAdmin = keycloakAdmin;
    }

    public static class Frontend {

        private Keycloak keycloak = new Keycloak();

        public Keycloak getKeycloak() {
            return keycloak;
        }

        public void setKeycloak(Keycloak keycloak) {
            this.keycloak = keycloak;
        }

        public static class Keycloak {

            private String adminUserCreateUrl;

            public String getAdminUserCreateUrl() {
                return adminUserCreateUrl;
            }

            public void setAdminUserCreateUrl(String adminUserCreateUrl) {
                this.adminUserCreateUrl = adminUserCreateUrl;
            }
        }
    }

    public static class KeycloakAdmin {

        private Admin admin = new Admin();

        public Admin getAdmin() {
            return admin;
        }

        public void setAdmin(Admin admin) {
            this.admin = admin;
        }

        public static class Admin {

            private String serverUrl;
            private String realm;
            private String clientId;
            private String username;
            private String password;
            private String targetRealm;

            // getters/setters
            public String getServerUrl() {
                return serverUrl;
            }

            public void setServerUrl(String serverUrl) {
                this.serverUrl = serverUrl;
            }

            public String getRealm() {
                return realm;
            }

            public void setRealm(String realm) {
                this.realm = realm;
            }

            public String getClientId() {
                return clientId;
            }

            public void setClientId(String clientId) {
                this.clientId = clientId;
            }

            public String getUsername() {
                return username;
            }

            public void setUsername(String username) {
                this.username = username;
            }

            public String getPassword() {
                return password;
            }

            public void setPassword(String password) {
                this.password = password;
            }

            public String getTargetRealm() {
                return targetRealm;
            }

            public void setTargetRealm(String targetRealm) {
                this.targetRealm = targetRealm;
            }
        }
    }
}
