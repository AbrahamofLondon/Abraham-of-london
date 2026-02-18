// Updated Code with Proper Type Guards

function getCached<T>(key: string): T {
    const cached = cache.get(key);
    if (!cached) {
        throw new Error('Cached value is undefined');
    }
    return cached;
}