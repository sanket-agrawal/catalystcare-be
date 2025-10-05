package in.catalystcare.catalystcare_backend.users.interfaces;

import in.catalystcare.catalystcare_backend.users.application.UserService;
import in.catalystcare.catalystcare_backend.users.domain.model.User;
import in.catalystcare.catalystcare_backend.users.domain.enums.UserType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        User user = userService.registerUser(
            request.get("email"), 
            request.get("password"),
            request.get("firstName"),
            request.get("lastName"),
            UserType.valueOf(request.get("userType")
        ));
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable UUID id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
