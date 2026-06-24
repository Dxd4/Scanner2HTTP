import EventEmitter from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { IScannerSessionManager } from './interfaces/IScannerSessionManager.js';
import { LockState } from './enums/LockState.js';
import { IScanner } from './interfaces/IScanner.js';
import { IScannerSession } from './interfaces/IScannerSession.js';
import { IScannerSessionFactory } from './interfaces/IScannerSessionFactory.js';
import { ScannerSession } from './ScannerSession.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import { SessionError } from '../errors/SessionError.js';

export class ScannerSessionManager
  extends EventEmitter
  implements IScannerSessionManager
{
  private sessionsMap = new Map<string, IScannerSession>();

  constructor(
    private scannerSessionFactory: IScannerSessionFactory = {
      create: (i: string, s: IScanner, ls: LockState, t: number) =>
        new ScannerSession(i, s, ls, t),
    },
  ) {
    super();
  }

  requestSession(
    scanner: IScanner,
    lockState: LockState,
    timeout: number = 5000,
    signal?: AbortSignal,
  ): IScannerSession {
    const sessionId = uuidv4();
    this.assertCanCreateSession(scanner.id, lockState, sessionId);
    const session = this.scannerSessionFactory.create(
      sessionId,
      scanner,
      lockState,
      timeout,
    );
    this.addSession(session);

    let abortHandler: (() => void) | undefined;

    if (signal) {
      abortHandler = () => {
        session.close();
      };
      signal.addEventListener('abort', abortHandler);
    }

    void session.promise
      .catch(() => {})
      .finally(() => {
        if (abortHandler && signal) {
          signal.removeEventListener('abort', abortHandler);
        }
        this.removeSession(session.id);
      });

    return session;
  }
  get sessions() {
    return Array.from(this.sessionsMap.values());
  }
  private addSession(session: IScannerSession): void {
    this.sessionsMap.set(session.id, session);
  }
  private getSession(sessionId: string): IScannerSession {
    const session = this.sessionsMap.get(sessionId);
    if (!session) throw new NotFoundError('Session not found');
    return session;
  }
  private removeSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    this.unlockChildSessions(session.id);
    this.isLastSessionRemoved(session.scanner.id);
    this.sessionsMap.delete(session.id);
  }
  abortSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    session.close();
  }
  abortAll(): void {
    for (const session of this.sessionsMap.values()) {
      this.abortSession(session.id);
    }
  }
  abortSessionsByScanner(scannerId: string): void {
    for (const session of this.sessionsMap.values()) {
      if (session.scanner.id === scannerId) {
        this.abortSession(session.id);
      }
    }
  }
  private isLastSessionRemoved(scannerId: string) {
    const count = this.sessions.filter(
      (s) => s.scanner.id === scannerId,
    ).length;
    if (count <= 1) {
      this.emit('lastSessionRemoved', scannerId);
    }
  }
  private assertCanCreateSession(
    scannerId: string,
    lockState: LockState,
    newSessionId: string,
  ) {
    const scannerSessions = this.sessions.filter(
      (s) => s.scanner.id === scannerId,
    );
    const hasPermanent = scannerSessions.some(
      (s) => s.lockState === LockState.PERMANENT,
    );
    if (hasPermanent) {
      throw new SessionError(
        'Cannot create new session while permanent session exists',
      );
    }

    switch (lockState) {
      case LockState.PERMANENT: {
        const sessionsToClose = scannerSessions.filter(
          (s) => s.lockState !== LockState.DAEMON,
        );
        for (const session of sessionsToClose) {
          this.abortSession(session.id);
        }
        this.lockDaemonSessions(scannerId, newSessionId);
        break;
      }
      case LockState.ON_DEMAND: {
        const sessionsToClose = scannerSessions.filter(
          (s) =>
            s.lockState === LockState.ON_DEMAND ||
            s.lockState === LockState.PARALLEL,
        );
        for (const session of sessionsToClose) {
          this.abortSession(session.id);
        }
        this.lockDaemonSessions(scannerId, newSessionId);
        break;
      }
      case LockState.PARALLEL: {
        const hasOnDemand = scannerSessions.some(
          (s) => s.lockState === LockState.ON_DEMAND,
        );
        if (hasOnDemand) {
          throw new SessionError(
            'Cannot create parallel session while on_demand session exists',
          );
        }
        break;
      }
      case LockState.DAEMON: {
        break;
      }
    }
  }
  private unlockChildSessions(blockingSessionId: string) {
    const blockingSession = this.getSession(blockingSessionId);
    for (const session of this.sessions) {
      if (session.getBlock() === blockingSession.id) {
        session.removeBlock();
      }
    }
  }
  private lockDaemonSessions(scannerId: string, blockingSessionId: string) {
    for (const session of this.sessions) {
      if (
        session.scanner.id === scannerId &&
        session.lockState === LockState.DAEMON
      ) {
        session.setBlock(blockingSessionId);
      }
    }
  }
}
