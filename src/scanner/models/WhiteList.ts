import { IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class WhiteList {
  @Expose()
  @IsOptional()
  @IsString()
  vendorId?: string;

  @Expose()
  @IsOptional()
  @IsString()
  productId?: string;

  @Expose()
  @IsOptional()
  @IsString()
  serialNumber?: string;
}
