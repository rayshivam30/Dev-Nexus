import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

export interface JwtPayload {
  userId: string;
  role: 'ADMIN' | 'MANAGER' | 'DEVELOPER';
  orgId?: string;
  projectId?: string;
  teamId?: string;
}

export const signToken = (payload: JwtPayload, expiresIn: SignOptions['expiresIn'] = '1h'): string => {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};
