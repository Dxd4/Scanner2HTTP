import { RegexParser, SerialPort } from 'serialport';
import type { AutoDetectTypes, PortInfo } from '@serialport/bindings-cpp';
import EventEmitter from 'events';
import AsyncLock from 'async-lock';
import { SerialError } from '../errors/SerialError.js';
import { IScanner } from './interfaces/IScanner.js';
import { ScannerConfig } from './models/scanner/ScannerConfig.js';

export class Scanner extends EventEmitter implements IScanner {
  readonly id: string;
  readonly config: ScannerConfig;
  readonly portInfo: PortInfo;
  private serialPort: SerialPort<AutoDetectTypes> | undefined;
  private serialParser: RegexParser | undefined;
  private lock = new AsyncLock();

  constructor(id: string, port: PortInfo, config: ScannerConfig) {
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
        console.debug('Scanned:', data.toString());
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
      ...this.config.openOptions,
    });
    const parser = serialPort.pipe(new RegexParser(this.config.parserOptions));
    return { serialPort, parser };
  }
}
