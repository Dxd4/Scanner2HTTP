import { ScanResult } from '../types/ScanResult.js';

export interface IScannerOperation {
  promise: Promise<ScanResult>;
}
