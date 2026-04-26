import { expect, test, describe } from "bun:test";
import { hashPassword, verifyPassword } from "../src/lib/hash";

describe("Authentication Utilities", () => {
  test("Passwords hash and verify correctly", async () => {
    const pass = "supers3cr3t!";
    const hash = await hashPassword(pass);
    
    // Hash should not be the plain text
    expect(hash).not.toBe(pass);
    
    // Verify valid password
    const isValid = await verifyPassword(pass, hash);
    expect(isValid).toBe(true);

    // Verify invalid password
    const isInvalid = await verifyPassword("wrong_password!", hash);
    expect(isInvalid).toBe(false);
  });
});
