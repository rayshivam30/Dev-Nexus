import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "[jwt] JWT_SECRET environment variable is not set. " +
    "Set it in your .env file before starting the server."
  );
}

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
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};


