import Valkey, { RedisOptions } from "iovalkey";

import { SessionStore } from "..";

declare class ValkeySessionStore extends SessionStore {
    constructor(options?: RedisOptions & {
        client?: Valkey;
    });
}

export = ValkeySessionStore;
