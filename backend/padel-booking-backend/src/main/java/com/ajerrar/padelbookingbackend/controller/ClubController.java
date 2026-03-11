package com.ajerrar.padelbookingbackend.controller;

import com.ajerrar.padelbookingbackend.entity.Club;
import com.ajerrar.padelbookingbackend.repository.ClubRepository;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {

    private final ClubRepository clubRepository;

    public ClubController(ClubRepository clubRepository) {
        this.clubRepository = clubRepository;
    }

    @Operation(summary = "Récupérer tous les clubs")
    @GetMapping
    public List<Club> getAllClubs() {
        return clubRepository.findAll();
    }

    @Operation(summary = "Récupérer un club par son id")
    @GetMapping("/{id}")
    public ResponseEntity<Club> getClubById(@PathVariable Long id) {
        return clubRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}