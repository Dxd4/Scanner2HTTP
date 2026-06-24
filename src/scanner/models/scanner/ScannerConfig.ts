import { Expose, Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { ScannerOpenOptions } from './ScannerOpenOptions.js';
import { ScannerParserOptions } from './ScannerParserOptions.js';

export class ScannerConfig {
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

  @Expose()
  @ValidateNested()
  @Type(() => ScannerOpenOptions)
  openOptions!: ScannerOpenOptions;

  @Expose()
  @ValidateNested()
  @Type(() => ScannerParserOptions)
  parserOptions!: ScannerParserOptions;
}
