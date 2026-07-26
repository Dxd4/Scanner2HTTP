import type { PortInfo } from '@serialport/bindings-cpp';
import { IScanner } from './IScanner.js';
import { ScannerConfigType } from '../schemas/ConfigSchema.js';

export interface IScannerFactory {
  create(id: string, port: PortInfo, config: ScannerConfigType): IScanner;
}
