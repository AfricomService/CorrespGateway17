package com.africom.ccgateway.service;

import com.africom.ccgateway.config.Constants;
import com.africom.ccgateway.domain.Authority;
import com.africom.ccgateway.domain.User;
import com.africom.ccgateway.repository.AuthorityRepository;
import com.africom.ccgateway.repository.UserRepository;
import com.africom.ccgateway.security.AuthoritiesConstants;
import com.africom.ccgateway.security.SecurityUtils;
import com.africom.ccgateway.service.dto.AdminUserDTO;
import com.africom.ccgateway.service.dto.UserDTO;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import tech.jhipster.security.RandomUtil;

/**
 * Service class for managing users.
 */
@Service
public class UserService {

    private final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final AuthorityRepository authorityRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthorityRepository authorityRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authorityRepository = authorityRepository;
    }

    @Transactional
    public Mono<User> activateRegistration(String key) {
        log.debug("Activating user for activation key {}", key);
        return userRepository
            .findOneByActivationKey(key)
            .flatMap(user -> {
                // activate given user for the registration key.
                user.setActivated(true);
                user.setActivationKey(null);
                return saveUser(user);
            })
            .doOnNext(user -> log.debug("Activated user: {}", user));
    }

    @Transactional
    public Mono<User> completePasswordReset(String newPassword, String key) {
        log.debug("Reset user password for reset key {}", key);
        return userRepository
            .findOneByResetKey(key)
            .filter(user -> user.getResetDate().isAfter(Instant.now().minus(1, ChronoUnit.DAYS)))
            .publishOn(Schedulers.boundedElastic())
            .map(user -> {
                user.setPassword(passwordEncoder.encode(newPassword));
                user.setResetKey(null);
                user.setResetDate(null);
                return user;
            })
            .flatMap(this::saveUser);
    }

    @Transactional
    public Mono<User> requestPasswordReset(String mail) {
        return userRepository
            .findOneByEmailIgnoreCase(mail)
            .filter(User::isActivated)
            .publishOn(Schedulers.boundedElastic())
            .map(user -> {
                user.setResetKey(RandomUtil.generateResetKey());
                user.setResetDate(Instant.now());
                return user;
            })
            .flatMap(this::saveUser);
    }

    @Transactional
    public Mono<User> registerUser(AdminUserDTO userDTO, String password) {
        return userRepository
            .findOneByLogin(userDTO.getLogin().toLowerCase())
            .flatMap(existingUser -> {
                if (!existingUser.isActivated()) {
                    return userRepository.delete(existingUser);
                } else {
                    return Mono.error(new UsernameAlreadyUsedException());
                }
            })
            .then(userRepository.findOneByEmailIgnoreCase(userDTO.getEmail()))
            .flatMap(existingUser -> {
                if (!existingUser.isActivated()) {
                    return userRepository.delete(existingUser);
                } else {
                    return Mono.error(new EmailAlreadyUsedException());
                }
            })
            .publishOn(Schedulers.boundedElastic())
            .then(
                Mono.fromCallable(() -> {
                    User newUser = new User();
                    String encryptedPassword = passwordEncoder.encode(password);
                    newUser.setLogin(userDTO.getLogin().toLowerCase());
                    newUser.setPassword(encryptedPassword);
                    newUser.setFirstName(userDTO.getFirstName());
                    newUser.setLastName(userDTO.getLastName());
                    if (userDTO.getEmail() != null) {
                        newUser.setEmail(userDTO.getEmail().toLowerCase());
                    }
                    newUser.setImageUrl(userDTO.getImageUrl());
                    newUser.setLangKey(userDTO.getLangKey());
                    // **Utilisateur activé dès la création**
                    newUser.setActivated(true);
                    // pas d'activation key si activé immédiatement
                    newUser.setActivationKey(null);
                    return newUser;
                })
            )
            .flatMap(newUser -> {
                Set<Authority> authorities = new HashSet<>();
                return authorityRepository
                    .findById(AuthoritiesConstants.USER)
                    .map(authorities::add)
                    .thenReturn(newUser)
                    .doOnNext(user -> user.setAuthorities(authorities))
                    .flatMap(this::saveUser)
                    .doOnNext(user -> log.debug("Created Information for User: {}", user));
            });
    }

    @Transactional
    public Mono<User> createUser(AdminUserDTO userDTO) {
        final String loginLower = userDTO.getLogin().toLowerCase();
        // check login existence
        Mono<Boolean> loginExists = userRepository.findOneByLogin(loginLower).hasElement();
        // check email existence (skip if null)
        Mono<Boolean> emailExists = userDTO.getEmail() == null
            ? Mono.just(false)
            : userRepository.findOneByEmailIgnoreCase(userDTO.getEmail().toLowerCase()).hasElement();

        return Mono
            .zip(loginExists, emailExists)
            .flatMap(tuple -> {
                boolean loginAlready = tuple.getT1();
                boolean emailAlready = tuple.getT2();
                if (loginAlready) {
                    return Mono.error(new LoginAlreadyUsedException());
                }
                if (emailAlready) {
                    return Mono.error(new EmailAlreadyUsedException());
                }

                // Proceed with original creation logic
                User user = new User();
                user.setLogin(loginLower);
                user.setFirstName(userDTO.getFirstName());
                user.setLastName(userDTO.getLastName());
                if (userDTO.getEmail() != null) {
                    user.setEmail(userDTO.getEmail().toLowerCase());
                }
                user.setImageUrl(userDTO.getImageUrl());
                if (userDTO.getLangKey() == null) {
                    user.setLangKey(Constants.DEFAULT_LANGUAGE);
                } else {
                    user.setLangKey(userDTO.getLangKey());
                }

                // load authorities and then finalize creation
                return Flux
                    .fromIterable(userDTO.getAuthorities() != null ? userDTO.getAuthorities() : new HashSet<>())
                    .flatMap(authorityRepository::findById)
                    .doOnNext(authority -> user.getAuthorities().add(authority))
                    .then(Mono.just(user))
                    .publishOn(Schedulers.boundedElastic())
                    .map(newUser -> {
                        String encryptedPassword = passwordEncoder.encode(RandomUtil.generatePassword());
                        newUser.setPassword(encryptedPassword);
                        newUser.setResetKey(RandomUtil.generateResetKey());
                        newUser.setResetDate(Instant.now());
                        newUser.setActivated(true);
                        return newUser;
                    })
                    .flatMap(this::saveUser)
                    .doOnNext(created -> log.debug("Created Information for User: {}", created));
            });
    }

    /**
     * Update all information for a specific user, and return the modified user.
     *
     * @param userDTO user to update.
     * @return updated user.
     */
    @Transactional
    public Mono<AdminUserDTO> updateUser(AdminUserDTO userDTO) {
        final String loginLower = userDTO.getLogin().toLowerCase();

        // check email conflict with other users (if email != null)
        Mono<Boolean> emailConflict = userDTO.getEmail() == null
            ? Mono.just(false)
            : userRepository
                .findOneByEmailIgnoreCase(userDTO.getEmail().toLowerCase())
                .filter(u -> !u.getId().equals(userDTO.getId()))
                .hasElement();

        // check login conflict with other users
        Mono<Boolean> loginConflict = userRepository
            .findOneByLogin(loginLower)
            .filter(u -> !u.getId().equals(userDTO.getId()))
            .hasElement();

        return Mono
            .zip(emailConflict, loginConflict)
            .flatMap(tuple -> {
                if (Boolean.TRUE.equals(tuple.getT1())) {
                    return Mono.error(new EmailAlreadyUsedException());
                }
                if (Boolean.TRUE.equals(tuple.getT2())) {
                    return Mono.error(new LoginAlreadyUsedException());
                }

                // no conflicts -> do existing update flow
                return userRepository
                    .findById(userDTO.getId())
                    .flatMap(user -> {
                        user.setLogin(loginLower);
                        user.setFirstName(userDTO.getFirstName());
                        user.setLastName(userDTO.getLastName());
                        if (userDTO.getEmail() != null) {
                            user.setEmail(userDTO.getEmail().toLowerCase());
                        }
                        user.setImageUrl(userDTO.getImageUrl());
                        user.setActivated(userDTO.isActivated());
                        user.setLangKey(userDTO.getLangKey());
                        Set<Authority> managedAuthorities = user.getAuthorities();
                        managedAuthorities.clear();
                        return userRepository
                            .deleteUserAuthorities(user.getId())
                            .thenMany(Flux.fromIterable(userDTO.getAuthorities()))
                            .flatMap(authorityRepository::findById)
                            .map(managedAuthorities::add)
                            .then(Mono.just(user));
                    })
                    .flatMap(this::saveUser)
                    .doOnNext(user -> log.debug("Changed Information for User: {}", user))
                    .map(AdminUserDTO::new);
            });
    }

    @Transactional
    public Mono<Void> deleteUser(String login) {
        return userRepository
            .findOneByLogin(login)
            .flatMap(user -> userRepository.delete(user).thenReturn(user))
            .doOnNext(user -> log.debug("Deleted User: {}", user))
            .then();
    }

    /**
     * Update basic information (first name, last name, email, language) for the current user.
     *
     * @param firstName first name of user.
     * @param lastName  last name of user.
     * @param email     email id of user.
     * @param langKey   language key.
     * @param imageUrl  image URL of user.
     * @return a completed {@link Mono}.
     */
    @Transactional
    public Mono<Void> updateUser(String firstName, String lastName, String email, String langKey, String imageUrl) {
        return SecurityUtils
            .getCurrentUserLogin()
            .flatMap(userRepository::findOneByLogin)
            .flatMap(user -> {
                user.setFirstName(firstName);
                user.setLastName(lastName);
                if (email != null) {
                    user.setEmail(email.toLowerCase());
                }
                user.setLangKey(langKey);
                user.setImageUrl(imageUrl);
                return saveUser(user);
            })
            .doOnNext(user -> log.debug("Changed Information for User: {}", user))
            .then();
    }

    @Transactional
    public Mono<User> saveUser(User user) {
        return SecurityUtils
            .getCurrentUserLogin()
            .switchIfEmpty(Mono.just(Constants.SYSTEM))
            .flatMap(login -> {
                if (user.getCreatedBy() == null) {
                    user.setCreatedBy(login);
                }
                user.setLastModifiedBy(login);
                // Saving the relationship can be done in an entity callback
                // once https://github.com/spring-projects/spring-data-r2dbc/issues/215 is done
                return userRepository
                    .save(user)
                    .flatMap(savedUser ->
                        Flux
                            .fromIterable(user.getAuthorities())
                            .flatMap(authority -> userRepository.saveUserAuthority(savedUser.getId(), authority.getName()))
                            .then(Mono.just(savedUser))
                    );
            });
    }

    @Transactional
    public Mono<Void> changePassword(String currentClearTextPassword, String newPassword) {
        return SecurityUtils
            .getCurrentUserLogin()
            .flatMap(userRepository::findOneByLogin)
            .publishOn(Schedulers.boundedElastic())
            .map(user -> {
                String currentEncryptedPassword = user.getPassword();
                if (!passwordEncoder.matches(currentClearTextPassword, currentEncryptedPassword)) {
                    throw new InvalidPasswordException();
                }
                String encryptedPassword = passwordEncoder.encode(newPassword);
                user.setPassword(encryptedPassword);
                return user;
            })
            .flatMap(this::saveUser)
            .doOnNext(user -> log.debug("Changed password for User: {}", user))
            .then();
    }

    @Transactional(readOnly = true)
    public Flux<AdminUserDTO> getAllManagedUsers(Pageable pageable) {
        return userRepository.findAllWithAuthorities(pageable).map(AdminUserDTO::new);
    }

    @Transactional(readOnly = true)
    public Flux<UserDTO> getAllPublicUsers(Pageable pageable) {
        return userRepository.findAllByIdNotNullAndActivatedIsTrue(pageable).map(UserDTO::new);
    }

    @Transactional(readOnly = true)
    public Mono<Long> countManagedUsers() {
        return userRepository.count();
    }

    @Transactional(readOnly = true)
    public Mono<User> getUserWithAuthoritiesByLogin(String login) {
        return userRepository.findOneWithAuthoritiesByLogin(login);
    }

    @Transactional(readOnly = true)
    public Mono<User> getUserWithAuthorities() {
        //TODO RETRIEVE CODES DEPTS ASSOCIATED TO USER FROM ORGACARE

        return SecurityUtils.getCurrentUserLogin().flatMap(userRepository::findOneWithAuthoritiesByLogin);
    }

    /**
     * Not activated users should be automatically deleted after 3 days.
     * <p>
     * This is scheduled to get fired everyday, at 01:00 (am).
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void removeNotActivatedUsers() {
        removeNotActivatedUsersReactively().blockLast();
    }

    @Transactional
    public Flux<User> removeNotActivatedUsersReactively() {
        return userRepository
            .findAllByActivatedIsFalseAndActivationKeyIsNotNullAndCreatedDateBefore(
                LocalDateTime.ofInstant(Instant.now().minus(3, ChronoUnit.DAYS), ZoneOffset.UTC)
            )
            .flatMap(user -> userRepository.delete(user).thenReturn(user))
            .doOnNext(user -> log.debug("Deleted User: {}", user));
    }

    /**
     * Gets a list of all the authorities.
     * @return a list of all the authorities.
     */
    @Transactional(readOnly = true)
    public Flux<String> getAuthorities() {
        return authorityRepository.findAll().map(Authority::getName);
    }

    @Transactional(readOnly = true)
    public Mono<UserDTO> getUserById(Long id) {
        return userRepository.findById(id).map(UserDTO::new);
    }
}
