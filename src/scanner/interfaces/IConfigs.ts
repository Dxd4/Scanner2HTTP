import { ScannerConfig } from '../models/scanner/ScannerConfig.js';

export interface IConfigs {
  init(): Promise<void>;
  getScannerConfig(
    vendorId?: string,
    productId?: string,
    serialNumber?: string,
  ): ScannerConfig;
  isWhiteListed(
    vendorId?: string,
    productId?: string,
    serialNumber?: string,
  ): boolean;
}
