import { v5 as uuidv5 } from 'uuid';
import type { PortInfo } from '@serialport/bindings-cpp';
import 'dotenv/config';

const SCANNER_NAMESPACE = process.env.SCANNER_NAMESPACE;

export function generateScannerIdFromPort(port: PortInfo): string {
  if (!SCANNER_NAMESPACE) {
    throw new Error('SCANNER_NAMESPACE is not defined in .env file');
  }
  return uuidv5(port.pnpId ?? '-', SCANNER_NAMESPACE);
}
