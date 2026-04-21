use anchor_lang::prelude::*;

#[account]
pub struct EventRegistration {
    pub student: Pubkey, // 32
    pub event: Pubkey, // 32
    pub timestamp: i64, // 8
    pub bump: u8, // 1
}

impl EventRegistration {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 1;
}

#[account]
pub struct AttendanceRecord {
    pub student: Pubkey, // 32
    pub event: Pubkey, // 32
    pub verified: bool, // 1
    pub timestamp: i64, // 8
    pub bump: u8, // 1
}

impl AttendanceRecord {
    pub const MAX_SIZE: usize = 32 + 32 + 1 + 8 + 1;
}
