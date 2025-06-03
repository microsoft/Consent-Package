import { ConsentService, PolicyService } from '@open-source-consent/core';
import type {
  IDataAdapter,
  IPolicyDataAdapter,
  IConsentDataAdapter,
} from '@open-source-consent/types';

export const createPolicyService = (dataAdapter: IDataAdapter): PolicyService =>
  PolicyService.getInstance(dataAdapter as IPolicyDataAdapter);

export const createConsentService = (
  dataAdapter: IDataAdapter,
): ConsentService =>
  ConsentService.getInstance(dataAdapter as IConsentDataAdapter);
