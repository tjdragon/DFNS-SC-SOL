import {
    Connection,
    PublicKey,
    Transaction,
    clusterApiUrl
} from '@solana/web3.js'
import {
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction
} from '@solana/spl-token'
import * as anchor from '@coral-xyz/anchor'
import { dfnsApi, BANK_WALLET_ID, TEUR_MINT, TSGD_MINT } from './DFNSCommon.js'

const PROGRAM_ID = new PublicKey("CEMoNh21BbxrVdPM6N9xwpqFHD8dxAFkBscZqPEdfrbe")
const TEUR_MINT_PUBKEY = new PublicKey(TEUR_MINT)
const TSGD_MINT_PUBKEY = new PublicKey(TSGD_MINT)

async function broadcast(transaction: Transaction, walletId: string) {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const wallet = await dfnsApi.wallets.getWallet({ walletId })
    if (!wallet.address) throw new Error('Wallet address not found')
    const payerPublicKey = new PublicKey(wallet.address)

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = payerPublicKey

    const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
    }).toString('hex')

    console.log(`Broadcasting transaction via DFNS (Wallet: ${walletId})...`)
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
}

export async function executePayment(paymentId: number) {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
    const wallet = await dfnsApi.wallets.getWallet({ walletId: BANK_WALLET_ID })
    if (!wallet.address) throw new Error('Bank wallet address not found')
    const sender = new PublicKey(wallet.address)

    const [paymentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("payment"), sender.toBuffer(), new anchor.BN(paymentId).toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID
    )

    // Fetch payment PDA data to get the correct receiver
    const paymentAccount = await connection.getAccountInfo(paymentPda)
    if (!paymentAccount) throw new Error(`Payment account ${paymentPda.toBase58()} not found. Did you initialize it?`)

    // Offset 48: discriminator(8) + id(8) + sender(32) -> receiver(32)
    const receiverPubkey = new PublicKey(paymentAccount.data.slice(48, 80))
    console.log(`Fetched Receiver from PDA: ${receiverPubkey.toBase58()}`)

    // 1. Find or derive sender iEUR account
    const senderIeurAta = await getAssociatedTokenAddress(TEUR_MINT_PUBKEY, sender)
    let bestSenderAccount = senderIeurAta

    // Check if ATA exists, if not check for any account
    const senderAtaInfo = await connection.getAccountInfo(senderIeurAta)
    if (!senderAtaInfo) {
        const otherAccounts = await connection.getParsedTokenAccountsByOwner(sender, { mint: TEUR_MINT_PUBKEY })
        if (otherAccounts.value.length > 0 && otherAccounts.value[0]) {
            bestSenderAccount = otherAccounts.value[0].pubkey
            console.log(`Using existing sender token account: ${bestSenderAccount.toBase58()}`)
        }
    }

    // 2. Find or derive receiver iAUD account
    const receiverIaudAta = await getAssociatedTokenAddress(TSGD_MINT_PUBKEY, receiverPubkey)

    const transaction = new Transaction()

    // 3. Check if receiver account exists, if not add instruction to create it
    const receiverInfo = await connection.getAccountInfo(receiverIaudAta)
    if (!receiverInfo) {
        console.log(`Adding instruction to create receiver ATA: ${receiverIaudAta.toBase58()}`)
        transaction.add(
            createAssociatedTokenAccountInstruction(
                sender, // Payer
                receiverIaudAta,
                receiverPubkey,
                TSGD_MINT_PUBKEY
            )
        )
    }

    console.log(`Executing Payment for PDA: ${paymentPda.toBase58()}`)

    // 8-byte discriminator for "execute_payment"
    const discriminator = Buffer.from([86, 4, 7, 7, 120, 139, 232, 139]);
    const data = Buffer.concat([
        discriminator,
        new anchor.BN(paymentId).toArrayLike(Buffer, "le", 8),
    ]);

    const instruction = {
        keys: [
            { pubkey: paymentPda, isSigner: false, isWritable: true },
            { pubkey: sender, isSigner: true, isWritable: true },
            { pubkey: TEUR_MINT_PUBKEY, isSigner: false, isWritable: true },
            { pubkey: bestSenderAccount, isSigner: false, isWritable: true },
            { pubkey: TSGD_MINT_PUBKEY, isSigner: false, isWritable: true },
            { pubkey: receiverIaudAta, isSigner: false, isWritable: true },
            { pubkey: sender, isSigner: false, isWritable: false }, // Mint authority (Bank Wallet)
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
    }

    transaction.add(instruction)
    return await broadcast(transaction, BANK_WALLET_ID)
}

if (process.argv[1]?.endsWith('ExecutePayment.ts')) {
    const id = parseInt(process.argv[2] || "0")
    if (isNaN(id)) { console.error("Usage: tsx ExecutePayment.ts <id>"); process.exit(1); }
    executePayment(id).catch(console.error)
}
