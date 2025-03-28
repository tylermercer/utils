import crypto from "crypto";

interface GenerateCacheKeyOptions {
    prefix?: string;
    suffix?: string;
}

export async function generateCacheKey<T extends object>(
    sourceObj: T,
    options?: GenerateCacheKeyOptions,
): Promise<string> {
    const jsonString = JSON.stringify(sourceObj);
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
    return `${options?.prefix ? (options.prefix + '-') : ''}${hash}${options?.suffix ? ('-' + options.suffix) : ''}`;
}