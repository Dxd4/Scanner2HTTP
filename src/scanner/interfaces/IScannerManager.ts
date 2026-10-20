import type EventEmitter from 'events';
import { LockState } from '../enums/LockState.js';
import { ScanResult } from '../types/ScanResult.js';
import { ScannerPortInfo } from '../types/ScannerPortInfo.js';
import { IScanner } from './IScanner.js';
import { IScannerSession } from './IScannerSession.js';

export interface IScannerManager extends EventEmitter {
  get scanners(): IScanner[];
  get sessions(): IScannerSession[];
  init(): Promise<void>;
  refreshScanners(): Promise<void>;
  listPorts(): Promise<ScannerPortInfo[]>;
  startScan(
    scannerId: string,
    lockState?: LockState,
    timeout?: number,
    signal?: AbortSignal,
  ): Promise<ScanResult>;
  stopScan(scannerId: string): void;
  stopSession(sessionId: string): void;
  isScannerAlive(scannerId: string): boolean;
}
