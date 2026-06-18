package com.africom.ccgateway.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;

import com.africom.ccgateway.IntegrationTest;
import com.africom.ccgateway.domain.Rules;
import com.africom.ccgateway.repository.EntityManager;
import com.africom.ccgateway.repository.RulesRepository;
import com.africom.ccgateway.service.dto.RulesDTO;
import com.africom.ccgateway.service.mapper.RulesMapper;
import java.time.Duration;
import java.util.List;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.util.Base64Utils;

/**
 * Integration tests for the {@link RulesResource} REST controller.
 */
@IntegrationTest
@AutoConfigureWebTestClient(timeout = IntegrationTest.DEFAULT_ENTITY_TIMEOUT)
@WithMockUser
class RulesResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_CODE = "AAAAAAAAAA";
    private static final String UPDATED_CODE = "BBBBBBBBBB";

    private static final Boolean DEFAULT_IS_ACTIF = false;
    private static final Boolean UPDATED_IS_ACTIF = true;

    private static final byte[] DEFAULT_FILE = TestUtil.createByteArray(1, "0");
    private static final byte[] UPDATED_FILE = TestUtil.createByteArray(1, "1");
    private static final String DEFAULT_FILE_CONTENT_TYPE = "image/jpg";
    private static final String UPDATED_FILE_CONTENT_TYPE = "image/png";

    private static final String ENTITY_API_URL = "/api/rules";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong count = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private RulesRepository rulesRepository;

    @Autowired
    private RulesMapper rulesMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private WebTestClient webTestClient;

    private Rules rules;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Rules createEntity(EntityManager em) {
        Rules rules = new Rules()
            .name(DEFAULT_NAME)
            .code(DEFAULT_CODE)
            .isActif(DEFAULT_IS_ACTIF)
            .file(DEFAULT_FILE)
            .fileContentType(DEFAULT_FILE_CONTENT_TYPE);
        return rules;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Rules createUpdatedEntity(EntityManager em) {
        Rules rules = new Rules()
            .name(UPDATED_NAME)
            .code(UPDATED_CODE)
            .isActif(UPDATED_IS_ACTIF)
            .file(UPDATED_FILE)
            .fileContentType(UPDATED_FILE_CONTENT_TYPE);
        return rules;
    }

    public static void deleteEntities(EntityManager em) {
        try {
            em.deleteAll(Rules.class).block();
        } catch (Exception e) {
            // It can fail, if other entities are still referring this - it will be removed later.
        }
    }

    @AfterEach
    public void cleanup() {
        deleteEntities(em);
    }

    @BeforeEach
    public void setupCsrf() {
        webTestClient = webTestClient.mutateWith(csrf());
    }

    @BeforeEach
    public void initTest() {
        deleteEntities(em);
        rules = createEntity(em);
    }

    @Test
    void createRules() throws Exception {
        int databaseSizeBeforeCreate = rulesRepository.findAll().collectList().block().size();
        // Create the Rules
        RulesDTO rulesDTO = rulesMapper.toDto(rules);
        webTestClient
            .post()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isCreated();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeCreate + 1);
        Rules testRules = rulesList.get(rulesList.size() - 1);
        assertThat(testRules.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testRules.getCode()).isEqualTo(DEFAULT_CODE);
        assertThat(testRules.getIsActif()).isEqualTo(DEFAULT_IS_ACTIF);
        assertThat(testRules.getFile()).isEqualTo(DEFAULT_FILE);
        assertThat(testRules.getFileContentType()).isEqualTo(DEFAULT_FILE_CONTENT_TYPE);
    }

    @Test
    void createRulesWithExistingId() throws Exception {
        // Create the Rules with an existing ID
        rules.setId(1L);
        RulesDTO rulesDTO = rulesMapper.toDto(rules);

        int databaseSizeBeforeCreate = rulesRepository.findAll().collectList().block().size();

        // An entity with an existing ID cannot be created, so this API call must fail
        webTestClient
            .post()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    void getAllRules() {
        // Initialize the database
        rulesRepository.save(rules).block();

        // Get all the rulesList
        webTestClient
            .get()
            .uri(ENTITY_API_URL + "?sort=id,desc")
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isOk()
            .expectHeader()
            .contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.[*].id")
            .value(hasItem(rules.getId().intValue()))
            .jsonPath("$.[*].name")
            .value(hasItem(DEFAULT_NAME))
            .jsonPath("$.[*].code")
            .value(hasItem(DEFAULT_CODE))
            .jsonPath("$.[*].isActif")
            .value(hasItem(DEFAULT_IS_ACTIF.booleanValue()))
            .jsonPath("$.[*].fileContentType")
            .value(hasItem(DEFAULT_FILE_CONTENT_TYPE))
            .jsonPath("$.[*].file")
            .value(hasItem(Base64Utils.encodeToString(DEFAULT_FILE)));
    }

    @Test
    void getRules() {
        // Initialize the database
        rulesRepository.save(rules).block();

        // Get the rules
        webTestClient
            .get()
            .uri(ENTITY_API_URL_ID, rules.getId())
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isOk()
            .expectHeader()
            .contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.id")
            .value(is(rules.getId().intValue()))
            .jsonPath("$.name")
            .value(is(DEFAULT_NAME))
            .jsonPath("$.code")
            .value(is(DEFAULT_CODE))
            .jsonPath("$.isActif")
            .value(is(DEFAULT_IS_ACTIF.booleanValue()))
            .jsonPath("$.fileContentType")
            .value(is(DEFAULT_FILE_CONTENT_TYPE))
            .jsonPath("$.file")
            .value(is(Base64Utils.encodeToString(DEFAULT_FILE)));
    }

    @Test
    void getNonExistingRules() {
        // Get the rules
        webTestClient
            .get()
            .uri(ENTITY_API_URL_ID, Long.MAX_VALUE)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isNotFound();
    }

    @Test
    void putExistingRules() throws Exception {
        // Initialize the database
        rulesRepository.save(rules).block();

        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();

        // Update the rules
        Rules updatedRules = rulesRepository.findById(rules.getId()).block();
        updatedRules
            .name(UPDATED_NAME)
            .code(UPDATED_CODE)
            .isActif(UPDATED_IS_ACTIF)
            .file(UPDATED_FILE)
            .fileContentType(UPDATED_FILE_CONTENT_TYPE);
        RulesDTO rulesDTO = rulesMapper.toDto(updatedRules);

        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, rulesDTO.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
        Rules testRules = rulesList.get(rulesList.size() - 1);
        assertThat(testRules.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testRules.getCode()).isEqualTo(UPDATED_CODE);
        assertThat(testRules.getIsActif()).isEqualTo(UPDATED_IS_ACTIF);
        assertThat(testRules.getFile()).isEqualTo(UPDATED_FILE);
        assertThat(testRules.getFileContentType()).isEqualTo(UPDATED_FILE_CONTENT_TYPE);
    }

    @Test
    void putNonExistingRules() throws Exception {
        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();
        rules.setId(count.incrementAndGet());

        // Create the Rules
        RulesDTO rulesDTO = rulesMapper.toDto(rules);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, rulesDTO.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void putWithIdMismatchRules() throws Exception {
        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();
        rules.setId(count.incrementAndGet());

        // Create the Rules
        RulesDTO rulesDTO = rulesMapper.toDto(rules);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, count.incrementAndGet())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void putWithMissingIdPathParamRules() throws Exception {
        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();
        rules.setId(count.incrementAndGet());

        // Create the Rules
        RulesDTO rulesDTO = rulesMapper.toDto(rules);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isEqualTo(405);

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void partialUpdateRulesWithPatch() throws Exception {
        // Initialize the database
        rulesRepository.save(rules).block();

        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();

        // Update the rules using partial update
        Rules partialUpdatedRules = new Rules();
        partialUpdatedRules.setId(rules.getId());

        partialUpdatedRules.code(UPDATED_CODE).isActif(UPDATED_IS_ACTIF);

        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, partialUpdatedRules.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(partialUpdatedRules))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
        Rules testRules = rulesList.get(rulesList.size() - 1);
        assertThat(testRules.getName()).isEqualTo(DEFAULT_NAME);
        assertThat(testRules.getCode()).isEqualTo(UPDATED_CODE);
        assertThat(testRules.getIsActif()).isEqualTo(UPDATED_IS_ACTIF);
        assertThat(testRules.getFile()).isEqualTo(DEFAULT_FILE);
        assertThat(testRules.getFileContentType()).isEqualTo(DEFAULT_FILE_CONTENT_TYPE);
    }

    @Test
    void fullUpdateRulesWithPatch() throws Exception {
        // Initialize the database
        rulesRepository.save(rules).block();

        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();

        // Update the rules using partial update
        Rules partialUpdatedRules = new Rules();
        partialUpdatedRules.setId(rules.getId());

        partialUpdatedRules
            .name(UPDATED_NAME)
            .code(UPDATED_CODE)
            .isActif(UPDATED_IS_ACTIF)
            .file(UPDATED_FILE)
            .fileContentType(UPDATED_FILE_CONTENT_TYPE);

        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, partialUpdatedRules.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(partialUpdatedRules))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
        Rules testRules = rulesList.get(rulesList.size() - 1);
        assertThat(testRules.getName()).isEqualTo(UPDATED_NAME);
        assertThat(testRules.getCode()).isEqualTo(UPDATED_CODE);
        assertThat(testRules.getIsActif()).isEqualTo(UPDATED_IS_ACTIF);
        assertThat(testRules.getFile()).isEqualTo(UPDATED_FILE);
        assertThat(testRules.getFileContentType()).isEqualTo(UPDATED_FILE_CONTENT_TYPE);
    }

    @Test
    void patchNonExistingRules() throws Exception {
        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();
        rules.setId(count.incrementAndGet());

        // Create the Rules
        RulesDTO rulesDTO = rulesMapper.toDto(rules);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, rulesDTO.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void patchWithIdMismatchRules() throws Exception {
        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();
        rules.setId(count.incrementAndGet());

        // Create the Rules
        RulesDTO rulesDTO = rulesMapper.toDto(rules);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, count.incrementAndGet())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void patchWithMissingIdPathParamRules() throws Exception {
        int databaseSizeBeforeUpdate = rulesRepository.findAll().collectList().block().size();
        rules.setId(count.incrementAndGet());

        // Create the Rules
        RulesDTO rulesDTO = rulesMapper.toDto(rules);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(rulesDTO))
            .exchange()
            .expectStatus()
            .isEqualTo(405);

        // Validate the Rules in the database
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void deleteRules() {
        // Initialize the database
        rulesRepository.save(rules).block();

        int databaseSizeBeforeDelete = rulesRepository.findAll().collectList().block().size();

        // Delete the rules
        webTestClient
            .delete()
            .uri(ENTITY_API_URL_ID, rules.getId())
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isNoContent();

        // Validate the database contains one less item
        List<Rules> rulesList = rulesRepository.findAll().collectList().block();
        assertThat(rulesList).hasSize(databaseSizeBeforeDelete - 1);
    }
}
