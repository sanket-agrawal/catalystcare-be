package in.catalystcare.catalystcare_backend.users.infrastructure.repository;

import in.catalystcare.catalystcare_backend.users.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
