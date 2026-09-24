import request from "supertest";
import app from "../app";

describe("Health check", () => {
  it("GET /health → 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Causes", () => {
  it("GET /api/causes → 200 (empty DB returns array)", async () => {
    const res = await request(app).get("/api/causes");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("Donate validation", () => {
  it("POST /api/donate with bad body → 422", async () => {
    const res = await request(app)
      .post("/api/donate")
      .send({ amountUsd: -5 });
    expect(res.status).toBe(422);
  });
});
