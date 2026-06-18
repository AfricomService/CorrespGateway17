package com.africom.ccgateway.security;

import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component("userDetailsService")
public class DomainUserDetailsService implements ReactiveUserDetailsService {

    @Override
    public Mono<UserDetails> findByUsername(String login) {
        return Mono.just(User.withUsername(login).password("").authorities("ROLE_USER").build());
    }
}
