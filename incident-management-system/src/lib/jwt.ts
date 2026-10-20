import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const encoder = new TextEncoder();

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
  /** GitHub OAuth install state is project-scoped; session authorization uses memberships. */
  projectId?: string;
  invitedBy?: string;
  /** Token type: 'access' (default) or 'refresh' */
  type?: 'access' | 'refresh';
}

function durationSeconds(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) throw new Error(`Unsupported JWT expiry: ${expiresIn}`);
  const amount = Number(match[1]);
  return amount * ({ s: 1, m: 60, h: 3600, d: 86400 } as const)[match[2] as 's' | 'm' | 'h' | 'd'];
}

export const signToken = async (payload: JwtPayload, expiresIn = '1h'): Promise<string> => {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${durationSeconds(expiresIn)}s`)
    .sign(encoder.encode(getJwtSecret()));
};

/**
 * Sign a refresh token with a longer expiry (7 days).
 * Refresh tokens are used to obtain new access tokens without re-authenticating.
 */
export const signRefreshToken = async (payload: JwtPayload, expiresIn = '7d'): Promise<string> => {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${durationSeconds(expiresIn)}s`)
    .sign(encoder.encode(getJwtSecret()));
};

export const verifyToken = async (token: string): Promise<JwtPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, encoder.encode(getJwtSecret()), { algorithms: ['HS256'] });
    return payload as JwtPayload & JWTPayload;
  } catch {
    return null;
  }
};
