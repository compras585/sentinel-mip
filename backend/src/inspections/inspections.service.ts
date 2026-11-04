import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateInspectionDto } from './create-inspection.dto';
import { isStationUuid } from './station-key';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInspectionDto, actor: { sub: string; role: string; tenantId: string }) {
    if (!actor?.sub || !actor?.tenantId || !['TECHNICIAN', 'ADMIN', 'HIGH_MANAGEMENT', 'QUALITY', 'OPERATIONS_MANAGEMENT', 'MARKETING_MANAGEMENT'].includes(actor.role)) {
      throw new ForbiddenException();
    }

    // Prisma UUID columns reject non-UUID strings before OR can match station.code.
    const isUuid = isStationUuid(dto.stationKey);
    const station = await this.prisma.station.findFirst({
      where: {
        active: true,
        establishment: { tenantId: actor.tenantId },
        ...(isUuid ? { id: dto.stationKey } : { code: dto.stationKey }),
      },
      select: { id: true },
    });
    if (!station) throw new NotFoundException('Estación no encontrada');

    const uniqueWhere = {
      technicianId_clientMutationId: {
        technicianId: actor.sub,
        clientMutationId: dto.clientMutationId,
      },
    };
    const existing = await this.prisma.inspection.findUnique({ where: uniqueWhere });
    if (existing) return existing;

    try {
      return await this.prisma.inspection.create({
        data: {
          stationId: station.id,
          technicianId: actor.sub,
          clientMutationId: dto.clientMutationId,
          pestType: dto.pestType,
          activity: dto.activity,
          quantity: dto.quantity,
          stationCondition: dto.stationCondition,
          actionsTaken: dto.actionsTaken,
          observations: dto.observations,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const recovered = await this.prisma.inspection.findUnique({ where: uniqueWhere });
        if (recovered) return recovered;
      }
      throw error;
    }
  }
}
