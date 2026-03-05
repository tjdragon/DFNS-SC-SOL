use anchor_lang::prelude::*;

declare_id!("5Dkx7kkqFHVeXhQLea7ykdyB3wLea3mcxdA2tUvQQfnk");

#[program]
pub mod hello_world {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, Solana! Deployment works.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
