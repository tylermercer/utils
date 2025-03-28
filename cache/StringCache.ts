import { promises as fs } from 'fs';
import * as path from 'path';
import type { ICacheAdapter, ICacheProvider } from './Cache';

export interface IStringCacheProvider extends ICacheProvider<string> {}

export interface IStringCacheAdapter extends ICacheAdapter<string> {}

class FileSystemStringCacheAdapter implements IStringCacheAdapter {
    constructor(private basePath: string) { }

    private getFilePath(namespace: string, key: string): string {
        return path.join(this.basePath, namespace, `${key}.cache`);
    }

    async ensureDirectoryExists(directory: string): Promise<void> {
        try {
            await fs.mkdir(directory, { recursive: true });
        } catch (error) {
            if ((error as any).code !== 'EEXIST') throw error;
        }
    }

    isValidNamespace(namespace: string): boolean {
        return typeof namespace === "string" && namespace.length > 0;
    }

    isValidKey(key: string): boolean {
        return typeof key === "string" && key.length > 0;
    }

    async get(namespace: string, key: string): Promise<string> {
        const filePath = this.getFilePath(namespace, key);
        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            if ((error as any).code === 'ENOENT') return '';
            throw error;
        }
    }

    async has(namespace: string, key: string): Promise<boolean> {
        const filePath = this.getFilePath(namespace, key);
        try {
            await fs.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    async set(namespace: string, key: string, value: string): Promise<void> {
        const filePath = this.getFilePath(namespace, key);
        await this.ensureDirectoryExists(path.dirname(filePath));
        await fs.writeFile(filePath, value, 'utf-8');
    }

    async delete(namespace: string, key: string): Promise<void> {
        const filePath = this.getFilePath(namespace, key);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            if ((error as any).code !== 'ENOENT') throw error;
        }
    }
}

class StringCacheProvider implements IStringCacheProvider {
    constructor(private namespace: string, private cacheAdapter: FileSystemStringCacheAdapter) { }

    async get(key: string): Promise<string> {
        const value = await this.cacheAdapter.get(this.namespace, key);
        return value;
    }

    async getOrCreate(key: string, valueFactory: () => Promise<string> | string): Promise<string> {
        if (await this.has(key)) {
            return this.get(key);
        }
        const value = await valueFactory();
        await this.set(key, value);
        return value;
    }

    async has(key: string): Promise<boolean> {
        return this.cacheAdapter.has(this.namespace, key);
    }

    async set(key: string, value: string): Promise<void> {
        const valueToCache = typeof value === 'string' ? value : JSON.stringify(value);
        await this.cacheAdapter.set(this.namespace, key, valueToCache);
    }

    async delete(key: string): Promise<void> {
        await this.cacheAdapter.delete(this.namespace, key);
    }
}

export function getFileSystemStringCache(namespace: string, basePath: string): StringCacheProvider {
    const adapter = new FileSystemStringCacheAdapter(basePath);
    return new StringCacheProvider(namespace, adapter);
}