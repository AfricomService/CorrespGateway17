package com.africom.ccgateway.repository;

import com.africom.ccgateway.domain.Employe;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Spring Data R2DBC repository for the Employe entity.
 */
@SuppressWarnings("unused")
@Repository
public interface EmployeRepository extends ReactiveCrudRepository<Employe, Long>, EmployeRepositoryInternal {
    Flux<Employe> findAllBy(Pageable pageable);

    @Override
    <S extends Employe> Mono<S> save(S entity);

    @Override
    Flux<Employe> findAll();

    @Override
    Mono<Employe> findById(Long id);

    @Override
    Mono<Void> deleteById(Long id);
}

interface EmployeRepositoryInternal {
    <S extends Employe> Mono<S> save(S entity);

    Flux<Employe> findAllBy(Pageable pageable);

    Flux<Employe> findAll();

    Mono<Employe> findById(Long id);
    // this is not supported at the moment because of https://github.com/jhipster/generator-jhipster/issues/18269
    // Flux<Employe> findAllBy(Pageable pageable, Criteria criteria);

}
