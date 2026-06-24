import type EventEmitter from 'node:events';
import { LockState } from '../enums/LockState.js';
import { IScanner } from './IScanner.js';
import { IScannerSession } from './IScannerSession.js';

export interface IScannerSessionManager extends EventEmitter {
  get sessions(): IScannerSession[];
  requestSession(
    scanner: IScanner,
    lockState: LockState,
    timeout?: number,
    signal?: AbortSignal,
  ): IScannerSession;

  abortSession(sessionId: string): void;
  abortSessionsByScanner(scannerId: string): void;
  abortAll(): void;
}
