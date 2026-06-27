import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 10 }, // Ramp-up to 10 users
    { duration: "20s", target: 10 }, // Stay at 10 users
    { duration: "10s", target: 0 }, // Ramp-down
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"], // Less than 5% failure rate (since some might be intentional bad logins)
    http_req_duration: ["p(95)<1000"], // Login can be slower due to bcrypt (aim for 95% under 1s)
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const EMAIL = __ENV.TEST_USER_EMAIL || "testuser@example.com";
const PASSWORD = __ENV.TEST_USER_PASSWORD || "Password@123";

export default function () {
  const url = `${BASE_URL}/api/v1/auth/login`;

  const payload = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    source: "PLATFORM",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const res = http.post(url, payload, params);

  // We check for either 200 (success) or 401/400/404 (handled user errors), but not 500 (internal server errors)
  check(res, {
    "status is not 500": (r) => r.status !== 500,
    "login returns json": (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);
}
