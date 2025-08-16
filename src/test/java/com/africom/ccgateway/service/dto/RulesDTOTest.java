package com.africom.ccgateway.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.africom.ccgateway.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class RulesDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(RulesDTO.class);
        RulesDTO rulesDTO1 = new RulesDTO();
        rulesDTO1.setId(1L);
        RulesDTO rulesDTO2 = new RulesDTO();
        assertThat(rulesDTO1).isNotEqualTo(rulesDTO2);
        rulesDTO2.setId(rulesDTO1.getId());
        assertThat(rulesDTO1).isEqualTo(rulesDTO2);
        rulesDTO2.setId(2L);
        assertThat(rulesDTO1).isNotEqualTo(rulesDTO2);
        rulesDTO1.setId(null);
        assertThat(rulesDTO1).isNotEqualTo(rulesDTO2);
    }
}
