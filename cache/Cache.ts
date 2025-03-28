export interface ICacheProvider<T> {
    get(key: string): Promise<T>;
    getOrCreate(key: string, valueFactory: () => Promise<T> | T): Promise<T>;
    has(key: string): Promise<boolean>;
    set(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
}

export interface ICacheAdapter<T> {
    isValidNamespace(namespace: string): boolean;
    isValidKey(key: string): boolean;
    get(namespace: string, key: string): Promise<T>;
    has(namespace: string, key: string): Promise<boolean>;
    set(namespace: string, key: string, value: T): Promise<void>;
    delete(namespace: string, key: string): Promise<void>;
}