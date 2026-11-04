import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateInspectionDto {
  @IsString() @MaxLength(80) stationKey!: string;
  @IsString() @MaxLength(100) clientMutationId!: string;
  @IsString() @MaxLength(120) pestType!: string;
  @IsString() @MaxLength(120) activity!: string;
  @IsInt() @Min(0) quantity!: number;
  @IsOptional() @IsString() @MaxLength(1000) stationCondition?: string;
  @IsOptional() @IsString() @MaxLength(2000) actionsTaken?: string;
  @IsOptional() @IsString() @MaxLength(4000) observations?: string;
}
