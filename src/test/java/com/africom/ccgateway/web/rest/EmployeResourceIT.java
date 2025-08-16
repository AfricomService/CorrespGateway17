package com.africom.ccgateway.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;

import com.africom.ccgateway.IntegrationTest;
import com.africom.ccgateway.domain.Employe;
import com.africom.ccgateway.repository.EmployeRepository;
import com.africom.ccgateway.repository.EntityManager;
import com.africom.ccgateway.service.dto.EmployeDTO;
import com.africom.ccgateway.service.mapper.EmployeMapper;
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

/**
 * Integration tests for the {@link EmployeResource} REST controller.
 */
@IntegrationTest
@AutoConfigureWebTestClient(timeout = IntegrationTest.DEFAULT_ENTITY_TIMEOUT)
@WithMockUser
class EmployeResourceIT {

    private static final String DEFAULT_JOB_TITLE = "AAAAAAAAAA";
    private static final String UPDATED_JOB_TITLE = "BBBBBBBBBB";

    private static final String DEFAULT_EMAIL = "AAAAAAAAAA";
    private static final String UPDATED_EMAIL = "BBBBBBBBBB";

    private static final String DEFAULT_PHONE_NUMBER = "AAAAAAAAAA";
    private static final String UPDATED_PHONE_NUMBER = "BBBBBBBBBB";

    private static final String ENTITY_API_URL = "/api/employes";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong count = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private EmployeRepository employeRepository;

    @Autowired
    private EmployeMapper employeMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private WebTestClient webTestClient;

    private Employe employe;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Employe createEntity(EntityManager em) {
        Employe employe = new Employe().jobTitle(DEFAULT_JOB_TITLE).email(DEFAULT_EMAIL).phoneNumber(DEFAULT_PHONE_NUMBER);
        return employe;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Employe createUpdatedEntity(EntityManager em) {
        Employe employe = new Employe().jobTitle(UPDATED_JOB_TITLE).email(UPDATED_EMAIL).phoneNumber(UPDATED_PHONE_NUMBER);
        return employe;
    }

    public static void deleteEntities(EntityManager em) {
        try {
            em.deleteAll(Employe.class).block();
        } catch (Exception e) {
            // It can fail, if other entities are still referring this - it will be removed later.
        }
    }

    @AfterEach
    public void cleanup() {
        deleteEntities(em);
    }

    @BeforeEach
    public void initTest() {
        deleteEntities(em);
        employe = createEntity(em);
    }

    @Test
    void createEmploye() throws Exception {
        int databaseSizeBeforeCreate = employeRepository.findAll().collectList().block().size();
        // Create the Employe
        EmployeDTO employeDTO = employeMapper.toDto(employe);
        webTestClient
            .post()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isCreated();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeCreate + 1);
        Employe testEmploye = employeList.get(employeList.size() - 1);
        assertThat(testEmploye.getJobTitle()).isEqualTo(DEFAULT_JOB_TITLE);
        assertThat(testEmploye.getEmail()).isEqualTo(DEFAULT_EMAIL);
        assertThat(testEmploye.getPhoneNumber()).isEqualTo(DEFAULT_PHONE_NUMBER);
    }

    @Test
    void createEmployeWithExistingId() throws Exception {
        // Create the Employe with an existing ID
        employe.setId(1L);
        EmployeDTO employeDTO = employeMapper.toDto(employe);

        int databaseSizeBeforeCreate = employeRepository.findAll().collectList().block().size();

        // An entity with an existing ID cannot be created, so this API call must fail
        webTestClient
            .post()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeCreate);
    }

    @Test
    void getAllEmployes() {
        // Initialize the database
        employeRepository.save(employe).block();

        // Get all the employeList
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
            .value(hasItem(employe.getId().intValue()))
            .jsonPath("$.[*].jobTitle")
            .value(hasItem(DEFAULT_JOB_TITLE))
            .jsonPath("$.[*].email")
            .value(hasItem(DEFAULT_EMAIL))
            .jsonPath("$.[*].phoneNumber")
            .value(hasItem(DEFAULT_PHONE_NUMBER));
    }

    @Test
    void getEmploye() {
        // Initialize the database
        employeRepository.save(employe).block();

        // Get the employe
        webTestClient
            .get()
            .uri(ENTITY_API_URL_ID, employe.getId())
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isOk()
            .expectHeader()
            .contentType(MediaType.APPLICATION_JSON)
            .expectBody()
            .jsonPath("$.id")
            .value(is(employe.getId().intValue()))
            .jsonPath("$.jobTitle")
            .value(is(DEFAULT_JOB_TITLE))
            .jsonPath("$.email")
            .value(is(DEFAULT_EMAIL))
            .jsonPath("$.phoneNumber")
            .value(is(DEFAULT_PHONE_NUMBER));
    }

    @Test
    void getNonExistingEmploye() {
        // Get the employe
        webTestClient
            .get()
            .uri(ENTITY_API_URL_ID, Long.MAX_VALUE)
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isNotFound();
    }

    @Test
    void putExistingEmploye() throws Exception {
        // Initialize the database
        employeRepository.save(employe).block();

        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();

        // Update the employe
        Employe updatedEmploye = employeRepository.findById(employe.getId()).block();
        updatedEmploye.jobTitle(UPDATED_JOB_TITLE).email(UPDATED_EMAIL).phoneNumber(UPDATED_PHONE_NUMBER);
        EmployeDTO employeDTO = employeMapper.toDto(updatedEmploye);

        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, employeDTO.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
        Employe testEmploye = employeList.get(employeList.size() - 1);
        assertThat(testEmploye.getJobTitle()).isEqualTo(UPDATED_JOB_TITLE);
        assertThat(testEmploye.getEmail()).isEqualTo(UPDATED_EMAIL);
        assertThat(testEmploye.getPhoneNumber()).isEqualTo(UPDATED_PHONE_NUMBER);
    }

    @Test
    void putNonExistingEmploye() throws Exception {
        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();
        employe.setId(count.incrementAndGet());

        // Create the Employe
        EmployeDTO employeDTO = employeMapper.toDto(employe);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, employeDTO.getId())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void putWithIdMismatchEmploye() throws Exception {
        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();
        employe.setId(count.incrementAndGet());

        // Create the Employe
        EmployeDTO employeDTO = employeMapper.toDto(employe);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL_ID, count.incrementAndGet())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void putWithMissingIdPathParamEmploye() throws Exception {
        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();
        employe.setId(count.incrementAndGet());

        // Create the Employe
        EmployeDTO employeDTO = employeMapper.toDto(employe);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .put()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isEqualTo(405);

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void partialUpdateEmployeWithPatch() throws Exception {
        // Initialize the database
        employeRepository.save(employe).block();

        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();

        // Update the employe using partial update
        Employe partialUpdatedEmploye = new Employe();
        partialUpdatedEmploye.setId(employe.getId());

        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, partialUpdatedEmploye.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(partialUpdatedEmploye))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
        Employe testEmploye = employeList.get(employeList.size() - 1);
        assertThat(testEmploye.getJobTitle()).isEqualTo(DEFAULT_JOB_TITLE);
        assertThat(testEmploye.getEmail()).isEqualTo(DEFAULT_EMAIL);
        assertThat(testEmploye.getPhoneNumber()).isEqualTo(DEFAULT_PHONE_NUMBER);
    }

    @Test
    void fullUpdateEmployeWithPatch() throws Exception {
        // Initialize the database
        employeRepository.save(employe).block();

        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();

        // Update the employe using partial update
        Employe partialUpdatedEmploye = new Employe();
        partialUpdatedEmploye.setId(employe.getId());

        partialUpdatedEmploye.jobTitle(UPDATED_JOB_TITLE).email(UPDATED_EMAIL).phoneNumber(UPDATED_PHONE_NUMBER);

        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, partialUpdatedEmploye.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(partialUpdatedEmploye))
            .exchange()
            .expectStatus()
            .isOk();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
        Employe testEmploye = employeList.get(employeList.size() - 1);
        assertThat(testEmploye.getJobTitle()).isEqualTo(UPDATED_JOB_TITLE);
        assertThat(testEmploye.getEmail()).isEqualTo(UPDATED_EMAIL);
        assertThat(testEmploye.getPhoneNumber()).isEqualTo(UPDATED_PHONE_NUMBER);
    }

    @Test
    void patchNonExistingEmploye() throws Exception {
        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();
        employe.setId(count.incrementAndGet());

        // Create the Employe
        EmployeDTO employeDTO = employeMapper.toDto(employe);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, employeDTO.getId())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void patchWithIdMismatchEmploye() throws Exception {
        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();
        employe.setId(count.incrementAndGet());

        // Create the Employe
        EmployeDTO employeDTO = employeMapper.toDto(employe);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL_ID, count.incrementAndGet())
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isBadRequest();

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void patchWithMissingIdPathParamEmploye() throws Exception {
        int databaseSizeBeforeUpdate = employeRepository.findAll().collectList().block().size();
        employe.setId(count.incrementAndGet());

        // Create the Employe
        EmployeDTO employeDTO = employeMapper.toDto(employe);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        webTestClient
            .patch()
            .uri(ENTITY_API_URL)
            .contentType(MediaType.valueOf("application/merge-patch+json"))
            .bodyValue(TestUtil.convertObjectToJsonBytes(employeDTO))
            .exchange()
            .expectStatus()
            .isEqualTo(405);

        // Validate the Employe in the database
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeUpdate);
    }

    @Test
    void deleteEmploye() {
        // Initialize the database
        employeRepository.save(employe).block();

        int databaseSizeBeforeDelete = employeRepository.findAll().collectList().block().size();

        // Delete the employe
        webTestClient
            .delete()
            .uri(ENTITY_API_URL_ID, employe.getId())
            .accept(MediaType.APPLICATION_JSON)
            .exchange()
            .expectStatus()
            .isNoContent();

        // Validate the database contains one less item
        List<Employe> employeList = employeRepository.findAll().collectList().block();
        assertThat(employeList).hasSize(databaseSizeBeforeDelete - 1);
    }
}
