import EventEmitter from 'events';
import { SerialPort } from 'serialport';
import AsyncLock from 'async-lock';
import type { PortInfo } from '@serialport/bindings-cpp';
import { NotFoundError } from '../errors/NotFoundError.js';
import { LockState } from './enums/LockState.js';
import { IConfigs } from './interfaces/IConfigs.js';
import { IScanner } from './interfaces/IScanner.js';
import { IScannerFactory } from './interfaces/IScannerFactory.js';
import { IScannerManager } from './interfaces/IScannerManager.js';
import { IScannerSessionManager } from './interfaces/IScannerSessionManager.js';
import { IScannerSessionManagerFactory } from './interfaces/IScannerSessionManagerFactory.js';
import { Scanner } from './Scanner.js';
import { ScannerSessionManager } from './ScannerSessionManager.js';
import { ScanResult } from './types/ScanResult.js';
import { generateScannerIdFromPort } from './utils/scanner-id.js';

export class ScannerManager extends EventEmitter implements IScannerManager {
  private scannersMap = new Map<string, IScanner>();
  private sessionManager: IScannerSessionManager;
  private refreshLock = new AsyncLock();
  // Delayed scanner connection close
  private closeTimers = new Map<string, NodeJS.Timeout>();
  private readonly CLOSE_DELAY_MS = 500;

  constructor(
    private configs: IConfigs,
    private scannerFactory: IScannerFactory = {
      create: (id, port, config) => new Scanner(id, port, config),
    },
    private scannerSessionManagerFactory: IScannerSessionManagerFactory = {
      create: () => new ScannerSessionManager(),
    },
  ) {
    super();
    this.configs = configs;

    this.sessionManager = this.scannerSessionManagerFactory.create();
    this.sessionManager.on('lastSessionRemoved', (scannerId: string) => {
      const scanner = this.getScanner(scannerId);
      if (scanner && scanner.isOpened) {
        this.scheduleClose(scanner.id);
      }
    });
  }

  async init() {
    await this.configs.init();
    await this.refreshScanners();
    setInterval(() => {
      void this.refreshScanners();
    }, 5 * 1000);
  }

  get scanners() {
    return Array.from(this.scannersMap.values());
  }
  private addScannerByPort(port: PortInfo): void {
    const scannerId = generateScannerIdFromPort(port);
    const scannerConfig = this.configs.getScannerConfig(
      port.vendorId,
      port.productId,
      port.serialNumber,
    );
    const scanner = this.scannerFactory.create(scannerId, port, scannerConfig);
    this.addScanner(scanner);
  }
  private addScanner(scanner: IScanner): void {
    this.scannersMap.set(scanner.id, scanner);
  }
  private async removeScanner(id: string): Promise<void> {
    const scanner = this.getScanner(id);
    this.sessionManager.abortSessionsByScanner(id);
    if (scanner?.isOpened) await scanner.closeConnection();
    this.cancelClose(id);
    this.scannersMap.delete(id);
  }
  private getScanner(id: string): IScanner | undefined {
    return this.scannersMap.get(id);
  }
  async startScan(
    scannerId: string,
    lockState: LockState = LockState.ON_DEMAND,
    timeout?: number,
    signal?: AbortSignal,
  ): Promise<ScanResult> {
    const scanner = this.getScanner(scannerId);
    if (!scanner)
      throw new NotFoundError(`Not found scanner with id: ${scannerId}`);
    if (!scanner.isOpened) await scanner.openConnection();

    this.cancelClose(scannerId);

    const sessionPromise = this.sessionManager.requestSession(
      scanner,
      lockState,
      timeout,
      signal,
    );

    return sessionPromise.promise;
  }
  stopScan(scannerId: string): void {
    const scanner = this.getScanner(scannerId);
    if (!scanner)
      throw new NotFoundError(`Not found scanner with id: ${scannerId}`);

    this.sessionManager.abortSessionsByScanner(scannerId);
  }
  stopSession(id: string): void {
    this.sessionManager.abortSession(id);
  }
  async refreshScanners() {
    await this.refreshLock.acquire('refreshScanners', async () => {
      const portList = await SerialPort.list();
      for (const port of portList) {
        if (
          !this.isValidPort(port) ||
          !this.configs.isWhiteListed(
            port.vendorId,
            port.productId,
            port.serialNumber,
          )
        )
          continue;
        const exists = this.scanners.some(
          (s) => s.portInfo.pnpId === port.pnpId,
        );
        if (!exists) {
          this.addScannerByPort(port);
        }
      }
      for (const scanner of this.scanners) {
        const exists = portList.some((p) => p.pnpId === scanner.portInfo.pnpId);
        if (
          !exists ||
          !this.isValidPort(scanner.portInfo) ||
          !this.configs.isWhiteListed(
            scanner.config.vendorId,
            scanner.config.productId,
            scanner.config.serialNumber,
          )
        ) {
          await this.removeScanner(scanner.id);
        }
      }
    });
  }
  private isValidPort(port: PortInfo) {
    if (!port.vendorId || !port.productId || !port.serialNumber || !port.pnpId)
      return false;
    return true;
  }
  private cancelClose(scannerId: string) {
    const timer = this.closeTimers.get(scannerId);
    if (timer) {
      clearTimeout(timer);
      this.closeTimers.delete(scannerId);
    }
  }
  private scheduleClose(scannerId: string) {
    this.cancelClose(scannerId);

    const timer = setTimeout(() => {
      this.closeTimers.delete(scannerId);
      const scanner = this.getScanner(scannerId);
      if (scanner && scanner.isOpened) {
        void scanner.closeConnection();
      }
    }, this.CLOSE_DELAY_MS);

    this.closeTimers.set(scannerId, timer);
  }
  isScannerAlive(scannerId: string): boolean {
    const scanner = this.getScanner(scannerId);
    if (scanner) return true;
    return false;
  }
}
