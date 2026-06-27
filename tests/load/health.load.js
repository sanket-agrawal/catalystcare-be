import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 20 }, // Ramp-up to 20 users over 10 seconds
    { duration: "20s", target: 20 }, // Stay at 20 users for 20 seconds
    { duration: "10s", target: 0 }, // Ramp-down to 0 users over 10 seconds
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // Error rate should be less than 1%
    http_req_duration: ["p(95)<200"], // 95% of requests should be below 200ms
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";

export default function () {
  const url = `${BASE_URL}/api/v1/health`;
  const res = http.get(url);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "healthy status text": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.status === "Healthy";
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1); // 1-second pause between requests per user
}
