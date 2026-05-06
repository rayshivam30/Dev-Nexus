import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";
const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));

import { expect, test, describe, beforeEach } from "bun:test";
import { registerAdmin, verifyEmail } from "../src/services/auth-service";

describe("Auth Service", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockClear();
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockClear();
    prismaMock.organization.create.mockClear();
    prismaMock.verificationToken.create.mockClear();
  });

  describe("registerAdmin", () => {
    test("registers a new admin and creates an organization", async () => {
      const result = await registerAdmin("new@example.com", "password123", "New Org");
      
      expect(result.user).toBeDefined();
      expect(result.verificationToken).toBeDefined();
      expect(prismaMock.organization.create).toHaveBeenCalled();
      expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          role: "ADMIN",
          status: "UNVERIFIED"
        })
      }));
    });

    test("throws error if email already exists", async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: "existing" });
      
      expect(registerAdmin("existing@example.com", "password", "Org"))
        .rejects.toThrow("Email already in use");
    });
  });

  describe("verifyEmail", () => {
    test("activates user and deletes token", async () => {
      const user = await verifyEmail("valid-token");
      
      expect(user).toBeDefined();
      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(prismaMock.verificationToken.delete).toHaveBeenCalled();
    });

    test("throws error for invalid token", async () => {
      prismaMock.verificationToken.findUnique.mockResolvedValue(null);
      
      expect(verifyEmail("invalid-token"))
        .rejects.toThrow("Invalid or expired verification token");
    });

    test("throws error for expired token", async () => {
      prismaMock.verificationToken.findUnique.mockResolvedValue({ 
        expiresAt: new Date(Date.now() - 1000) 
      });
      
      expect(verifyEmail("expired-token"))
        .rejects.toThrow("Invalid or expired verification token");
    });
  });
});
