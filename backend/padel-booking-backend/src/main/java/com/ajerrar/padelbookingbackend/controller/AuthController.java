package com.ajerrar.padelbookingbackend.controller;

import com.ajerrar.padelbookingbackend.dto.LoginRequest;
import com.ajerrar.padelbookingbackend.dto.RegisterRequest;
import com.ajerrar.padelbookingbackend.dto.UserResponse;
import com.ajerrar.padelbookingbackend.entity.AppUser;
import com.ajerrar.padelbookingbackend.repository.AppUserRepository;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository appUserRepository;

    public AuthController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @Operation(summary = "Connexion par matricule")
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        return appUserRepository.findByMatriculeIgnoreCase(request.getMatricule())
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Inscription d’un nouvel utilisateur")
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            return ResponseEntity.badRequest().body("Un compte existe déjà avec cet email.");
        }

        String memberType = request.getMemberType().trim().toUpperCase(Locale.ROOT);

        if ("SITE".equals(memberType) && (request.getSiteName() == null || request.getSiteName().isBlank())) {
            return ResponseEntity.badRequest().body("Le site est obligatoire pour un membre SITE.");
        }

        String matricule = generateMatricule(memberType);

        AppUser user = new AppUser(
                request.getFirstName().trim(),
                request.getLastName().trim(),
                email,
                request.getPhone() != null ? request.getPhone().trim() : "",
                request.getCity().trim(),
                request.getLevel().trim(),
                matricule,
                "User",
                request.getSiteName() != null && !request.getSiteName().isBlank() ? request.getSiteName().trim() : null
        );

        AppUser saved = appUserRepository.save(user);
        return ResponseEntity.ok(toResponse(saved));
    }

    private UserResponse toResponse(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getCity(),
                user.getLevel(),
                user.getMatricule(),
                user.getRole(),
                user.getSiteName(),
                user.getBookingBlockedUntil()
        );
    }

    private String generateMatricule(String memberType) {
        String prefix;
        int digitsCount;

        switch (memberType) {
            case "GLOBAL" -> {
                prefix = "G";
                digitsCount = 4;
            }
            case "SITE" -> {
                prefix = "S";
                digitsCount = 5;
            }
            default -> {
                prefix = "L";
                digitsCount = 5;
            }
        }

        Random random = new Random();
        StringBuilder digits = new StringBuilder();
        for (int i = 0; i < digitsCount; i++) {
            digits.append(random.nextInt(10));
        }

        return prefix + digits;
    }
}