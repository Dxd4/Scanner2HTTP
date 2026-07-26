import { ScannerConfigType } from '../schemas/ConfigSchema.js';

export interface IConfigs {
  init(): Promise<void>;
  getScannerConfig(
    vendorId?: string,
    productId?: string,
    serialNumber?: string,
  ): ScannerConfigType;
  isWhiteListed(
    vendorId?: string,
    productId?: string,
    serialNumber?: string,
  ): boolean;
}
