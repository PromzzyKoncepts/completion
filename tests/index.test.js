/* eslint-disable no-undef */
const request = require("supertest");
const { app } = require("..");

/**
 * Mock node-cron
 */
jest.mock("node-cron", () => ({
    schedule: jest.fn().mockReturnThis(),
    start: jest.fn(),
}));

describe("App", () => {
    it("should respond with a message for the root route", async () => {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
        expect(response.text).toBe("This is the base project");
    });

    it('should respond with a "Not Implemented" error for undefined routes', async () => {
        const response = await request(app).get("/undefined-route");
        expect(response.status).toBe(501);
    });
});
