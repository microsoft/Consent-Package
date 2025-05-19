import type {
  IConsentDataAdapter,
  ConsentRecord,
  CreateNextConsentVersionInput,
  CreateConsentInput,
} from "@open-source-consent/types";
import { BaseService } from "./BaseService.js";

export class ConsentService extends BaseService<IConsentDataAdapter> {
  /**
   * Grants consent for a subject to a policy.
   * If an active consent already exists for this subject and policy, a new version is created superseding the old one.
   * Otherwise, a new initial consent record is created.
   */
  async grantConsent(input: CreateConsentInput): Promise<ConsentRecord> {
    const operationTimestamp = new Date();
    const inputGrantedScopesMap: Record<string, { grantedAt: Date }> = {};
    input.grantedScopes.forEach((scope) => {
      inputGrantedScopesMap[scope] = { grantedAt: operationTimestamp };
    });

    const latestConsentRecord =
      await this.adapter.findLatestConsentBySubjectAndPolicy(
        input.subjectId,
        input.policyId
      );

    if (latestConsentRecord?.status === "revoked") {
      throw new Error(
        `Consent record ${latestConsentRecord.id} for subject ${input.subjectId} and policy ${input.policyId} is revoked and cannot be granted again.`
      );
    }

    if (latestConsentRecord?.status === "superseded") {
      throw new Error(
        `Consent record ${latestConsentRecord.id} for subject ${input.subjectId} and policy ${input.policyId} is superseded. The latest active should never be superseded, investigate issues with the DB.`
      );
    }

    if (latestConsentRecord) {
      // Existing consent found, create a new version

      // Determine scopes that are effectively granted in this new operation
      const currentEffectiveGrantedScopes: Record<string, { grantedAt: Date }> =
        {};
      for (const scope of input.grantedScopes) {
        if (!latestConsentRecord.revokedScopes?.[scope]) {
          currentEffectiveGrantedScopes[scope] = {
            grantedAt: operationTimestamp,
          };
        }
      }

      const newStatus =
        Object.keys(currentEffectiveGrantedScopes).length > 0
          ? "granted"
          : "revoked";

      const newVersionRevokedScopes = {
        ...(latestConsentRecord.revokedScopes || {}),
      };

      if (newStatus === "revoked") {
        // If the new overall status is "revoked" (no effectively granted scopes in this input),
        // then any scopes that were granted in the previous version and not already explicitly revoked
        // should now be considered revoked as of this operation.
        Object.keys(latestConsentRecord.grantedScopes).forEach((scope) => {
          if (!newVersionRevokedScopes[scope]) {
            // If it was granted and not yet in our newVersionRevokedScopes
            newVersionRevokedScopes[scope] = { revokedAt: operationTimestamp };
          }
        });
      }

      const nextVersionData: CreateNextConsentVersionInput = {
        status: newStatus,
        consentedAt: latestConsentRecord.consentedAt,
        revokedAt: newStatus === "revoked" ? operationTimestamp : undefined,
        consenter: input.consenter,
        grantedScopes: currentEffectiveGrantedScopes,
        revokedScopes: newVersionRevokedScopes,
        metadata: {
          ...latestConsentRecord.metadata,
          ...input.metadata,
        },
      };
      return this.supersedeConsent(
        latestConsentRecord.id,
        nextVersionData,
        latestConsentRecord.version
      );
    } else {
      // No active consent found, create a new initial one
      const initialConsentData: Omit<
        ConsentRecord,
        "id" | "createdAt" | "updatedAt"
      > = {
        subjectId: input.subjectId,
        policyId: input.policyId,
        status: "granted",
        version: 1,
        consentedAt: operationTimestamp,
        consenter: input.consenter,
        grantedScopes: inputGrantedScopesMap,
        metadata: input.metadata,
      };
      return this.adapter.createConsent(initialConsentData);
    }
  }

  /**
   * Creates an initial consent grant directly without checking for existing consents.
   * Use this if you are certain no prior consent exists or want to force a new consent stream.
   */
  async createInitialGrant(input: CreateConsentInput): Promise<ConsentRecord> {
    const now = new Date();
    const grantedScopesMap: Record<string, { grantedAt: Date }> = {};
    input.grantedScopes.forEach((scope) => {
      grantedScopesMap[scope] = { grantedAt: now };
    });

    const initialConsentData: Omit<
      ConsentRecord,
      "id" | "createdAt" | "updatedAt"
    > = {
      subjectId: input.subjectId,
      policyId: input.policyId,
      status: "granted",
      version: 1,
      consentedAt: now,
      consenter: input.consenter,
      grantedScopes: grantedScopesMap,
      metadata: input.metadata,
    };
    return this.adapter.createConsent(initialConsentData);
  }

  /**
   * Supersedes an existing consent record with a new version.
   * This involves creating a new consent record and marking the old one as "superseded".
   */
  private async supersedeConsent(
    oldConsentRecordId: string,
    newConsentVersionInput: CreateNextConsentVersionInput,
    expectedOldVersion: number
  ): Promise<ConsentRecord> {
    const oldConsentRecord =
      await this.adapter.findConsentById(oldConsentRecordId);

    if (!oldConsentRecord) {
      throw new Error(
        `Consent record with ID ${oldConsentRecordId} not found to supersede.`
      );
    }

    if (oldConsentRecord.version !== expectedOldVersion) {
      throw new Error(
        `Optimistic concurrency check failed for consent ${oldConsentRecordId}. Expected version ${expectedOldVersion}, found ${oldConsentRecord.version}.`
      );
    }

    if (oldConsentRecord.status === "superseded") {
      throw new Error(
        `Consent record ${oldConsentRecordId} has already been superseded.`
      );
    }
    if (
      oldConsentRecord.status === "revoked" &&
      newConsentVersionInput.status !== "revoked"
    ) {
      throw new Error(
        `Cannot supersede a 'revoked' consent record (${oldConsentRecordId}) with a non-revoked status. Revoked consents are terminal.`
      );
    }

    const newVersionNumber = oldConsentRecord.version + 1;

    // Prepare data for the new consent version record
    const newConsentRecordData: Omit<
      ConsentRecord,
      "id" | "createdAt" | "updatedAt"
    > = {
      subjectId: oldConsentRecord.subjectId,
      policyId: oldConsentRecord.policyId,
      version: newVersionNumber, // Set the incremented version
      status: newConsentVersionInput.status,
      consentedAt: newConsentVersionInput.consentedAt,
      revokedAt: newConsentVersionInput.revokedAt,
      consenter: newConsentVersionInput.consenter,
      grantedScopes: newConsentVersionInput.grantedScopes,
      revokedScopes: newConsentVersionInput.revokedScopes,
      metadata: newConsentVersionInput.metadata,
    };

    // Create the new consent version using the generic createConsent
    const newConsentRecord =
      await this.adapter.createConsent(newConsentRecordData);

    // Mark the old consent record as "superseded"
    await this.adapter.updateConsentStatus(
      oldConsentRecord.id,
      "superseded",
      oldConsentRecord.version
    );

    return newConsentRecord;
  }

  async getConsentDetails(consentId: string): Promise<ConsentRecord | null> {
    return this.adapter.findConsentById(consentId);
  }

  async getSubjectConsentStatus(
    subjectId: string,
    scopes: string[],
    policyId?: string
  ): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    scopes.forEach((s) => (status[s] = false));

    if (policyId) {
      const latestConsent =
        await this.adapter.findLatestConsentBySubjectAndPolicy(
          subjectId,
          policyId
        );
      if (latestConsent && latestConsent.status === "granted") {
        for (const scope of scopes) {
          if (
            latestConsent.grantedScopes[scope] &&
            !latestConsent.revokedScopes?.[scope]
          ) {
            status[scope] = true;
          }
        }
      }
    } else {
      const subjectConsents =
        await this.adapter.findConsentsBySubject(subjectId);
      for (const consent of subjectConsents) {
        if (consent.status === "granted") {
          for (const scope of scopes) {
            if (status[scope]) continue;
            if (
              consent.grantedScopes[scope] &&
              !consent.revokedScopes?.[scope]
            ) {
              status[scope] = true;
            }
          }
        }
      }
    }
    return status;
  }

  async getLatestConsentForSubjectAndPolicy(
    subjectId: string,
    policyId: string
  ): Promise<ConsentRecord | null> {
    return this.adapter.findLatestConsentBySubjectAndPolicy(
      subjectId,
      policyId
    );
  }

  async getAllConsentVersionsForSubjectAndPolicy(
    subjectId: string,
    policyId: string
  ): Promise<ConsentRecord[]> {
    return this.adapter.findAllConsentVersionsBySubjectAndPolicy(
      subjectId,
      policyId
    );
  }

  async getLatestConsentVersionsForSubject(
    subjectId: string
  ): Promise<ConsentRecord[]> {
    const allConsentsForSubject =
      await this.adapter.findConsentsBySubject(subjectId);
    if (!allConsentsForSubject || allConsentsForSubject.length === 0) {
      return [];
    }

    const consentsByPolicy = allConsentsForSubject.reduce((acc, consent) => {
      const policyConsents = acc.get(consent.policyId) || [];
      policyConsents.push(consent);
      acc.set(consent.policyId, policyConsents);
      return acc;
    }, new Map<string, ConsentRecord[]>());

    const latestVersions: ConsentRecord[] = [];
    for (const policyConsents of consentsByPolicy.values()) {
      if (policyConsents.length > 0) {
        policyConsents.sort((a, b) => b.version - a.version);
        latestVersions.push(policyConsents[0]);
      }
    }
    return latestVersions;
  }

  async getAllConsents(): Promise<ConsentRecord[]> {
    return this.adapter.getAllConsents();
  }
}
