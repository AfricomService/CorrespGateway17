package com.africom.ccgateway.web.rest;

import com.africom.ccgateway.repository.RulesRepository;
import com.africom.ccgateway.service.RulesService;
import com.africom.ccgateway.service.dto.RulesDTO;
import com.africom.ccgateway.web.rest.errors.BadRequestAlertException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.PaginationUtil;
import tech.jhipster.web.util.reactive.ResponseUtil;

/**
 * REST controller for managing {@link com.africom.ccgateway.domain.Rules}.
 */
@RestController
@RequestMapping("/api")
public class RulesResource {

    private final Logger log = LoggerFactory.getLogger(RulesResource.class);

    private static final String ENTITY_NAME = "rules";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final RulesService rulesService;

    private final RulesRepository rulesRepository;

    public RulesResource(RulesService rulesService, RulesRepository rulesRepository) {
        this.rulesService = rulesService;
        this.rulesRepository = rulesRepository;
    }

    /**
     * {@code POST  /rules} : Create a new rules.
     *
     * @param rulesDTO the rulesDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new rulesDTO, or with status {@code 400 (Bad Request)} if the rules has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("/rules")
    public Mono<ResponseEntity<RulesDTO>> createRules(@RequestBody RulesDTO rulesDTO) throws URISyntaxException {
        log.debug("REST request to save Rules : {}", rulesDTO);
        if (rulesDTO.getId() != null) {
            throw new BadRequestAlertException("A new rules cannot already have an ID", ENTITY_NAME, "idexists");
        }
        return rulesService
            .save(rulesDTO)
            .map(result -> {
                try {
                    return ResponseEntity
                        .created(new URI("/api/rules/" + result.getId()))
                        .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
                        .body(result);
                } catch (URISyntaxException e) {
                    throw new RuntimeException(e);
                }
            });
    }

    /**
     * {@code PUT  /rules/:id} : Updates an existing rules.
     *
     * @param id the id of the rulesDTO to save.
     * @param rulesDTO the rulesDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated rulesDTO,
     * or with status {@code 400 (Bad Request)} if the rulesDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the rulesDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/rules/{id}")
    public Mono<ResponseEntity<RulesDTO>> updateRules(
        @PathVariable(value = "id", required = false) final Long id,
        @RequestBody RulesDTO rulesDTO
    ) throws URISyntaxException {
        log.debug("REST request to update Rules : {}, {}", id, rulesDTO);
        if (rulesDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, rulesDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        return rulesRepository
            .existsById(id)
            .flatMap(exists -> {
                if (!exists) {
                    return Mono.error(new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));
                }

                return rulesService
                    .update(rulesDTO)
                    .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                    .map(result ->
                        ResponseEntity
                            .ok()
                            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
                            .body(result)
                    );
            });
    }

    /**
     * {@code PATCH  /rules/:id} : Partial updates given fields of an existing rules, field will ignore if it is null
     *
     * @param id the id of the rulesDTO to save.
     * @param rulesDTO the rulesDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated rulesDTO,
     * or with status {@code 400 (Bad Request)} if the rulesDTO is not valid,
     * or with status {@code 404 (Not Found)} if the rulesDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the rulesDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/rules/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public Mono<ResponseEntity<RulesDTO>> partialUpdateRules(
        @PathVariable(value = "id", required = false) final Long id,
        @RequestBody RulesDTO rulesDTO
    ) throws URISyntaxException {
        log.debug("REST request to partial update Rules partially : {}, {}", id, rulesDTO);
        if (rulesDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, rulesDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        return rulesRepository
            .existsById(id)
            .flatMap(exists -> {
                if (!exists) {
                    return Mono.error(new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));
                }

                Mono<RulesDTO> result = rulesService.partialUpdate(rulesDTO);

                return result
                    .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND)))
                    .map(res ->
                        ResponseEntity
                            .ok()
                            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, res.getId().toString()))
                            .body(res)
                    );
            });
    }

    /**
     * {@code GET  /rules} : get all the rules.
     *
     * @param pageable the pagination information.
     * @param request a {@link ServerHttpRequest} request.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of rules in body.
     */
    @GetMapping("/rules")
    public Mono<ResponseEntity<List<RulesDTO>>> getAllRules(
        @org.springdoc.api.annotations.ParameterObject Pageable pageable,
        ServerHttpRequest request
    ) {
        log.debug("REST request to get a page of Rules");
        return rulesService
            .countAll()
            .zipWith(rulesService.findAll(pageable).collectList())
            .map(countWithEntities ->
                ResponseEntity
                    .ok()
                    .headers(
                        PaginationUtil.generatePaginationHttpHeaders(
                            UriComponentsBuilder.fromHttpRequest(request),
                            new PageImpl<>(countWithEntities.getT2(), pageable, countWithEntities.getT1())
                        )
                    )
                    .body(countWithEntities.getT2())
            );
    }

    /**
     * {@code GET  /rules/:id} : get the "id" rules.
     *
     * @param id the id of the rulesDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the rulesDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/rules/{id}")
    public Mono<ResponseEntity<RulesDTO>> getRules(@PathVariable Long id) {
        log.debug("REST request to get Rules : {}", id);
        Mono<RulesDTO> rulesDTO = rulesService.findOne(id);
        return ResponseUtil.wrapOrNotFound(rulesDTO);
    }

    /**
     * {@code DELETE  /rules/:id} : delete the "id" rules.
     *
     * @param id the id of the rulesDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/rules/{id}")
    public Mono<ResponseEntity<Void>> deleteRules(@PathVariable Long id) {
        log.debug("REST request to delete Rules : {}", id);
        return rulesService
            .delete(id)
            .then(
                Mono.just(
                    ResponseEntity
                        .noContent()
                        .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
                        .build()
                )
            );
    }
}
