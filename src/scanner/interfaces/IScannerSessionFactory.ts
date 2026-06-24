import { LockState } from '../enums/LockState.js';
import { IScanner } from './IScanner.js';
import { IScannerSession } from './IScannerSession.js';

export interface IScannerSessionFactory {
  create(
    id: string,
    scanner: IScanner,
    lockState: LockState,
    timeout: number,
  ): IScannerSession;
}
