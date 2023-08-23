export const contentTopics = {
    fees: (chain) => `/railgun/v2/${chain.type}/${chain.id}/fees/json`,
    transact: (chain) => `/railgun/v2/${chain.type}/${chain.id}/transact/json`,
    transactResponse: (chain) => `/railgun/v2/${chain.type}/${chain.id}/transact-response/json`,
};
//# sourceMappingURL=waku-topics.js.map