package com.africom.ccgateway.service.mapper;

import com.africom.ccgateway.domain.Rules;
import com.africom.ccgateway.service.dto.RulesDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Rules} and its DTO {@link RulesDTO}.
 */
@Mapper(componentModel = "spring")
public interface RulesMapper extends EntityMapper<RulesDTO, Rules> {}
