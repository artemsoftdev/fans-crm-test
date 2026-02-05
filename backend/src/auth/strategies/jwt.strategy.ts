import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret =
      configService.get<string>('JWT_SECRET') ||
      'your-secret-key-change-in-production';

    const extractJwtFromRequest = (req: Request) => {
      let token = null;

      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader) {
        const authValue = Array.isArray(authHeader)
          ? authHeader[0]
          : authHeader;
        if (authValue) {
          const parts = authValue.split(' ');
          if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
          }
        }
      }

      return token;
    };

    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, username: payload.username };
  }
}
