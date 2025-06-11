// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

import type { IDataAdapter } from '@open-source-consent/types';

let globalDataAdapter: IDataAdapter | null = null;
let initializePromise: Promise<void> | null = null;

/**
 * Sets the global data adapter instance for the application.
 * This must be called by the consuming application before any API services that require a data adapter are used.
 * @param adapter - The data adapter instance to use.
 */
export function setDataAdapter(adapter: IDataAdapter): void {
  if (globalDataAdapter !== adapter) {
    globalDataAdapter = adapter;
    // Reset initialization promise if the adapter instance itself changes, forcing re-initialization.
    initializePromise = null;
  }
}

/**
 * Gets the initialized data adapter instance.
 * Ensures that setDataAdapter has been called and the adapter is initialized.
 * @throws Error if setDataAdapter has not been called prior to this.
 * @returns The initialized data adapter instance.
 */
export async function getInitializedDataAdapter(): Promise<IDataAdapter> {
  if (!globalDataAdapter) {
    throw new Error(
      'Data adapter has not been set. Ensure setDataAdapter() is called by the application before using API services.',
    );
  }

  // Initialize the globalDataAdapter if it has an initialize method and it hasn't been successfully initialized yet
  // for the current adapter instance.
  if (
    !initializePromise &&
    typeof globalDataAdapter.initialize === 'function'
  ) {
    console.info(
      `Initializing data adapter: ${globalDataAdapter.constructor.name}...`,
    );
    initializePromise = globalDataAdapter
      .initialize()
      .then(() => {
        console.info(
          `Data adapter '${globalDataAdapter?.constructor?.name}' initialized successfully.`,
        );
      })
      .catch((err: Error) => {
        console.error(
          `Failed to initialize data adapter '${globalDataAdapter?.constructor?.name}':`,
          err,
        );
        initializePromise = null; // Reset on error to allow potential retry if the issue is fixable and initialize is called again.
        throw err; // Re-throw the error to the caller
      });
  }

  if (initializePromise) {
    await initializePromise;
  }

  return globalDataAdapter;
}
