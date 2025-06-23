import type { Middleware } from './httpHandler.js';

interface MiddlewareConfig {
  global: Middleware[];
  byEndpoint: Record<string, Middleware[]>;
}

class MiddlewareRegistry {
  private config: MiddlewareConfig = {
    global: [],
    byEndpoint: {},
  };

  addGlobalMiddleware(middleware: Middleware): void {
    this.config.global.push(middleware);
  }

  addEndpointMiddleware(endpointName: string, middleware: Middleware): void {
    if (!this.config.byEndpoint[endpointName]) {
      this.config.byEndpoint[endpointName] = [];
    }
    this.config.byEndpoint[endpointName].push(middleware);
  }

  getMiddlewareForEndpoint(endpointName: string): Middleware[] {
    return [
      ...this.config.global,
      ...(this.config.byEndpoint[endpointName] || []),
    ];
  }

  clear(): void {
    this.config.global = [];
    this.config.byEndpoint = {};
  }
}

export const middlewareRegistry = new MiddlewareRegistry();
export { MiddlewareRegistry };
