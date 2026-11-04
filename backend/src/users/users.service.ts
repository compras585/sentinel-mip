import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createForTenant(dto: CreateUserDto, tenantId: string) {
    const email = dto.email.toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('El correo ya está registrado');
    const passwordHash = await bcrypt.hash(dto.temporaryPassword, 12);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, role: dto.role, tenantId },
      select: { id: true, email: true, role: true, tenantId: true, active: true, createdAt: true },
    });
    return user;
  }

  async adminResetPassword(userId: string, tenantId: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.refreshSession.updateMany({
        where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() },
      }),
    ]);
    return { id: user.id, passwordReset: true };
  }
}
