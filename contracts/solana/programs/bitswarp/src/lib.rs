use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("7qAJVwNkPbzkNBXRLgt6J8ExqgRDZMrggUBaLm68PSFU");

#[program]
pub mod bitswarp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, ai_executor: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.owner = ctx.accounts.owner.key();
        config.ai_executor = ai_executor;
        msg!("🌌 BitSwarp Initialized. Owner: {}, AI: {}", config.owner, config.ai_executor);
        Ok(())
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        let ix = solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.vault.key(),
            amount,
        );
        solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let user_state = &mut ctx.accounts.user_state;
        user_state.sol_balance += amount;
        msg!("📥 Deposited {} SOL. New Balance: {}", amount, user_state.sol_balance);
        Ok(())
    }

    pub fn execute_swap(
        ctx: Context<ExecuteSwap>,
        amount_in: u64,
        amount_out: u64,
        is_buy: bool, // Simple toggle for SOL/Token swap logic
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        require_keys_eq!(ctx.accounts.executor.key(), config.ai_executor, BitSwarpError::Unauthorized);

        let user_state = &mut ctx.accounts.user_state;
        if is_buy {
            require!(user_state.sol_balance >= amount_in, BitSwarpError::InsufficientBalance);
            user_state.sol_balance -= amount_in;
            user_state.token_balance += amount_out;
        } else {
            require!(user_state.token_balance >= amount_in, BitSwarpError::InsufficientBalance);
            user_state.token_balance -= amount_in;
            user_state.sol_balance += amount_out;
        }

        msg!("⚡ AI Swap Executed: In={}, Out={}", amount_in, amount_out);
        Ok(())
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        require!(user_state.sol_balance >= amount, BitSwarpError::InsufficientBalance);

        user_state.sol_balance -= amount;
        
        let vault_seeds = &[b"vault".as_ref(), &[ctx.bumps.vault]];
        let signer = &[&vault_seeds[..]];

        let ix = solana_program::system_instruction::transfer(
            &ctx.accounts.vault.key(),
            &ctx.accounts.user.key(),
            amount,
        );
        solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.user.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer,
        )?;

        msg!("📤 Withdrawn {} SOL", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 32)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 8 + 8,
        seeds = [b"user-state", user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
    #[account(mut, seeds = [b"vault"], bump)]
    /// CHECK: Safe vault PDA
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteSwap<'info> {
    pub executor: Signer<'info>,
    #[account(seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub user_state: Account<'info, UserState>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, seeds = [b"user-state", user.key().as_ref()], bump)]
    pub user_state: Account<'info, UserState>,
    #[account(mut, seeds = [b"vault"], bump)]
    /// CHECK: Safe vault PDA
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Config {
    pub owner: Pubkey,
    pub ai_executor: Pubkey,
}

#[account]
pub struct UserState {
    pub sol_balance: u64,
    pub token_balance: u64, // Virtualized for simplicity in MVP
}

#[error_code]
pub enum BitSwarpError {
    #[msg("Unauthorized: Not the AI Executor")]
    Unauthorized,
    #[msg("Insufficient Balance")]
    InsufficientBalance,
}
