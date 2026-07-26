import { promises as fs } from 'fs';
import { merge } from 'lodash-es';
import { IConfigs } from './interfaces/IConfigs.js';
import { ScannerConfigType, WhiteListType } from './schemas/ConfigSchema.js';
import { logger } from '../utils/logger.js';
import {
  ScannerConfigSchema,
  WhiteListSchema,
} from './schemas/ConfigSchema.js';
import z from 'zod';

export class Configs implements IConfigs {
  private configsFilepath: string;
  private whitelistFilePath: string;
  private scannerConfigs: ScannerConfigType[] = [];
  private whiteList: WhiteListType[] = [];

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
    try {
      const rawText = await fs.readFile(this.configsFilepath, 'utf-8');
      const parsed: unknown = JSON.parse(rawText);
      const rawArray = Array.isArray(parsed) ? parsed : [];

      this.scannerConfigs = z.array(ScannerConfigSchema).parse(rawArray);
      logger.info(
        { count: this.scannerConfigs.length },
        'Scanner configurations loaded successfully',
      );
    } catch (error) {
      logger.error(
        { error, filepath: this.configsFilepath },
        'Scanner configurations validation failed',
      );
      throw new Error(`${this.configsFilepath} validation failed`, {
        cause: error,
      });
    }
  }

  private async saveScannerConfigs(scannerConfigs?: ScannerConfigType[]) {
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
  ): ScannerConfigType {
    const defaultConfig = {
      vendorId: vendorId,
      productId: productId,
      serialNumber: serialNumber,
      openOptions: { baudRate: 115200 },
      parserOptions: { regex: '(\r\n|\r|\n)$' },
    };

    const merged = merge(
      defaultConfig,
      this.getScannerByInfo(vendorId),
      this.getScannerByInfo(vendorId, productId),
      this.getScannerByInfo(vendorId, productId, serialNumber),
    );

    return merged;
  }

  private async loadWhiteList() {
    try {
      const rawText = await fs.readFile(this.whitelistFilePath, 'utf-8');
      const parsed: unknown = JSON.parse(rawText);
      const rawArray = Array.isArray(parsed) ? parsed : [];

      this.whiteList = z.array(WhiteListSchema).parse(rawArray);
      logger.info(
        { count: this.whiteList.length },
        'Whitelist loaded successfully',
      );
    } catch (error) {
      logger.error(
        { error, filepath: this.whitelistFilePath },
        'Whitelist validation failed',
      );
      throw new Error(`${this.whitelistFilePath} validation failed`, {
        cause: error,
      });
    }
  }

  private async saveWhiteList(whiteList?: WhiteListType[]) {
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
