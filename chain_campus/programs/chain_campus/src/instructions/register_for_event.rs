use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct RegisterForEvent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + EventRegistration::MAX_SIZE,
        seeds = [REGISTRATION_SEED, student.key().as_ref(), event.key().as_ref()],
        bump
    )]
    pub registration: Account<'info, EventRegistration>,
    pub student: Account<'info, Student>,
    #[account(mut)]
    pub event: Account<'info, Event>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RegisterForEvent>) -> Result<()> {
    let event = &mut ctx.accounts.event;
    
    // Check capacity
    if event.registrations >= event.capacity {
        return err!(ChainCampusError::EventFull);
    }

    let registration = &mut ctx.accounts.registration;
    registration.student = ctx.accounts.student.key();
    registration.event = ctx.accounts.event.key();
    registration.timestamp = Clock::get()?.unix_timestamp;
    registration.bump = ctx.bumps.registration;

    event.registrations += 1;
    
    Ok(())
}
