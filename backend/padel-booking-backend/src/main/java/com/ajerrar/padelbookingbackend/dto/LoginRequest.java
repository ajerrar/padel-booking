package com.ajerrar.padelbookingbackend.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank
    private String matricule;

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }
}