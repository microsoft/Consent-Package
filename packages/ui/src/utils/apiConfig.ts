// Copyright (c) Microsoft Corporation. Licensed under the MIT license.

export interface ApiConfig {
  [key: string]: any;
}

let currentApiConfig: ApiConfig = {};

export function setApiConfig(config: ApiConfig): void {
  currentApiConfig = config;
}

export function getApiConfig(): ApiConfig {
  return currentApiConfig;
}
