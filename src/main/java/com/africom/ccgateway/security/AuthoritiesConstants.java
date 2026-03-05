package com.africom.ccgateway.security;

/**
 * Constants for Spring Security authorities.
 */
public final class AuthoritiesConstants {

    public static final String ADMIN = "ROLE_ADMIN";

    public static final String USER = "ROLE_USER";

    public static final String ANONYMOUS = "ROLE_ANONYMOUS";

    public static final String BOC = "ROLE_BOC";
    public static final String CAN_CREATE_IN = "ROLE_CAN_CREATE_IN";
    public static final String CAN_CREATE_OUT = "ROLE_CAN_CREATE_OUT";
    public static final String CAN_CREATE_INT = "ROLE_CAN_CREATE_INT";

    private AuthoritiesConstants() {}
}
