package com.africom.ccgateway.service.mapper;

import com.africom.ccgateway.domain.Employe;
import com.africom.ccgateway.service.dto.EmployeDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Employe} and its DTO {@link EmployeDTO}.
 */
@Mapper(componentModel = "spring")
public interface EmployeMapper extends EntityMapper<EmployeDTO, Employe> {}
