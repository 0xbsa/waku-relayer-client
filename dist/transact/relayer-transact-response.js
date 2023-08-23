import { decryptAESGCM256 } from '@railgun-community/wallet';
import { bytesToUtf8 } from '../utils/conversion.js';
import { RelayerDebug } from '../utils/relayer-debug.js';
import { isDefined } from '../utils/is-defined.js';
export class RelayerTransactResponse {
    static async handleRelayerTransactionResponseMessage(message) {
        if (!RelayerTransactResponse.sharedKey) {
            return;
        }
        if (!isDefined(message.payload)) {
            return;
        }
        try {
            const payload = bytesToUtf8(message.payload);
            const { result: encryptedData } = JSON.parse(payload);
            const decrypted = decryptAESGCM256(encryptedData, RelayerTransactResponse.sharedKey);
            if (decrypted == null) {
                return;
            }
            RelayerDebug.log('Handle Relayer transact-response message:');
            RelayerDebug.log(JSON.stringify(decrypted));
            RelayerTransactResponse.storedTransactionResponse =
                decrypted;
        }
        catch (err) {
            if (!(err instanceof Error)) {
                throw err;
            }
            RelayerDebug.log(`Could not handle Relayer tx response message`);
            RelayerDebug.error(err);
        }
    }
}
RelayerTransactResponse.setSharedKey = (key) => {
    RelayerTransactResponse.sharedKey = key;
    RelayerTransactResponse.storedTransactionResponse = undefined;
};
RelayerTransactResponse.clearSharedKey = () => {
    RelayerTransactResponse.sharedKey = undefined;
    RelayerTransactResponse.storedTransactionResponse = undefined;
};
//# sourceMappingURL=relayer-transact-response.js.map