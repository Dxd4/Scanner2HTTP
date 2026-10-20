export type ScannerPortInfo = {
  path: string;
  manufacturer?: string | undefined;
  serialNumber?: string | undefined;
  vendorId?: string | undefined;
  productId?: string | undefined;
  pnpId?: string | undefined;
  /** Port has all identifiers required to build a stable scanner id. */
  valid: boolean;
  /** Device matches an entry in whitelist.json. */
  whitelisted: boolean;
  /** Device matches an entry in configs.json. */
  configured: boolean;
};
