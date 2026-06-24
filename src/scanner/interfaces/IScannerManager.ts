import type EventEmitter from 'events';
import { LockState } from '../enums/LockState.js';
import { ScanResult } from '../types/ScanResult.js';
import { IScanner } from './IScanner.js';

export interface IScannerManager extends EventEmitter {
  get scanners(): IScanner[];
  init(): Promise<void>;
  refreshScanners(): Promise<void>;
  startScan(
    scannerId: string,
    lockState?: LockState,
    timeout?: number,
    signal?: AbortSignal,
  ): Promise<ScanResult>;
  stopScan(scannerId: string): void;
}
