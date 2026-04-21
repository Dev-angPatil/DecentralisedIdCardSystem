use anchor_lang::prelude::*;

#[error_code]
pub enum ChainCampusError {
    #[msg("Student is already registered.")]
    StudentAlreadyRegistered,
    #[msg("Event is already registered.")]
    EventAlreadyRegistered,
    #[msg("This event is full.")]
    EventFull,
    #[msg("Attendance marking window is closed.")]
    AttendanceWindowClosed,
    #[msg("You are not authorized to perform this action.")]
    Unauthorised,
    #[msg("The provided student ID is too long.")]
    StudentIdTooLong,
    #[msg("The provided event ID is too long.")]
    EventIdTooLong,
}
