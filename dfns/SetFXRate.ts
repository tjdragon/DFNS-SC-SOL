import {
    Connection,
    PublicKey,
    Transaction,
    clusterApiUrl
} from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { dfnsApi, BANK_WALLET_ID } from './DFNSCommon.js'

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

export async function setFXRate(paymentId: number, sender: string, amountOut: number) {
    const senderPubkey = new PublicKey(sender)
    const [paymentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("payment"), senderPubkey.toBuffer(), new anchor.BN(paymentId).toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
    )

    console.log(`Setting FX Rate for Payment PDA: ${paymentPda.toBase58()}`)

    // 8-byte discriminator for "set_fx_rate"
    const discriminator = Buffer.from([219, 250, 185, 143, 241, 119, 207, 65]);
    const data = Buffer.concat([
        discriminator,
        new anchor.BN(paymentId).toArrayLike(Buffer, "le", 8),
        new anchor.BN(amountOut).toArrayLike(Buffer, "le", 8),
    ]);

    const instruction = {
        keys: [
            { pubkey: paymentPda, isSigner: false, isWritable: true },
            { pubkey: new PublicKey((await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID })).address!), isSigner: true, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
    }

    const transaction = new Transaction().add(instruction)
    return await broadcast(transaction, BANK_WALLET_ID)
}

if (process.argv[1]?.endsWith('SetFXRate.ts')) {
    const id = parseInt(process.argv[2] || "0")
    // For demo purposes, we'll assume the bank wallet is the sender if not provided
    const snd = process.argv[3]
    const out = parseInt(process.argv[4] || "0")

    if (!snd || !out) {
        console.error("Usage: tsx SetFXRate.ts <id> <sender_address> <amountOut>");
        process.exit(1);
    }

    setFXRate(id, snd, out).catch(console.error)
}
