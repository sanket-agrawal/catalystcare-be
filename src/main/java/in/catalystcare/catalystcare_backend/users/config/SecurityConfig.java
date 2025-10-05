package in.catalystcare.catalystcare_backend.users.config;

import org.springframework.context.annotation.Configuration;

import java.beans.Customizer;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable() // disable CSRF for Postman testing
            .authorizeHttpRequests()
            .requestMatchers("/api/users/register").permitAll() // allow registration
            .anyRequest().authenticated() // all other endpoints require auth
            .and()
            .httpBasic(); // for now, simple basic auth (can remove later)
        return http.build();
    }


}
