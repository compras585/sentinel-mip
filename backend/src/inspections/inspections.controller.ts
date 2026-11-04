import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateInspectionDto } from './create-inspection.dto';
import { InspectionsService } from './inspections.service';

@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TECHNICIAN', 'ADMIN', 'HIGH_MANAGEMENT', 'QUALITY', 'OPERATIONS_MANAGEMENT', 'MARKETING_MANAGEMENT')
export class InspectionsController {
  constructor(private readonly service: InspectionsService) {}
  @Post()
  create(@Body() dto: CreateInspectionDto, @Req() req: any) {
    return this.service.create(dto, req.user);
  }
}
