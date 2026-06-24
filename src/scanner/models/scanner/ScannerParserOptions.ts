import { Expose } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';

export class ScannerParserOptions {
  @Expose()
  @IsString()
  regex!: string;

  @Expose()
  @IsOptional()
  @IsString()
  encoding?: BufferEncoding;
}
