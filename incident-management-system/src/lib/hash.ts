import bcrypt from 'bcryptjs';

// OWASP recommends a minimum cost factor of 12 for bcrypt.
// Override via BCRYPT_ROUNDS env var if you need to adjust for your hardware.
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
