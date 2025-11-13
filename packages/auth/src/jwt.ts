import jwt from 'jsonwebtoken';

// =========================
// JWT SERVICE
// =========================

export interface JWTPayload {
  userId: string;
  orgId: string;
  role: string;
  email?: string;
  [key: string]: any;
}

export interface JWTOptions {
  expiresIn?: string | number;
  audience?: string;
  issuer?: string;
}

export class JWTService {
  private secret: string;
  private defaultOptions: JWTOptions;

  constructor(config: {
    secret: string;
    defaultExpiresIn?: string;
    audience?: string;
    issuer?: string;
  }) {
    if (!config.secret || config.secret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }

    this.secret = config.secret;
    this.defaultOptions = {
      expiresIn: config.defaultExpiresIn || '7d',
      audience: config.audience || 'ratu-api',
      issuer: config.issuer || 'ratu-auth',
    };
  }

  /**
   * Sign a JWT token
   */
  sign(payload: JWTPayload, options?: JWTOptions): string {
    const opts = { ...this.defaultOptions, ...options };

    return jwt.sign(payload, this.secret, {
      expiresIn: opts.expiresIn,
      audience: opts.audience,
      issuer: opts.issuer,
    });
  }

  /**
   * Verify and decode a JWT token
   */
  verify(token: string, options?: jwt.VerifyOptions): JWTPayload {
    try {
      const opts = {
        audience: this.defaultOptions.audience,
        issuer: this.defaultOptions.issuer,
        ...options,
      };

      const decoded = jwt.verify(token, this.secret, opts);
      return decoded as JWTPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification (for inspection)
   */
  decode(token: string): JWTPayload | null {
    const decoded = jwt.decode(token);
    return decoded as JWTPayload | null;
  }

  /**
   * Create access token
   */
  createAccessToken(payload: JWTPayload): string {
    return this.sign(payload, { expiresIn: '15m' });
  }

  /**
   * Create refresh token
   */
  createRefreshToken(payload: JWTPayload): string {
    return this.sign(payload, { expiresIn: '30d' });
  }

  /**
   * Create token pair (access + refresh)
   */
  createTokenPair(payload: JWTPayload): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    return {
      accessToken: this.createAccessToken(payload),
      refreshToken: this.createRefreshToken(payload),
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string): string {
    const payload = this.verify(refreshToken);
    
    // Create new access token with same payload
    return this.createAccessToken({
      userId: payload.userId,
      orgId: payload.orgId,
      role: payload.role,
      email: payload.email,
    });
  }

  /**
   * Check if token is expired
   */
  isExpired(token: string): boolean {
    try {
      this.verify(token);
      return false;
    } catch (error: any) {
      return error.message === 'Token has expired';
    }
  }

  /**
   * Get token expiration time
   */
  getExpiration(token: string): Date | null {
    const decoded = this.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  }

  /**
   * Get time until expiration (in seconds)
   */
  getTimeUntilExpiration(token: string): number | null {
    const expiration = this.getExpiration(token);
    if (!expiration) {
      return null;
    }
    return Math.max(0, Math.floor((expiration.getTime() - Date.now()) / 1000));
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createJWTService(config?: {
  secret?: string;
  defaultExpiresIn?: string;
  audience?: string;
  issuer?: string;
}): JWTService {
  const secret = config?.secret || process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return new JWTService({
    secret,
    defaultExpiresIn: config?.defaultExpiresIn,
    audience: config?.audience,
    issuer: config?.issuer,
  });
}