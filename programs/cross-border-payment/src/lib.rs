use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount};

declare_id!("CEMoNh21BbxrVdPM6N9xwpqFHD8dxAFkBscZqPEdfrbe");

/// The `cross_border_payment` module provides instructions for a three-step payment flow:
/// 1. `initialize_payment`: Sets up the payment record with a unique ID and amount.
/// 2. `set_fx_rate`: An authority (e.g., FX provider) sets the outgoing amount based on the current exchange rate.
/// 3. `execute_payment`: The sender triggers an atomic swap, burning the input currency and minting the output currency.
#[program]
pub mod cross_border_payment {
    use super::*;

    /// Initializes a new payment record.
    ///
    /// # Arguments
    /// * `ctx` - The context of the instruction, containing the payment account to be initialized.
    /// * `payment_id` - A unique identifier for the payment.
    /// * `amount_in` - The amount of input currency (e.g., iEUR) the sender will provide.
    pub fn initialize_payment(
        ctx: Context<InitializePayment>,
        payment_id: u64,
        amount_in: u64,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        payment.id = payment_id;
        payment.sender = ctx.accounts.sender.key();
        payment.receiver = ctx.accounts.receiver.key();
        payment.amount_in = amount_in;
        payment.amount_out = 0; // Fixed by set_fx_rate later
        payment.status = PaymentStatus::PendingFX;
        payment.bump = ctx.bumps.payment;

        Ok(())
    }

    /// Sets the exchange rate for a payment.
    ///
    /// This instruction is intended to be called by an authorized entity (FX provider)
    /// to determine exactly how much of the target currency the receiver will get.
    ///
    /// # Arguments
    /// * `ctx` - The context of the instruction.
    /// * `_payment_id` - The ID of the payment being updated (used for PDA derivation).
    /// * `amount_out` - The calculated output amount based on the FX rate.
    pub fn set_fx_rate(
        ctx: Context<SetFXRate>,
        _payment_id: u64,
        amount_out: u64,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        // Ensure the payment is in the correct state
        require!(
            payment.status == PaymentStatus::PendingFX,
            ErrorCode::InvalidStatus
        );

        payment.amount_out = amount_out;
        payment.status = PaymentStatus::FXRateSet;

        Ok(())
    }

    /// Executes the final cross-border transfer.
    ///
    /// This instruction burns the input stablecoin from the sender's account and
    /// mints the output stablecoin directly into the receiver's account.
    ///
    /// # Arguments
    /// * `ctx` - The context containing all necessary token accounts and mints.
    /// * `_payment_id` - The ID of the payment (used for PDA derivation).
    pub fn execute_payment(ctx: Context<ExecutePayment>, _payment_id: u64) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        
        // Validation: Verify status and that the signer is the original sender
        require!(
            payment.status == PaymentStatus::FXRateSet,
            ErrorCode::InvalidStatus
        );
        require!(
            payment.sender == ctx.accounts.sender.key(),
            ErrorCode::InvalidSender
        );

        // --- Step 1. Burn input currency (e.g., iEUR) from sender ---
        let burn_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.ieur_mint.to_account_info(),
                from: ctx.accounts.sender_ieur_ata.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        );
        token::burn(burn_ctx, payment.amount_in)?;

        // --- Step 2. Mint output currency (e.g., iAUD) to receiver ---
        // We use the payment PDA as a signer to authorize the mint operation
        let seeds = &[
            b"payment",
            payment.sender.as_ref(),
            &payment.id.to_le_bytes(),
            &[payment.bump],
        ];
        let signer = &[&seeds[..]];

        let mint_to_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.iaud_mint.to_account_info(),
                to: ctx.accounts.receiver_iaud_ata.to_account_info(),
                authority: ctx.accounts.iaud_mint_authority.to_account_info(),
            },
            signer,
        );
        token::mint_to(mint_to_ctx, payment.amount_out)?;

        payment.status = PaymentStatus::Completed;

        Ok(())
    }
}

/// Accounts for `initialize_payment`
#[derive(Accounts)]
#[instruction(payment_id: u64)]
pub struct InitializePayment<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + 8 + 32 + 32 + 8 + 8 + 1 + 1,
        seeds = [b"payment", sender.key().as_ref(), &payment_id.to_le_bytes()],
        bump
    )]
    pub payment: Account<'info, Payment>,
    #[account(mut)]
    pub sender: Signer<'info>,
    /// CHECK: Receiver address (non-signer)
    pub receiver: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

/// Accounts for `set_fx_rate`
#[derive(Accounts)]
#[instruction(payment_id: u64)]
pub struct SetFXRate<'info> {
    #[account(
        mut,
        seeds = [b"payment", payment.sender.as_ref(), &payment_id.to_le_bytes()],
        bump = payment.bump
    )]
    pub payment: Account<'info, Payment>,
    pub authority: Signer<'info>, // Authorized FX provider
}

/// Accounts for `execute_payment`
#[derive(Accounts)]
#[instruction(payment_id: u64)]
pub struct ExecutePayment<'info> {
    #[account(
        mut,
        seeds = [b"payment", sender.key().as_ref(), &payment_id.to_le_bytes()],
        bump = payment.bump
    )]
    pub payment: Account<'info, Payment>,
    #[account(mut)]
    pub sender: Signer<'info>,
    
    #[account(mut)]
    pub ieur_mint: Account<'info, Mint>,
    #[account(mut)]
    pub sender_ieur_ata: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub iaud_mint: Account<'info, Mint>,
    #[account(
        mut,
        constraint = receiver_iaud_ata.owner == payment.receiver @ ErrorCode::InvalidReceiverATA
    )]
    pub receiver_iaud_ata: Account<'info, TokenAccount>,
    /// CHECK: Validated via CPI signer in program
    pub iaud_mint_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

/// The state of a Cross-Border Payment record.
#[account]
pub struct Payment {
    pub id: u64,
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub status: PaymentStatus,
    pub bump: u8,
}

/// Lifecycle stages of a payment.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    PendingFX,  // Initialized, waiting for rate
    FXRateSet,  // Rate locked, ready for execution
    Completed,   // Tokens burned and minted
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid status for this operation")]
    InvalidStatus,
    #[msg("Only the original sender can execute")]
    InvalidSender,
    #[msg("Receiver ATA must be owned by the payment receiver")]
    InvalidReceiverATA,
}
