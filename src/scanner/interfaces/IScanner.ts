import type EventEmitter from 'events';
import type { PortInfo } from '@serialport/bindings-cpp';
import { ScannerConfigType } from '../schemas/ConfigSchema.js';

export interface IScanner extends EventEmitter {
  readonly id: string;
  readonly config: ScannerConfigType;
  readonly portInfo: PortInfo;

  openConnection(): Promise<void>;
  closeConnection(): Promise<void>;
  get isOpened(): boolean;
}
