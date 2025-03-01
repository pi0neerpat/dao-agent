import { JsonRpcProvider } from '@ethersproject/providers';

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
const provider = new JsonRpcProvider(ETHEREUM_RPC_URL);

/**
 * Resolves an ENS name to an Ethereum address
 * @param {string} ensName - The ENS name to resolve (e.g. 'vitalik.eth')
 * @returns {Promise<string>} The resolved Ethereum address or null if not found
 */
export async function resolveENS(ensName) {
    try {
        const address = await provider.resolveName(ensName);
        if (!address) {
            throw new Error(`Could not resolve ENS name: ${ensName}`);
        }
        return address;
    } catch (error) {
        console.error('Error resolving ENS:', error);
        return null;
    }
}

/**
 * Gets the primary ENS name for an Ethereum address
 * @param {string} address - The Ethereum address to lookup
 * @returns {Promise<string>} The ENS name or null if not found
 */
export async function lookupAddress(address) {
    try {
        const ensName = await provider.lookupAddress(address);
        return ensName || null;
    } catch (error) {
        console.error('Error looking up ENS:', error);
        return null;
    }
}

