package com.africom.ccgateway.service;

import com.africom.ccgateway.domain.Rules;
import com.africom.ccgateway.repository.RulesRepository;
import com.africom.ccgateway.service.dto.RulesDTO;
import com.africom.ccgateway.service.mapper.RulesMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service Implementation for managing {@link Rules}.
 */
@Service
@Transactional
public class RulesService {

    private final Logger log = LoggerFactory.getLogger(RulesService.class);

    private final RulesRepository rulesRepository;

    private final RulesMapper rulesMapper;

    public RulesService(RulesRepository rulesRepository, RulesMapper rulesMapper) {
        this.rulesRepository = rulesRepository;
        this.rulesMapper = rulesMapper;
    }

    /**
     * Save a rules.
     *
     * @param rulesDTO the entity to save.
     * @return the persisted entity.
     */
    public Mono<RulesDTO> save(RulesDTO rulesDTO) {
        log.debug("Request to save Rules : {}", rulesDTO);
        return rulesRepository.save(rulesMapper.toEntity(rulesDTO)).map(rulesMapper::toDto);
    }

    /**
     * Update a rules.
     *
     * @param rulesDTO the entity to save.
     * @return the persisted entity.
     */
    public Mono<RulesDTO> update(RulesDTO rulesDTO) {
        log.debug("Request to update Rules : {}", rulesDTO);
        return rulesRepository.save(rulesMapper.toEntity(rulesDTO)).map(rulesMapper::toDto);
    }

    /**
     * Partially update a rules.
     *
     * @param rulesDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Mono<RulesDTO> partialUpdate(RulesDTO rulesDTO) {
        log.debug("Request to partially update Rules : {}", rulesDTO);

        return rulesRepository
            .findById(rulesDTO.getId())
            .map(existingRules -> {
                rulesMapper.partialUpdate(existingRules, rulesDTO);

                return existingRules;
            })
            .flatMap(rulesRepository::save)
            .map(rulesMapper::toDto);
    }

    /**
     * Get all the rules.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Flux<RulesDTO> findAll(Pageable pageable) {
        log.debug("Request to get all Rules");
        return rulesRepository.findAllBy(pageable).map(rulesMapper::toDto);
    }

    /**
     * Returns the number of rules available.
     * @return the number of entities in the database.
     *
     */
    public Mono<Long> countAll() {
        return rulesRepository.count();
    }

    /**
     * Get one rules by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Mono<RulesDTO> findOne(Long id) {
        log.debug("Request to get Rules : {}", id);
        return rulesRepository.findById(id).map(rulesMapper::toDto);
    }

    /**
     * Delete the rules by id.
     *
     * @param id the id of the entity.
     * @return a Mono to signal the deletion
     */
    public Mono<Void> delete(Long id) {
        log.debug("Request to delete Rules : {}", id);
        return rulesRepository.deleteById(id);
    }
}
