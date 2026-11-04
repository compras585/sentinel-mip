import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService refresh rotation', () => {
  const user = { id: 'user-1', email: 'qa@example.test', role: 'ADMIN', tenantId: 'tenant-1', active: true };
  const session = {
    id: 'session-1', userId: user.id, tokenHash: 'old-hash',
    expiresAt: new Date(Date.now() + 60_000), revokedAt: null,
  };
  let prisma: any;
  let jwt: any;
  let config: any;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      refreshSession: {
        findUnique: jest.fn().mockResolvedValue(session),
        create: jest.fn().mockResolvedValue({}),
      },
      user: { findFirst: jest.fn().mockResolvedValue(user) },
      $transaction: jest.fn(async (callback: any) => callback({
        refreshSession: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          create: jest.fn().mockResolvedValue({}),
        },
      })),
    };
    jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: user.id, tenantId: user.tenantId, jti: 'jti-1', tokenUse: 'refresh',
      }),
      signAsync: jest.fn().mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh'),
    };
    config = { getOrThrow: jest.fn((key: string) => key) };
    service = new AuthService(prisma, jwt, config);
  });

  it('rotates the token and returns a replacement pair', async () => {
    const result = await service.refresh('old-refresh-token-value');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('new-access');
    expect(result.refreshToken).toBe('new-refresh');
    expect(result.user.id).toBe(user.id);
  });

  it('rejects an invalid token use', async () => {
    jwt.verifyAsync.mockResolvedValueOnce({ sub: user.id, tokenUse: 'access' });
    await expect(service.refresh('old-refresh-token-value')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects replay when conditional revoke updates zero rows', async () => {
    prisma.$transaction.mockImplementationOnce(async (callback: any) => callback({
      refreshSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn(),
      },
    }));
    await expect(service.refresh('old-refresh-token-value')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not persist replacement when transaction fails', async () => {
    prisma.$transaction.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.refresh('old-refresh-token-value')).rejects.toThrow('database unavailable');
  });
});
