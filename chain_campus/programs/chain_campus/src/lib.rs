use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Fg6Pa4H2X4CWdU3EajNf8C8ViPyMskGuFA6shVe6icMd");

#[program]
pub mod chain_campus {
    use super::*;

    pub fn register_student(ctx: Context<RegisterStudent>, student_id: String, name: String, department: String, semester: String, email: String) -> Result<()> {
        instructions::register_student::handler(ctx, student_id, name, department, semester, email)
    }

    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_id: String,
        title: String,
        description: String,
        venue: String,
        capacity: u32,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        instructions::create_event::handler(ctx, event_id, title, description, venue, capacity, start_time, end_time)
    }

    pub fn register_for_event(ctx: Context<RegisterForEvent>) -> Result<()> {
        instructions::register_for_event::handler(ctx)
    }

    pub fn mark_attendance(ctx: Context<MarkAttendance>) -> Result<()> {
        instructions::mark_attendance::handler(ctx)
    }

    pub fn verify_attendance(ctx: Context<VerifyAttendance>) -> Result<()> {
        instructions::verify_attendance::handler(ctx)
    }

    pub fn enroll_course(ctx: Context<EnrollCourse>, course_id: String) -> Result<()> {
        instructions::enroll_course::handler(ctx, course_id)
    }

    pub fn create_course(
        ctx: Context<CreateCourse>,
        course_id: String,
        name: String,
        credits: u8,
        instructor: String,
    ) -> Result<()> {
        instructions::create_course::handler(ctx, course_id, name, credits, instructor)
    }
}
