import { describe, it, expect, beforeEach } from 'vitest';

import { CloudProvider } from './CloudProvider';
import { CloudStorageFactory } from './CloudStorageFactory';
import { ICloudStorageProvider, type FileInfo } from './ICloudStorageProvider';

// Mock provider implementation for testing
class MockCloudProvider implements ICloudStorageProvider {
  private connected = false;
  private accountInfo = { name: 'Test User', email: 'test@example.com' };

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  async listFiles(): Promise<Array<{ name: string; lastModified: Date; size: number }>> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    return [];
  }

  async getAccountInfo(): Promise<{ name: string; email: string }> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    return this.accountInfo;
  }

  async uploadFile(_fileInfo: FileInfo, _data: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    // Mock upload - do nothing
  }

  async downloadFile(_fileInfo: FileInfo): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    // Mock download - return empty JSON
    return JSON.stringify({ recipes: [], mealPlans: [], ingredients: [], lastModified: Date.now(), version: '1.0' });
  }
}

describe('ICloudStorageProvider interface contract', () => {
  let provider: ICloudStorageProvider;

  beforeEach(() => {
    provider = new MockCloudProvider();
  });

  it('should implement connect method', async () => {
    expect(provider.connect).toBeDefined();
    await provider.connect();
    expect(await provider.isConnected()).toBe(true);
  });

  it('should implement disconnect method', async () => {
    await provider.connect();
    expect(await provider.isConnected()).toBe(true);
    
    await provider.disconnect();
    expect(await provider.isConnected()).toBe(false);
  });

  it('should implement isConnected method', async () => {
    expect(provider.isConnected).toBeDefined();
    expect(await provider.isConnected()).toBe(false);
  });

  it('should implement getAccountInfo method', async () => {
    await provider.connect();
    const accountInfo = await provider.getAccountInfo();
    
    expect(accountInfo).toBeDefined();
    expect(accountInfo.name).toBeDefined();
    expect(accountInfo.email).toBeDefined();
  });

  it('should throw error when getting account info while disconnected', async () => {
    await expect(provider.getAccountInfo()).rejects.toThrow('Not connected');
  });

  it('should implement uploadFile method', async () => {
    await provider.connect();
    expect(provider.uploadFile).toBeDefined();
    
    const testData = JSON.stringify({ test: 'data' });
    const fileInfo: FileInfo = { id: 'test-id', name: 'test.json.gz', path: '/meal-plan/test.json.gz' };
    await expect(provider.uploadFile(fileInfo, testData)).resolves.not.toThrow();
  });

  it('should throw error when uploading while disconnected', async () => {
    const fileInfo: FileInfo = { id: 'test-id', name: 'test.json.gz', path: '/meal-plan/test.json.gz' };
    await expect(provider.uploadFile(fileInfo, 'data')).rejects.toThrow('Not connected');
  });

  it('should implement downloadFile method', async () => {
    await provider.connect();
    expect(provider.downloadFile).toBeDefined();
    
    const fileInfo: FileInfo = { id: 'test-id', name: 'data.json.gz', path: '/meal-plan/data.json.gz' };
    const data = await provider.downloadFile(fileInfo);
    expect(data).toBeDefined();
    expect(typeof data).toBe('string');
  });

  it('should throw error when downloading while disconnected', async () => {
    const fileInfo: FileInfo = { id: 'test-id', name: 'data.json.gz', path: '/meal-plan/data.json.gz' };
    await expect(provider.downloadFile(fileInfo)).rejects.toThrow('Not connected');
  });
});

describe('CloudStorageFactory', () => {
  let factory: CloudStorageFactory;

  beforeEach(() => {
    factory = CloudStorageFactory.getInstance();
    factory.clearProviders(); // Reset for each test
  });

  it('should be a singleton', () => {
    const instance1 = CloudStorageFactory.getInstance();
    const instance2 = CloudStorageFactory.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should register a provider', () => {
    const mockProvider = new MockCloudProvider();
    factory.registerProvider(CloudProvider.ONEDRIVE, mockProvider);
    
    const provider = factory.getProvider(CloudProvider.ONEDRIVE);
    expect(provider).toBe(mockProvider);
  });

  it('should throw error when getting unregistered provider', () => {
    expect(() => factory.getProvider(CloudProvider.GOOGLE_DRIVE)).toThrow('Provider "googledrive" not found');
  });

  it('should list all registered providers', () => {
    const mockProvider1 = new MockCloudProvider();
    const mockProvider2 = new MockCloudProvider();
    
    factory.registerProvider(CloudProvider.ONEDRIVE, mockProvider1);
    factory.registerProvider(CloudProvider.GOOGLE_DRIVE, mockProvider2);
    
    const providers = factory.listProviders();
    expect(providers).toEqual([CloudProvider.ONEDRIVE, CloudProvider.GOOGLE_DRIVE]);
  });

  it('should return empty array when no providers registered', () => {
    const providers = factory.listProviders();
    expect(providers).toEqual([]);
  });

  it('should allow provider switching', () => {
    const mockProvider1 = new MockCloudProvider();
    const mockProvider2 = new MockCloudProvider();
    
    factory.registerProvider(CloudProvider.ONEDRIVE, mockProvider1);
    factory.registerProvider(CloudProvider.GOOGLE_DRIVE, mockProvider2);
    
    const provider1 = factory.getProvider(CloudProvider.ONEDRIVE);
    expect(provider1).toBe(mockProvider1);
    
    const provider2 = factory.getProvider(CloudProvider.GOOGLE_DRIVE);
    expect(provider2).toBe(mockProvider2);
  });

  it('should overwrite provider if registered again', () => {
    const mockProvider1 = new MockCloudProvider();
    const mockProvider2 = new MockCloudProvider();
    
    factory.registerProvider(CloudProvider.ONEDRIVE, mockProvider1);
    factory.registerProvider(CloudProvider.ONEDRIVE, mockProvider2);
    
    const provider = factory.getProvider(CloudProvider.ONEDRIVE);
    expect(provider).toBe(mockProvider2);
  });
});
