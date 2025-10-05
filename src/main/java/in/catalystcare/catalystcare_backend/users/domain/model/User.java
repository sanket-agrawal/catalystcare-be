package in.catalystcare.catalystcare_backend.users.domain.model;


import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

import in.catalystcare.catalystcare_backend.users.domain.enums.UserType;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue
    @org.hibernate.annotations.UuidGenerator
    @Column(updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false)
    private String firstName;
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserType userType;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
    
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
