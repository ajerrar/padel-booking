package com.ajerrar.padelbookingbackend.config;

import com.ajerrar.padelbookingbackend.entity.AppUser;
import com.ajerrar.padelbookingbackend.entity.Club;
import com.ajerrar.padelbookingbackend.repository.AppUserRepository;
import com.ajerrar.padelbookingbackend.repository.ClubRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(ClubRepository clubRepository, AppUserRepository appUserRepository) {
        return args -> {
            if (clubRepository.count() == 0) {
                clubRepository.save(new Club("Court 24 Arena", "Waterloo", "indoor", 60));
                clubRepository.save(new Club("Padel Factory", "Uccle", "outdoor", 60));
                clubRepository.save(new Club("PlayZone Padely", "Forest", "indoor", 60));
            }

            if (appUserRepository.findByMatriculeIgnoreCase("ADM-GLOBAL").isEmpty()) {
                appUserRepository.save(new AppUser(
                        "Admin",
                        "Global",
                        "admin@padel.com",
                        "",
                        "Bruxelles",
                        "Avancé",
                        "ADM-GLOBAL",
                        "AdminGlobal",
                        null
                ));
            }

            if (appUserRepository.findByMatriculeIgnoreCase("ADM-SITE-WATERLOO").isEmpty()) {
                appUserRepository.save(new AppUser(
                        "Admin",
                        "Site",
                        "site-court24@padel.com",
                        "",
                        "Waterloo",
                        "Avancé",
                        "ADM-SITE-WATERLOO",
                        "AdminClub",
                        "Court 24 Arena"
                ));
            }

            if (appUserRepository.findByMatriculeIgnoreCase("ADM-SITE-UCCLE").isEmpty()) {
                appUserRepository.save(new AppUser(
                        "Admin",
                        "Site",
                        "site-padel-factory@padel.com",
                        "",
                        "Uccle",
                        "Avancé",
                        "ADM-SITE-UCCLE",
                        "AdminClub",
                        "Padel Factory"
                ));
            }

            if (appUserRepository.findByMatriculeIgnoreCase("ADM-SITE-FOREST").isEmpty()) {
                appUserRepository.save(new AppUser(
                        "Admin",
                        "Site",
                        "site-playzone@padel.com",
                        "",
                        "Forest",
                        "Avancé",
                        "ADM-SITE-FOREST",
                        "AdminClub",
                        "PlayZone Padely"
                ));
            }
        };
    }
}