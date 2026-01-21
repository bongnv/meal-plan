import { ICloudStorageProvider } from './ICloudStorageProvider';
import { CloudProvider } from './CloudProvider';

/**
 * Factory for managing cloud storage providers
 * 
 * Singleton pattern to ensure only one instance manages all providers.
 * Supports registration, retrieval, and switching between different cloud storage providers.
 * 
 * Usage:
 * ```typescript
 * const factory = CloudStorageFactory.getInstance();
 * factory.registerProvider('onedrive', new OneDriveProvider());
 * const provider = factory.getProvider('onedrive');
 * await provider.connect();
 * ```
 */
export class CloudStorageFactory {
  private static instance: CloudStorageFactory;
  private providers: Map<CloudProvider, ICloudStorageProvider> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of CloudStorageFactory
   */
  public static getInstance(): CloudStorageFactory {
    if (!CloudStorageFactory.instance) {
      CloudStorageFactory.instance = new CloudStorageFactory();
    }
    return CloudStorageFactory.instance;
  }

  /**
   * Register a cloud storage provider
   * 
   * @param name - Provider identifier from CloudProvider enum
   * @param provider - Provider implementation
   */
  public registerProvider(name: CloudProvider, provider: ICloudStorageProvider): void {
    this.providers.set(name, provider);
  }

  /**
   * Get a registered provider by name
   * 
   * @param name - Provider identifier from CloudProvider enum
   * @returns The provider instance
   * @throws Error if provider not found
   */
  public getProvider(name: CloudProvider): ICloudStorageProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider "${name}" not found. Available providers: ${this.listProviders().join(', ') || 'none'}`);
    }
    return provider;
  }

  /**
   * List all registered provider names
   * 
   * @returns Array of provider identifiers
   */
  public listProviders(): CloudProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   * 
   * @param name - Provider identifier from CloudProvider enum
   * @returns true if provider is registered
   */
  public hasProvider(name: CloudProvider): boolean {
    return this.providers.has(name);
  }

  /**
   * Clear all registered providers (used for testing)
   */
  public clearProviders(): void {
    this.providers.clear();
  }
}
