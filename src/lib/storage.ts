import { Row } from './normalize';
import { promises as fs } from 'fs';
import path from 'path';

export interface StorageMetadata {
  uploadDate: string;
  filename: string;
  rowCount: number;
  version: string;
}

export interface StoredData {
  metadata: StorageMetadata;
  data: Row[];
}

/**
 * Storage utility for managing processed Excel data
 * This provides a simple interface for storing and retrieving normalized data
 */
export class DataStorage {
  private static readonly DATA_DIR = path.join(process.cwd(), 'data');
  private static readonly DATA_FILE = path.join(this.DATA_DIR, 'latest.json');
  private static readonly METADATA_FILE = path.join(this.DATA_DIR, 'metadata.json');

  /**
   * Ensure data directory exists
   */
  private static async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.DATA_DIR);
    } catch {
      await fs.mkdir(this.DATA_DIR, { recursive: true });
    }
  }

  /**
   * Store normalized data with metadata
   */
  static async store(data: Row[], filename: string): Promise<void> {
    await this.ensureDataDir();

    const metadata: StorageMetadata = {
      uploadDate: new Date().toISOString(),
      filename,
      rowCount: data.length,
      version: '1.0'
    };

    const storedData: StoredData = {
      metadata,
      data
    };

    // Store both data and metadata to files
    await Promise.all([
      fs.writeFile(this.DATA_FILE, JSON.stringify(storedData, null, 2)),
      fs.writeFile(this.METADATA_FILE, JSON.stringify(metadata, null, 2))
    ]);
  }

  /**
   * Retrieve the latest stored data
   */
  static async getLatest(): Promise<StoredData | null> {
    try {
      const data = await fs.readFile(this.DATA_FILE, 'utf-8');
      return JSON.parse(data) as StoredData;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Get metadata for the latest stored data
   */
  static async getMetadata(): Promise<StorageMetadata | null> {
    try {
      const metadata = await fs.readFile(this.METADATA_FILE, 'utf-8');
      return JSON.parse(metadata) as StorageMetadata;
    } catch (error) {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Clear all stored data
   */
  static async clear(): Promise<void> {
    try {
      await Promise.all([
        fs.unlink(this.DATA_FILE).catch(() => {}),
        fs.unlink(this.METADATA_FILE).catch(() => {})
      ]);
    } catch (error) {
      // Files might not exist, which is fine
    }
  }

  /**
   * Check if data exists
   */
  static async hasData(): Promise<boolean> {
    try {
      await fs.access(this.DATA_FILE);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get data statistics
   */
  static async getStats(): Promise<{ totalRows: number; lastUpdated: string | null }> {
    const metadata = await this.getMetadata();
    return {
      totalRows: metadata?.rowCount || 0,
      lastUpdated: metadata?.uploadDate || null
    };
  }
}
