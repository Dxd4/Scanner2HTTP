import { plainToInstance } from 'class-transformer';
import { promises as fs } from 'fs';
import { merge } from 'lodash-es';
import { validateOrReject } from 'class-validator';
import { IConfigs } from './interfaces/IConfigs.js';
import { ScannerConfig } from './models/scanner/ScannerConfig.js';
import { WhiteList } from './models/WhiteList.js';

export class Configs implements IConfigs {
  private configsFilepath: string;
  private whitelistFilePath: string;
  private scannerConfigs: ScannerConfig[] = [];
  private whiteList: WhiteList[] = [];

  constructor(
    configsFilepath: string = 'configs.json',
    whitelistFilePath: string = 'whitelist.json',
  ) {
    this.configsFilepath = configsFilepath;
    this.whitelistFilePath = whitelistFilePath;
  }

  async init() {
    await this.loadScannerConfigs();
    await this.loadWhiteList();
  }

  private async loadScannerConfigs() {
    const rawText = await fs.readFile(this.configsFilepath, 'utf-8');
    const parsed: unknown = JSON.parse(rawText);
    const rawArray = Array.isArray(parsed) ? parsed : [];

    const instances = plainToInstance(ScannerConfig, rawArray, {
      excludeExtraneousValues: true,
    });

    try {
      await Promise.all(instances.map((item) => validateOrReject(item)));
    } catch (errors) {
      throw new Error(`${this.configsFilepath} validation failed`, {
        cause: errors,
      });
    }

    this.scannerConfigs = instances;
  }

  private async saveScannerConfigs(scannerConfigs?: ScannerConfig[]) {
    if (scannerConfigs) {
      this.scannerConfigs = scannerConfigs;
    }
    const json = JSON.stringify(this.scannerConfigs, null, 2);
    await fs.writeFile(this.configsFilepath, json, 'utf-8');
  }

  private getScannerByInfo(
    vendorId?: string,
    productId?: string,
    serialNumber?: string,
  ) {
    const result = this.scannerConfigs.find(
      (s) =>
        s.vendorId === vendorId &&
        s.productId === productId &&
        s.serialNumber === serialNumber,
    );
    return result;
  }

  getScannerConfig(
    vendorId?: string,
    productId?: string,
    serialNumber?: string,
  ) {
    const defaultConfig = {
      vendorId: vendorId,
      productId: productId,
      serialNumber: serialNumber,
      openOptions: { baudRate: 115200 },
      parserOptions: { regex: '(\r\n|\r|\n)$' },
    } as ScannerConfig;

    const merged = merge(
      defaultConfig,
      this.getScannerByInfo(vendorId),
      this.getScannerByInfo(vendorId, productId),
      this.getScannerByInfo(vendorId, productId, serialNumber),
    );

    return merged;
  }

  private async loadWhiteList() {
    const rawText = await fs.readFile(this.whitelistFilePath, 'utf-8');
    const parsed: unknown = JSON.parse(rawText);
    const rawArray = Array.isArray(parsed) ? parsed : [];

    const instances = plainToInstance(WhiteList, rawArray, {
      excludeExtraneousValues: true,
    });

    try {
      await Promise.all(instances.map((item) => validateOrReject(item)));
    } catch (errors) {
      throw new Error(`${this.whitelistFilePath} validation failed`, {
        cause: errors,
      });
    }

    this.whiteList = instances;
  }

  private async saveWhiteList(whiteList?: WhiteList[]) {
    if (whiteList) {
      this.whiteList = whiteList;
    }
    const json = JSON.stringify(this.whiteList, null, 2);
    await fs.writeFile(this.whitelistFilePath, json, 'utf-8');
  }

  isWhiteListed(vendorId?: string, productId?: string, serialNumber?: string) {
    if (
      this.whiteList.find(
        (wl) =>
          wl.vendorId === vendorId &&
          (wl.productId === productId || wl.productId === undefined) &&
          (wl.serialNumber === serialNumber || wl.serialNumber === undefined),
      )
    ) {
      return true;
    }
    return false;
  }
}
