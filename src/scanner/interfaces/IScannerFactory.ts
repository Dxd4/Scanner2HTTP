import type { PortInfo } from '@serialport/bindings-cpp';
import { ScannerConfig } from '../models/scanner/ScannerConfig.js';
import { IScanner } from './IScanner.js';

export interface IScannerFactory {
  create(id: string, port: PortInfo, config: ScannerConfig): IScanner;
}
