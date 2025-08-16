package com.africom.ccgateway.service;

import com.africom.ccgateway.domain.Employe;
import com.africom.ccgateway.repository.EmployeRepository;
import com.africom.ccgateway.service.dto.EmployeDTO;
import com.africom.ccgateway.service.mapper.EmployeMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service Implementation for managing {@link Employe}.
 */
@Service
@Transactional
public class EmployeService {

    private final Logger log = LoggerFactory.getLogger(EmployeService.class);

    private final EmployeRepository employeRepository;

    private final EmployeMapper employeMapper;

    public EmployeService(EmployeRepository employeRepository, EmployeMapper employeMapper) {
        this.employeRepository = employeRepository;
        this.employeMapper = employeMapper;
    }

    /**
     * Save a employe.
     *
     * @param employeDTO the entity to save.
     * @return the persisted entity.
     */
    public Mono<EmployeDTO> save(EmployeDTO employeDTO) {
        log.debug("Request to save Employe : {}", employeDTO);
        return employeRepository.save(employeMapper.toEntity(employeDTO)).map(employeMapper::toDto);
    }

    /**
     * Update a employe.
     *
     * @param employeDTO the entity to save.
     * @return the persisted entity.
     */
    public Mono<EmployeDTO> update(EmployeDTO employeDTO) {
        log.debug("Request to update Employe : {}", employeDTO);
        return employeRepository.save(employeMapper.toEntity(employeDTO)).map(employeMapper::toDto);
    }

    /**
     * Partially update a employe.
     *
     * @param employeDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Mono<EmployeDTO> partialUpdate(EmployeDTO employeDTO) {
        log.debug("Request to partially update Employe : {}", employeDTO);

        return employeRepository
            .findById(employeDTO.getId())
            .map(existingEmploye -> {
                employeMapper.partialUpdate(existingEmploye, employeDTO);

                return existingEmploye;
            })
            .flatMap(employeRepository::save)
            .map(employeMapper::toDto);
    }

    /**
     * Get all the employes.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Flux<EmployeDTO> findAll(Pageable pageable) {
        log.debug("Request to get all Employes");
        return employeRepository.findAllBy(pageable).map(employeMapper::toDto);
    }

    /**
     * Returns the number of employes available.
     * @return the number of entities in the database.
     *
     */
    public Mono<Long> countAll() {
        return employeRepository.count();
    }

    /**
     * Get one employe by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Mono<EmployeDTO> findOne(Long id) {
        log.debug("Request to get Employe : {}", id);
        return employeRepository.findById(id).map(employeMapper::toDto);
    }

    /**
     * Delete the employe by id.
     *
     * @param id the id of the entity.
     * @return a Mono to signal the deletion
     */
    public Mono<Void> delete(Long id) {
        log.debug("Request to delete Employe : {}", id);
        return employeRepository.deleteById(id);
    }
}
