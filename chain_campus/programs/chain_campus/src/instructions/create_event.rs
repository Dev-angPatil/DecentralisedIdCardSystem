use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(event_id: String)]
pub struct CreateEvent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Event::MAX_SIZE,
        seeds = [EVENT_SEED, authority.key().as_ref(), event_id.as_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateEvent>,
    event_id: String,
    capacity: u32,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    let event = &mut ctx.accounts.event;
    event.authority = ctx.accounts.authority.key();
    event.event_id = event_id;
    event.capacity = capacity;
    event.registrations = 0;
    event.start_time = start_time;
    event.end_time = end_time;
    event.bump = ctx.bumps.event;
    Ok(())
}
