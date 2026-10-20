import { v5 as uuidv5 } from 'uuid';
import type { PortInfo } from '@serialport/bindings-cpp';
import { getEnv } from '../../utils/env.js';

export function generateScannerIdFromPort(port: PortInfo): string {
  return uuidv5(port.pnpId ?? '-', getEnv().SCANNER_NAMESPACE);
}
