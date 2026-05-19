use anchor_lang::prelude::*;

#[account]
pub struct Scholarship {
    pub authority: Pubkey,
    pub scholarship_id: String,
    pub title: String,
    pub description: String,
    pub eligibility: String,
    pub amount: u64,
    pub deadline: i64,
    pub applications: u32,
    pub bump: u8,
}

impl Scholarship {
    // pubkey + id + title + description + eligibility + amount + deadline + applications + bump
    pub const MAX_SIZE: usize = 32 + (4 + 32) + (4 + 80) + (4 + 240) + (4 + 180) + 8 + 8 + 4 + 1;
}

#[account]
pub struct ScholarshipApplication {
    pub scholarship: Pubkey,
    pub student: Pubkey,
    pub applicant: Pubkey,
    pub statement: String,
    pub status: u8,
    pub applied_at: i64,
    pub reviewed_at: i64,
    pub bump: u8,
}

impl ScholarshipApplication {
    // status: 0 = pending, 1 = approved, 2 = rejected
    pub const MAX_SIZE: usize = 32 + 32 + 32 + (4 + 240) + 1 + 8 + 8 + 1;
}
