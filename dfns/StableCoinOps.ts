import {
    Connection,
    PublicKey,
    Transaction,
    clusterApiUrl
} from '@solana/web3.js'
import {
    createMintToInstruction,
    createBurnInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    AccountLayout
} from '@solana/spl-token'
import readline from 'readline'
import { dfnsApi, BANK_WALLET_ID, TEUR_MINT } from './DFNSCommon.js'

const MINT_ADDRESS = TEUR_MINT

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function askQuestion(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, answer => resolve(answer.trim())))
}

async function broadcast(transaction: Transaction, payerPublicKey: PublicKey) {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = payerPublicKey

    // Serialize in HEX for kind: Transaction
    const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
    }).toString('hex')

    console.log('Broadcasting transaction via DFNS...')
    try {
        const result = await dfnsApi.wallets.broadcastTransaction({
            walletId: BANK_WALLET_ID,
            body: {
                kind: 'Transaction',
                transaction: serializedTransaction,
            } as any
        })

        console.log('DFNS Broadcast Result:', JSON.stringify(result, null, 2))
        console.log('Transaction broadcasted successfully!')
        console.log('Transaction Signature:', result.txHash)
        console.log(`Explorer: https://explorer.solana.com/tx/${result.txHash}?cluster=devnet`)
    } catch (error: any) {
        console.error('Failed to broadcast transaction:', error)
        if (error.context) {
            console.error('Error Context:', JSON.stringify(error.context, null, 2))
        }
    }
}

async function mint() {
    const toAddress = await askQuestion('Enter recipient Solana address: ')
    const amountStr = await askQuestion('Enter amount to mint (in base units, 6 decimals): ')

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const wallet = await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID })
    const payerPublicKey = new PublicKey(wallet.address!)
    const mintPublicKey = new PublicKey(MINT_ADDRESS)
    const recipientPublicKey = new PublicKey(toAddress)

    console.log('Checking/Creating ATA for recipient...')
    const recipientATA = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey
    )

    const transaction = new Transaction()

    const accountInfo = await connection.getAccountInfo(recipientATA)
    if (!accountInfo) {
        console.log('ATA does not exist. Adding creation instruction...')
        transaction.add(
            createAssociatedTokenAccountInstruction(
                payerPublicKey,
                recipientATA,
                recipientPublicKey,
                mintPublicKey
            )
        )
    }

    const amount = BigInt(amountStr)
    transaction.add(
        createMintToInstruction(
            mintPublicKey,
            recipientATA,
            payerPublicKey,
            amount
        )
    )

    await broadcast(transaction, payerPublicKey)
}

async function burn() {
    const fromATA = await askQuestion('Enter source Token Account (ATA) address: ')
    const amountStr = await askQuestion('Enter amount to burn: ')

    const wallet = await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID })
    const payerPublicKey = new PublicKey(wallet.address!)
    const mintPublicKey = new PublicKey(MINT_ADDRESS)
    const sourcePublicKey = new PublicKey(fromATA)

    const amount = BigInt(amountStr)
    const transaction = new Transaction().add(
        createBurnInstruction(
            sourcePublicKey,
            mintPublicKey,
            payerPublicKey,
            amount
        )
    )

    await broadcast(transaction, payerPublicKey)
}

async function listHolders() {
    console.log('Fetching all token accounts for this mint...')
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const mintPublicKey = new PublicKey(MINT_ADDRESS)

    try {
        const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
            filters: [
                {
                    dataSize: 165, // size of token account
                },
                {
                    memcmp: {
                        offset: 0,
                        bytes: MINT_ADDRESS,
                    },
                },
            ],
        })

        console.log(`\nFound ${accounts.length} holder(s):`)
        console.log('------------------------------------------------------------')
        console.log(`${'Token Account'.padEnd(45)} | ${'Balance (UI)'.padStart(15)}`)
        console.log('------------------------------------------------------------')

        for (const account of accounts) {
            const accountData = AccountLayout.decode(account.account.data)
            const balanceBigInt = accountData.amount
            const uiBalance = Number(balanceBigInt) / 1_000_000

            console.log(`${account.pubkey.toBase58().padEnd(45)} | ${uiBalance.toFixed(6).padStart(15)}`)
        }
    } catch (error) {
        console.error('Failed to fetch holders:', error)
    }
}

async function main() {
    while (true) {
        console.log('\n--- Solana Stable Coin Operations ---')
        console.log(`Mint Address: ${MINT_ADDRESS}`)
        console.log('1. Mint')
        console.log('2. Burn')
        console.log('3. List Holders')
        console.log('4. Exit')

        const choice = await askQuestion('Select an operation (1-4): ')

        switch (choice) {
            case '1':
                await mint()
                break;
            case '2':
                await burn()
                break;
            case '3':
                await listHolders()
                break;
            case '4':
                console.log('Exiting...')
                rl.close()
                return
            default:
                console.log('Invalid choice. Please try again.')
        }
    }
}

main().catch(console.error)
