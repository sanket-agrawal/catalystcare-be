// package in.catalystcare.catalystcare_backend.common.exception;

// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.ControllerAdvice;
// import org.springframework.web.bind.annotation.ExceptionHandler;

// import in.catalystcare.catalystcare_backend.common.dto.ApiResponse;

// @ControllerAdvice
// public class GlobalExceptionHandler {

//     // @ExceptionHandler(ResourceNotFoundException.class)
//     // public ResponseEntity<ApiResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
//     //     ApiResponse response = new ApiResponse(false, ex.getMessage());
//     //     return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
//     // }

//     // @ExceptionHandler(UnauthorizedAccessException.class)
//     // public ResponseEntity<ApiResponse> handleUnauthorizedAccessException(UnauthorizedAccessException ex) {
//     //     ApiResponse response = new ApiResponse(false, ex.getMessage());
//     //     return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
//     // }

//     // @ExceptionHandler(Exception.class)
//     // public ResponseEntity<ApiResponse> handleGenericException(Exception ex) {
//     //     ApiResponse response = new ApiResponse(false, "An unexpected error occurred: " + ex.getMessage());
//     //     return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
//     // }

//     // @ExceptionHandler(RuntimeException.class)
//     // public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex) {
//     //     return new ResponseEntity<>(ApiResponse.failure(ex.getMessage()), HttpStatus.BAD_REQUEST);
//     // }

// }
