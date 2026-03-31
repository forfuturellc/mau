import { RedisClientOptions, RedisClientType } from "redis";

import { SessionStore } from "..";

declare class RedisSessionStore extends SessionStore {
    constructor(options?: RedisClientOptions & {
        client?: RedisClientType;
        prefix?: string;
    });
}

export = RedisSessionStore;
