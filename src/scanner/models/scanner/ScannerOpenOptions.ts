import { Expose } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional } from 'class-validator';

export class ScannerOpenOptions {
  @Expose()
  @IsNumber()
  baudRate!: number;

  @Expose()
  @IsOptional()
  @IsIn(['none', 'even', 'odd'])
  parity?: 'none' | 'even' | 'odd';

  @Expose()
  @IsOptional()
  @IsIn([5, 6, 7, 8])
  dataBits?: 5 | 6 | 7 | 8;

  @Expose()
  @IsOptional()
  @IsBoolean()
  lock?: boolean;

  @Expose()
  @IsOptional()
  @IsIn([1, 1.5, 2])
  stopBits?: 1 | 1.5 | 2;

  @Expose()
  @IsOptional()
  @IsBoolean()
  rtscts?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  xon?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  xoff?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  xany?: boolean;

  @Expose()
  @IsOptional()
  @IsBoolean()
  hupcl?: boolean;
}
