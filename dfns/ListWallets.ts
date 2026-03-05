import { dfnsApi } from './DFNSCommon.js'

async function main() {
    try {
        console.log('Listing wallets...')
        const result = await dfnsApi.wallets.listWallets({})
        console.log('Wallets:', JSON.stringify(result, null, 2))
    } catch (error) {
        console.error('Failed to list wallets:', JSON.stringify(error, null, 2))
    }
}

main()
