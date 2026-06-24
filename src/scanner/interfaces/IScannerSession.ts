import type EventEmitter from 'events';
import { LockState } from '../enums/LockState.js';
import { ScanResult } from '../types/ScanResult.js';
import { IScanner } from './IScanner.js';

export interface IScannerSession extends EventEmitter {
  readonly id: string;
  readonly lockState: LockState;
  readonly promise: Promise<ScanResult>;
  readonly scanner: IScanner;

  close(): void;
  setBlock(sessionId: string): void;
  getBlock(): string | undefined;
  removeBlock(): void;
}
