function keysToProperty(flags) {
    return flags.sort().join(' ');
}

class StringKeysMap {
    constructor() {
        this.store = Object.create(null);
    }

    getByKeys(keys) {
        return this.store[keysToProperty(keys)];
    }

    setByKeys(keys, value) {
        this.store[keysToProperty(keys)] = value;
    }
}

module.exports = StringKeysMap;
