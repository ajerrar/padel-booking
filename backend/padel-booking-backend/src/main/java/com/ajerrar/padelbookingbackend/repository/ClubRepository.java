package com.ajerrar.padelbookingbackend.repository;

import com.ajerrar.padelbookingbackend.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClubRepository extends JpaRepository<Club, Long> {
}