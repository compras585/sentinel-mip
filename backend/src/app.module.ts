import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { HealthController } from './health/health.controller';
import { InspectionsController } from './inspections/inspections.controller';
import { InspectionsService } from './inspections/inspections.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { CertificatesController } from './certificates/certificates.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_ACCESS_SECRET') }),
    }),
  ],
  controllers: [HealthController, AuthController, UsersController, InspectionsController, CertificatesController],
  providers: [PrismaService, InspectionsService, AuthService, UsersService, JwtAuthGuard, RolesGuard],
})
export class AppModule {}
