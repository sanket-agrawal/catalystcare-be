import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "15s", target: 5 }, // Ramp-up to 5 concurrent users (keep it low for LLM rate limits)
    { duration: "30s", target: 5 }, // Stay at 5 users
    { duration: "15s", target: 0 }, // Ramp-down
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"], // Less than 5% failure rate
    http_req_duration: ["p(95)<5000"], // LLM requests are slow; 95% should complete under 5 seconds
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const EMAIL = __ENV.TEST_USER_EMAIL || "testuser@example.com";
const PASSWORD = __ENV.TEST_USER_PASSWORD || "Password@123";

// setup runs once globally before the test
export function setup() {
  if (__ENV.AUTH_TOKEN) {
    return { token: __ENV.AUTH_TOKEN };
  }

  console.log(`Attempting to authenticate user: ${EMAIL}...`);
  const loginUrl = `${BASE_URL}/api/v1/auth/login`;
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

  const res = http.post(loginUrl, payload, params);

  if (res.status !== 200) {
    console.error(`Login failed with status ${res.status}: ${res.body}`);
    return { token: null };
  }

  let token = null;
  try {
    const body = JSON.parse(res.body);
    token = body.data.token;
  } catch (e) {
    console.error("Failed to parse authentication response JSON");
  }

  return { token };
}

export default function (data) {
  const token = data.token;
  if (!token) {
    console.warn("Skipping iteration: No auth token available.");
    sleep(1);
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // 1. Create a new Vent AI Chat Session
  const sessionUrl = `${BASE_URL}/api/v1/ai/vent/text/sessions`;
  const sessionRes = http.post(sessionUrl, JSON.stringify({}), { headers: authHeaders });

  const sessionOk = check(sessionRes, {
    "create session status is 201": (r) => r.status === 201,
  });

  if (!sessionOk) {
    console.error(`Session creation failed: ${sessionRes.status} ${sessionRes.body}`);
    sleep(1);
    return;
  }

  let sessionId;
  try {
    const body = JSON.parse(sessionRes.body);
    sessionId = body.data.id;
  } catch (e) {
    console.error("Failed to parse session creation response");
    sleep(1);
    return;
  }

  // 2. Send a vent message to the chat
  const messageUrl = `${BASE_URL}/api/v1/ai/vent/text/message`;
  const messagePayload = JSON.stringify({
    message:
      "I have been feeling quite anxious about my upcoming exam, and it is keeping me awake at night.",
    sessionId: sessionId,
  });

  const messageRes = http.post(messageUrl, messagePayload, { headers: authHeaders });

  check(messageRes, {
    "send message status is 200": (r) => r.status === 200,
    "message response has reply": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && typeof body.data.reply === "string";
      } catch (e) {
        return false;
      }
    },
  });

  // 3. Cleanup session to keep the DB clean
  const deleteUrl = `${BASE_URL}/api/v1/ai/vent/text/sessions/${sessionId}`;
  const deleteRes = http.del(deleteUrl, JSON.stringify({}), { headers: authHeaders });

  check(deleteRes, {
    "delete session status is 200": (r) => r.status === 200,
  });

  sleep(2); // Pause between iterations
}
