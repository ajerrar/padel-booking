package com.ajerrar.padelbookingbackend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RegisterRequest {

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @Email
    @NotBlank
    private String email;

    private String phone;

    @NotBlank
    private String city;

    @NotBlank
    private String level;

    @NotBlank
    private String memberType;

    private String siteName;

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getCity() {
        return city;
    }

    public String getLevel() {
        return level;
    }

    public String getMemberType() {
        return memberType;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public void setMemberType(String memberType) {
        this.memberType = memberType;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }
}