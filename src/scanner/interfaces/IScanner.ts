import type EventEmitter from 'events';
import type { PortInfo } from '@serialport/bindings-cpp';
import { ScannerConfig } from '../models/scanner/ScannerConfig.js';

export interface IScanner extends EventEmitter {
  readonly id: string;
  readonly config: ScannerConfig;
  readonly portInfo: PortInfo;

  openConnection(): Promise<void>;
  closeConnection(): Promise<void>;
  get isOpened(): boolean;
}
