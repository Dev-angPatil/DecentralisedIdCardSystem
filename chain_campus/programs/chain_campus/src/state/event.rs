wuse anchor_lang::prelude::*;

#[account]
pub struct Event {
    pub authority: Pubkey, // 32
    pub event_id: String, // 4 + 32
    pub title: String, // 4 + 64
    pub venue: String, // 4 + 64
    pub capacity: u32, // 4
    pub registrations: u32, // 4
    pub start_time: i64, // 8
    pub end_time: i64, // 8
    pub bump: u8, // 1
}

impl Event {
    pub const MAX_SIZE: usize = 32 + 36 + 68 + 68 + 4 + 4 + 8 + 8 + 1;
}
