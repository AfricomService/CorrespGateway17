package com.africom.ccgateway.service.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RulesMapperTest {

    private RulesMapper rulesMapper;

    @BeforeEach
    public void setUp() {
        rulesMapper = new RulesMapperImpl();
    }
}
