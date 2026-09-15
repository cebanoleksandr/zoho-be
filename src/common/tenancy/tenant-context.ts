import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  organizationId: string;
  userId?: string;
}

/**
 * Request-scoped tenant data, populated by TenantMiddleware after auth.
 * Services read TenantContext.get() instead of trusting client-supplied
 * organizationId, so cross-tenant data leaks require an explicit bypass.
 */
export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<TenantStore>();

  static run<T>(store: TenantStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  static get(): TenantStore | undefined {
    return this.storage.getStore();
  }

  static getOrganizationId(): string {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error('TenantContext accessed outside of a tenant scope');
    }
    return store.organizationId;
  }
}
