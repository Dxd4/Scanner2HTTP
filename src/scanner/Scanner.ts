import type { AutoDetectTypes, PortInfo } from '@serialport/bindings-cpp';
import AsyncLock from 'async-lock';
import EventEmitter from 'events';
import { RegexParser, SerialPort } from 'serialport';
import { SerialError } from '../errors/SerialError.js';
import { logger } from '../utils/logger.js';
import { IScanner } from './interfaces/IScanner.js';
import { ScannerConfigType } from './schemas/ConfigSchema.js';

type StripUndefined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K];
};

function stripUndefined<T extends object>(obj: T): StripUndefined<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as StripUndefined<T>;
}

export class Scanner extends EventEmitter implements IScanner {
  readonly id: string;
  readonly config: ScannerConfigType;
  readonly portInfo: PortInfo;
  private serialPort: SerialPort<AutoDetectTypes> | undefined;
  private serialParser: RegexParser | undefined;
  private lock = new AsyncLock();

  constructor(id: string, port: PortInfo, config: ScannerConfigType) {
    super();
    this.id = id;
    this.portInfo = port;
    this.config = config;
  }
  get isOpened(): boolean {
    return !!this.serialPort && this.serialPort.isOpen;
  }
  openConnection() {
    return this.lock.acquire('serialPort', () => {
      if (this.isOpened) {
        throw new SerialError('Port is already connected');
      }

      const { serialPort, parser } = this.openSerialPort();
      this.serialPort = serialPort;
      this.serialParser = parser;

      const onData = (data: Buffer) => {
        logger.debug({ data: data.toString() }, 'Scanned');
        this.emit('data', data);
      };

      parser.on('data', onData);
      serialPort.on('error', (err) => this.emit('error', err));
      serialPort.on('close', () => {
        this.serialPort = undefined;
        this.serialParser = undefined;
        this.emit('close');
      });
    });
  }

  closeConnection() {
    return this.lock.acquire('serialPort', async () => {
      if (!this.isOpened) {
        throw new SerialError('Port is already closed');
      }

      return new Promise<void>((resolve, reject) => {
        this.serialPort!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.serialPort = undefined;
            this.serialParser = undefined;
            resolve();
          }
        });
      });
    });
  }

  private openSerialPort() {
    if (!this.config)
      throw new SerialError('No options specified for this scanner');

    const serialPort = new SerialPort({
      path: this.portInfo.path,
      ...stripUndefined(this.config.openOptions),
    });
    const parser = serialPort.pipe(
      new RegexParser(stripUndefined(this.config.parserOptions)),
    );
    return { serialPort, parser };
  }
}
