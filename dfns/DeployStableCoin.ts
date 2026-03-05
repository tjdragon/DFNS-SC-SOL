import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    clusterApiUrl
} from '@solana/web3.js'
import {
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction
} from '@solana/spl-token'
import {
    createMetadataAccountV3,
    MPL_TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata'
import type {
    CreateMetadataAccountV3InstructionAccounts,
    CreateMetadataAccountV3InstructionArgs,
} from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
import { dfnsApi, BANK_WALLET_ID } from './DFNSCommon.js'

async function main() {
    const args = process.argv.slice(2);
    const tokenName = args[0] || "tSGD Stable";
    const tokenSymbol = args[1] || "tSGD";

    console.log(`Deploying Token: ${tokenName} (${tokenSymbol})`);

    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

    // 1. Get DFNS Wallet Info
    console.log('Fetching DFNS wallet info...')
    const wallet = await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID })
    const payerPublicKey = new PublicKey(wallet.address!)
    console.log(`Payer (DFNS Wallet): ${payerPublicKey.toBase58()}`)

    // 2. Generate a new keypair for the Mint account
    const mintKeypair = Keypair.generate()
    console.log(`New Mint Address: ${mintKeypair.publicKey.toBase58()}`)

    // 3. Calculate rent for Mint account
    const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE)

    // 4. Build Transaction
    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payerPublicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(
            mintKeypair.publicKey,
            6, // 6 decimals like USDC/Ethereum version
            payerPublicKey, // Mint Authority
            payerPublicKey  // Freeze Authority
        )
    )

    // 5. Add Metaplex Metadata
    console.log('Adding Metadata instruction...')
    const umi = createUmi(clusterApiUrl('devnet'))

    // Find Metadata PDA
    const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
            mintKeypair.publicKey.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
    );

    const accounts: CreateMetadataAccountV3InstructionAccounts = {
        metadata: fromWeb3JsPublicKey(metadataPDA),
        mint: fromWeb3JsPublicKey(mintKeypair.publicKey),
        mintAuthority: fromWeb3JsPublicKey(payerPublicKey) as any,
        payer: fromWeb3JsPublicKey(payerPublicKey) as any,
        updateAuthority: fromWeb3JsPublicKey(payerPublicKey) as any,
    }

    const metadataArgs: CreateMetadataAccountV3InstructionArgs = {
        data: {
            name: tokenName,
            symbol: tokenSymbol,
            uri: "",
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
        },
        isMutable: true,
        collectionDetails: null,
    }

    const metadataIx = createMetadataAccountV3(umi, { ...accounts, ...metadataArgs }).getInstructions()[0];

    if (metadataIx) {
        transaction.add({
            keys: metadataIx.keys.map(k => ({
                pubkey: new PublicKey(k.pubkey),
                isSigner: k.isSigner,
                isWritable: k.isWritable,
            })),
            programId: new PublicKey(metadataIx.programId),
            data: Buffer.from(metadataIx.data),
        })
    }

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = payerPublicKey

    // Partial sign with the mint keypair (it's a new account, we need its signature)
    transaction.partialSign(mintKeypair)

    // 6. Broadcast via DFNS
    console.log('Broadcasting transaction via DFNS...')

    // Serialize the transaction. DFNS expects a hex encoded string for 'kind: Transaction'.
    const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
    }).toString('hex')

    try {
        const result = await dfnsApi.wallets.broadcastTransaction({
            walletId: BANK_WALLET_ID,
            body: {
                kind: 'Transaction',
                transaction: serializedTransaction,
            } as any
        })

        console.log('Transaction broadcasted successfully!')
        console.log('Transaction ID:', result.id)
        console.log('Transaction Signature:', result.txHash)
        console.log('Status:', result.status)
        console.log(`\nCheck it on Solana Explorer: https://explorer.solana.com/address/${mintKeypair.publicKey.toBase58()}?cluster=devnet`)

        // Save the mint address for later use
        console.log('\nIMPORTANT: Save this Mint Address for operations!')
        console.log(`${tokenSymbol} Mint: ${mintKeypair.publicKey.toBase58()}`)
    } catch (error: any) {
        console.error('Failed to broadcast transaction:', error)
        if (error.context) {
            console.error('Error Context:', JSON.stringify(error.context, null, 2))
        }
    }
}

main()
