import { Controller, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { canIssueCertificate } from '../common/roles';

@Controller('certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  @Post()
  @Roles('HIGH_MANAGEMENT', 'QUALITY', 'OPERATIONS_MANAGEMENT', 'MARKETING_MANAGEMENT')
  create(@Req() req: any) {
    if (!canIssueCertificate(req.user.role)) throw new ForbiddenException();
    return { status: 'NOT_IMPLEMENTED', message: 'El flujo PDF se integrará en la etapa de certificados.' };
  }
}
