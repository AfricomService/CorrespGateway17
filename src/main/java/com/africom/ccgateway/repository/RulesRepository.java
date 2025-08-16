package com.africom.ccgateway.repository;

import com.africom.ccgateway.domain.Rules;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Spring Data R2DBC repository for the Rules entity.
 */
@SuppressWarnings("unused")
@Repository
public interface RulesRepository extends ReactiveCrudRepository<Rules, Long>, RulesRepositoryInternal {
    Flux<Rules> findAllBy(Pageable pageable);

    @Override
    <S extends Rules> Mono<S> save(S entity);

    @Override
    Flux<Rules> findAll();

    @Override
    Mono<Rules> findById(Long id);

    @Override
    Mono<Void> deleteById(Long id);
}

interface RulesRepositoryInternal {
    <S extends Rules> Mono<S> save(S entity);

    Flux<Rules> findAllBy(Pageable pageable);

    Flux<Rules> findAll();

    Mono<Rules> findById(Long id);
    // this is not supported at the moment because of https://github.com/jhipster/generator-jhipster/issues/18269
    // Flux<Rules> findAllBy(Pageable pageable, Criteria criteria);

}
