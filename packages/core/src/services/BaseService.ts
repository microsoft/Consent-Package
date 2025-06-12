// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

export abstract class BaseService<TAdapter> {
  protected adapter: TAdapter;

  public constructor(adapter: TAdapter) {
    this.adapter = adapter;
  }

  private static instances = new Map<new (...args: any[]) => any, any>();

  private static currentDataAdapters = new Map<
    new (...args: any[]) => any,
    any
  >();

  /**
   * Gets the singleton instance of the service.
   * A new instance is created if one doesn't exist or if the provided adapter is different from the one used for the current instance.
   * Note that this is just a reference check, not a value check.
   * @param this The constructor of the calling service class (e.g., PolicyService, ConsentService).
   * @param adapter The data adapter for the service.
   * @returns The singleton instance of the service.
   */
  public static getInstance<
    TService extends BaseService<TAdapterType>,
    TAdapterType,
  >(
    this: new (adapter: TAdapterType) => TService,
    adapter: TAdapterType,
  ): TService {
    if (
      !BaseService.instances.has(this) ||
      BaseService.currentDataAdapters.get(this) !== adapter
    ) {
      const instance = new this(adapter);
      BaseService.instances.set(this, instance);
      BaseService.currentDataAdapters.set(this, adapter);
    }
    return BaseService.instances.get(this) as TService;
  }
}
