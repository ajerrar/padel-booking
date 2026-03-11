package com.ajerrar.padelbookingbackend.repository;

import com.ajerrar.padelbookingbackend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByMatriculeIgnoreCase(String matricule);
    Optional<AppUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}