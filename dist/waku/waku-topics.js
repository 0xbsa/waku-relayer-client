"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentTopics = void 0;
exports.contentTopics = {
    fees: (chain) => `/railgun/v2/${chain.type}/${chain.id}/fees/json`,
    transact: (chain) => `/railgun/v2/${chain.type}/${chain.id}/transact/json`,
    transactResponse: (chain) => `/railgun/v2/${chain.type}/${chain.id}/transact-response/json`,
};
//# sourceMappingURL=waku-topics.js.map