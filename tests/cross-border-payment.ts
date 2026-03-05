import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import type { CrossBorderPayment } from "../target/types/cross_border_payment.js";
import {
    TOKEN_PROGRAM_ID,
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    getAccount,
} from "@solana/spl-token";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("cross-border-payment", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.CrossBorderPayment as Program<CrossBorderPayment>;
    const sender = (provider.wallet as anchor.Wallet).payer;
    const receiver = Keypair.generate();
    const authority = sender; // Using sender as authority for simplicity in tests

    let ieurMint: PublicKey;
    let iaudMint: PublicKey;
    let senderIeurAta: PublicKey;
    let receiverIaudAta: PublicKey;

    const paymentId = new anchor.BN(Date.now());
    const amountIn = new anchor.BN(500000); // 0.5 iEUR
    const amountOut = new anchor.BN(800000); // 0.8 iAUD (mocked rate)

    let paymentPda: PublicKey;
    let paymentBump: number;

    before(async () => {
        // 1. Setup Mints
        ieurMint = await createMint(
            provider.connection,
            sender,
            authority.publicKey,
            null,
            6
        );
        iaudMint = await createMint(
            provider.connection,
            sender,
            authority.publicKey,
            null,
            6
        );

        // 2. Setup ATAs
        senderIeurAta = await createAssociatedTokenAccount(
            provider.connection,
            sender,
            ieurMint,
            sender.publicKey
        );
        receiverIaudAta = await createAssociatedTokenAccount(
            provider.connection,
            sender,
            iaudMint,
            receiver.publicKey
        );

        // 3. Fund Sender
        await mintTo(
            provider.connection,
            sender,
            ieurMint,
            senderIeurAta,
            authority,
            1000000 // 1.0 iEUR
        );

        // 4. Derive PDA
        [paymentPda, paymentBump] = PublicKey.findProgramAddressSync(
            [
                Buffer.from("payment"),
                sender.publicKey.toBuffer(),
                paymentId.toArrayLike(Buffer, "le", 8),
            ],
            program.programId
        );
    });

    it("Initializes a payment", async () => {
        await program.methods
            .initializePayment(paymentId, amountIn)
            .accounts({
                payment: paymentPda,
                sender: sender.publicKey,
                receiver: receiver.publicKey,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();

        const paymentAccount = await program.account.payment.fetch(paymentPda);
        expect(paymentAccount.id.toString()).to.equal(paymentId.toString());
        expect(paymentAccount.sender.toBase58()).to.equal(sender.publicKey.toBase58());
        expect(paymentAccount.receiver.toBase58()).to.equal(receiver.publicKey.toBase58());
        expect(paymentAccount.amountIn.toString()).to.equal(amountIn.toString());
        expect(paymentAccount.amountOut.toString()).to.equal("0");
        expect(paymentAccount.status).to.deep.equal({ pendingFx: {} });
    });

    it("Sets FX rate", async () => {
        await program.methods
            .setFxRate(paymentId, amountOut)
            .accounts({
                payment: paymentPda,
                authority: authority.publicKey,
            } as any)
            .rpc();

        const paymentAccount = await program.account.payment.fetch(paymentPda);
        expect(paymentAccount.amountOut.toString()).to.equal(amountOut.toString());
        expect(paymentAccount.status).to.deep.equal({ fxRateSet: {} });
    });

    it("Executes the payment (Burn & Mint)", async () => {
        await program.methods
            .executePayment(paymentId)
            .accounts({
                payment: paymentPda,
                sender: sender.publicKey,
                ieurMint: ieurMint,
                senderIeurAta: senderIeurAta,
                iaudMint: iaudMint,
                receiverIaudAta: receiverIaudAta,
                iaudMintAuthority: authority.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            } as any)
            .rpc();

        const paymentAccount = await program.account.payment.fetch(paymentPda);
        expect(paymentAccount.status).to.deep.equal({ completed: {} });

        // Verify Balances
        const senderTokenAccount = await getAccount(provider.connection, senderIeurAta);
        expect(senderTokenAccount.amount.toString()).to.equal("500000"); // 1M - 500k

        const receiverTokenAccount = await getAccount(provider.connection, receiverIaudAta);
        expect(receiverTokenAccount.amount.toString()).to.equal("800000"); // 0 + 800k
    });

    it("Fails if re-initializing same payment", async () => {
        try {
            await program.methods
                .initializePayment(paymentId, amountIn)
                .accounts({
                    payment: paymentPda,
                    sender: sender.publicKey,
                    receiver: receiver.publicKey,
                    systemProgram: SystemProgram.programId,
                } as any)
                .rpc();
            expect.fail("Should have failed");
        } catch (err: any) {
            // Correct way to check for existing account error in Anchor
            expect(err.logs.toString()).to.contain("already in use");
        }
    });
});
