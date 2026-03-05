import {
    Connection,
    PublicKey,
    Transaction,
    clusterApiUrl,
    SystemProgram,
    Keypair
} from '@solana/web3.js'
import {
    TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import * as anchor from '@coral-xyz/anchor'
import { dfnsApi, BANK_WALLET_ID, RECEIVER_PUBKEY } from './DFNSCommon.js'

// This would normally be loaded from target/idl/cross_border_payment.json
// For this environment, we'll use a mocked IDL or just raw instruction data.
const PROGRAM_ID = new PublicKey("CEMoNh21BbxrVdPM6N9xwpqFHD8dxAFkBscZqPEdfrbe")

async function broadcast(transaction: Transaction, walletId: string) {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const wallet = await dfnsApi.wallets.getWallet({ walletId })
    const payerPublicKey = new PublicKey(wallet.address!)

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = payerPublicKey

    const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
    }).toString('hex')

    console.log(`Broadcasting transaction via DFNS (Wallet: ${walletId})...`)
    try {
        const result = await dfnsApi.wallets.broadcastTransaction({
            walletId,
            body: {
                kind: 'Transaction',
                transaction: serializedTransaction,
            } as any
        })
        console.log('DFNS Broadcast Result:', JSON.stringify(result, null, 2))
        console.log('Transaction Signature:', result.txHash)
        return result.txHash
    } catch (error: any) {
        console.error('Broadcast failed:', error)
        throw error
    }
}

export async function initPayment(paymentId: number, receiver: string, amount: number) {
    const wallet = await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID })
    const sender = new PublicKey(wallet.address!)
    const receiverPubkey = new PublicKey(receiver)

    // PDA for Payment Account
    const [paymentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("payment"), sender.toBuffer(), new anchor.BN(paymentId).toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
    )

    console.log(`Initializing Payment PDA: ${paymentPda.toBase58()}`)

    // In a real Anchor app, we'd use program.methods.initializePayment(...).instruction()
    // Here we'll simulate the instruction data for Anchor (8-byte discriminator + args)
    // Discriminator for "initialize_payment" (first 8 bytes of sha256("global:initialize_payment"))
    const discriminator = Buffer.from([10, 18, 43, 254, 174, 203, 246, 3]);
    const data = Buffer.concat([
        discriminator,
        new anchor.BN(paymentId).toArrayLike(Buffer, "le", 8),
        new anchor.BN(amount).toArrayLike(Buffer, "le", 8),
    ]);

    const instruction = {
        keys: [
            { pubkey: paymentPda, isSigner: false, isWritable: true },
            { pubkey: sender, isSigner: true, isWritable: true },
            { pubkey: receiverPubkey, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
    }

    const transaction = new Transaction().add(instruction)
    return await broadcast(transaction, BANK_WALLET_ID)
}

// CLI entry point
if (process.argv[1]?.endsWith('InitPayment.ts')) {
    const id = parseInt(process.argv[2] || "0")
    const rec = process.argv[3] || RECEIVER_PUBKEY
    const amt = parseInt(process.argv[4] || "1000000")
    if (!rec) { console.error("Usage: tsx InitPayment.ts <id> [receiver] [amount]"); process.exit(1); }
    initPayment(id, rec, amt).catch(console.error)
}
