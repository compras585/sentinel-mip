import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async buildPair(user: { id: string; tenantId: string; role: string; email: string }) {
    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: '15m',
    });
    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync({ ...payload, jti, tokenUse: 'refresh' }, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: '7d',
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      response: {
        accessToken, refreshToken, tokenType: 'Bearer', expiresIn: 900, refreshExpiresIn: 604800,
        user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      },
      session: { userId: user.id, tokenHash: this.hashToken(refreshToken), expiresAt },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.active || !user.tenantId || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }
    const pair = await this.buildPair({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId });
    await this.prisma.refreshSession.create({ data: pair.session });
    return pair.response;
  }

  async refresh(refreshToken: string) {
    let claims: any;
    try {
      claims = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Sesión de renovación inválida o vencida');
    }
    if (claims.tokenUse !== 'refresh' || !claims.sub || !claims.jti || !claims.tenantId) {
      throw new UnauthorizedException('Token de renovación inválido');
    }
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({ where: { tokenHash } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.userId !== claims.sub) {
      throw new UnauthorizedException('Sesión de renovación revocada o vencida');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: claims.sub, tenantId: claims.tenantId, active: true },
    });
    if (!user || !user.tenantId) throw new UnauthorizedException('Usuario inactivo');
    const pair = await this.buildPair({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId });
    // Revoke old token + persist replacement in one transaction. Concurrent replay
    // loses the conditional update; an insert failure rolls back the revocation.
    await this.prisma.$transaction(async (tx) => {
      const rotated = await tx.refreshSession.updateMany({
        where: { id: session.id, revokedAt: null, expiresAt: { gt: new Date() } },
        data: { revokedAt: new Date() },
      });
      if (rotated.count !== 1) throw new UnauthorizedException('El token ya fue utilizado');
      await tx.refreshSession.create({ data: pair.session });
    });
    return pair.response;
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { loggedOut: true };
  }
}
