import { IScannerSessionManager } from './IScannerSessionManager.js';

export interface IScannerSessionManagerFactory {
  create(): IScannerSessionManager;
}
