"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressFilter = void 0;
class AddressFilter {
    static setAllowlist(allowlist) {
        this.allowlist = allowlist;
    }
    static setBlocklist(blocklist) {
        this.blocklist = blocklist;
    }
    static filter(addresses) {
        return addresses
            .filter(address => {
            return !this.allowlist || this.allowlist.includes(address);
        })
            .filter(address => {
            return !this.blocklist || !this.blocklist.includes(address);
        })
            .sort();
    }
}
exports.AddressFilter = AddressFilter;
//# sourceMappingURL=address-filter.js.map