package com.ajerrar.padelbookingbackend.dto;

public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String city;
    private String level;
    private String matricule;
    private String role;
    private String siteName;
    private String bookingBlockedUntil;

    public UserResponse() {
    }

    public UserResponse(
            Long id,
            String firstName,
            String lastName,
            String email,
            String phone,
            String city,
            String level,
            String matricule,
            String role,
            String siteName,
            String bookingBlockedUntil
    ) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.city = city;
        this.level = level;
        this.matricule = matricule;
        this.role = role;
        this.siteName = siteName;
        this.bookingBlockedUntil = bookingBlockedUntil;
    }

    public Long getId() {
        return id;
    }

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

    public String getMatricule() {
        return matricule;
    }

    public String getRole() {
        return role;
    }

    public String getSiteName() {
        return siteName;
    }

    public String getBookingBlockedUntil() {
        return bookingBlockedUntil;
    }

    public void setId(Long id) {
        this.id = id;
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

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public void setBookingBlockedUntil(String bookingBlockedUntil) {
        this.bookingBlockedUntil = bookingBlockedUntil;
    }
}