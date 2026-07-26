import { EventEmitter } from 'events';
import { IScannerSession } from './interfaces/IScannerSession.js';
import { AbortError } from '../errors/AbortError.js';
import { TimeoutError } from '../errors/TimeoutError.js';
import { LockState } from './enums/LockState.js';
import { IScanner } from './interfaces/IScanner.js';
import { ScanResult } from './types/ScanResult.js';

export class ScannerSession extends EventEmitter implements IScannerSession {
  readonly id: string;
  readonly lockState: LockState;
  readonly promise: Promise<ScanResult>;
  readonly scanner: IScanner;
  private readonly abortController: AbortController;
  private blockedBy: string | undefined;

  constructor(
    id: string,
    scanner: IScanner,
    lockState: LockState,
    timeout: number,
  ) {
    super();
    this.id = id;
    this.lockState = lockState;
    this.abortController = new AbortController();
    this.scanner = scanner;
    this.promise = this.createSessionPromise(
      scanner,
      this.abortController,
      timeout,
    );
  }
  private createSessionPromise(
    scanner: IScanner,
    abortController: AbortController,
    timeout: number,
  ): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      const onData = (data: Buffer) => {
        if (this.blockedBy !== undefined) return;
        cleanup();
        resolve({
          status: 'success',
          data: data.toString('utf-8'),
        });
      };

      function onError(err: Error) {
        cleanup();
        reject(err);
      }

      function onAbort() {
        cleanup();
        reject(new AbortError(`Session aborted`));
      }

      const timeoutTimer = setTimeout(() => {
        cleanup();
        reject(new TimeoutError(`Timeout: ${timeout}ms`));
      }, timeout);

      function cleanup() {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        scanner.off('data', onData);
        scanner.off('error', onError);
        abortController.signal.removeEventListener('abort', onAbort);
      }

      this.scanner.on('data', onData);
      this.scanner.on('error', onError);

      this.abortController.signal.addEventListener('abort', onAbort);
    });
  }
  close(): void {
    this.abortController.abort();
  }
  setBlock(sessionId: string): void {
    this.blockedBy = sessionId;
  }
  getBlock(): string | undefined {
    return this.blockedBy;
  }
  removeBlock(): void {
    this.blockedBy = undefined;
  }
}
