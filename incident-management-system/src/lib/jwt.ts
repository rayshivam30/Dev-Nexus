import jwt, { SignOptions } from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "[jwt] JWT_SECRET environment variable is not set. " +
      "Set it in your .env file before starting the server."
    );
  }
  return secret;
};

export interface JwtPayload {
  userId?: string;
  email?: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER';
  orgId?: string;
  projectId?: string;
  teamId?: string;
  invitedBy?: string;
}

export const signToken = (payload: JwtPayload, expiresIn: SignOptions['expiresIn'] = '1h'): string => {
  return jwt.sign(payload as object, getJwtSecret(), { expiresIn, algorithm: 'HS256' });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JwtPayload;
  } catch {
    return null;
  }
};
