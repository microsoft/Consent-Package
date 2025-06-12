// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { ConsentRecord } from './ConsentRecord.type.js';

// Input for the very first creation of a consent for a subject+policy
export type CreateInitialConsentInput = Omit<
  ConsentRecord,
  'id' | 'createdAt' | 'updatedAt' | 'version'
>;

// Input for creating a new version of an existing consent (e.g. for revocation, scope change)
// subjectId and policyId will be copied from the old record.
// version will be incremented by the adapter.
export type CreateNextConsentVersionInput = Omit<
  ConsentRecord,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'version'
  | 'subjectId'
  | 'policyId'
  | 'dateOfBirth'
>;

export interface IConsentDataAdapter {
  createConsent(
    data: Omit<ConsentRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ConsentRecord>;

  updateConsentStatus(
    id: string,
    status: ConsentRecord['status'],
    expectedVersion: number,
  ): Promise<ConsentRecord>;

  findConsentById(id: string): Promise<ConsentRecord | null>;
  findConsentsBySubject(subjectId: string): Promise<ConsentRecord[]>;

  findLatestConsentBySubjectAndPolicy(
    subjectId: string,
    policyId: string,
  ): Promise<ConsentRecord | null>;

  findAllConsentVersionsBySubjectAndPolicy(
    subjectId: string,
    policyId: string,
  ): Promise<ConsentRecord[]>;

  getAllConsents(): Promise<ConsentRecord[]>;

  getConsentsByProxyId(proxyId: string): Promise<ConsentRecord[]>;
}
