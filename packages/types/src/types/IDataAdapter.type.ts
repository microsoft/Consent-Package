import type { IConsentDataAdapter } from "./IConsentDataAdapter.type.js";
import type { IPolicyDataAdapter } from "./IPolicyDataAdapter.type.js";

export type IDataAdapter = IConsentDataAdapter &
  IPolicyDataAdapter & {
    initialize?(): Promise<void>;
  };
