import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ChainCampus } from "../target/types/chain_campus";
import { expect } from "chai";

describe("chain_campus", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ChainCampus as Program<ChainCampus>;

  const studentId = "STU123";
  const studentName = "Alice Doe";
  const eventId = "EVT456";
  const capacity = 50;

  it("Registers a student", async () => {
    const [studentPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("student"), provider.wallet.publicKey.toBuffer(), Buffer.from(studentId)],
      program.programId
    );

    await program.methods
      .registerStudent(studentId, studentName)
      .accounts({
        student: studentPDA,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const studentAccount = await program.account.student.fetch(studentPDA);
    expect(studentAccount.studentId).to.equal(studentId);
    expect(studentAccount.name).to.equal(studentName);
  });

  it("Creates an event", async () => {
    const [eventPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("event"), provider.wallet.publicKey.toBuffer(), Buffer.from(eventId)],
      program.programId
    );

    const startTime = new anchor.BN(Date.now() / 1000 - 3600); // 1 hour ago
    const endTime = new anchor.BN(Date.now() / 1000 + 3600); // 1 hour later

    await program.methods
      .createEvent(eventId, capacity, startTime, endTime)
      .accounts({
        event: eventPDA,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const eventAccount = await program.account.event.fetch(eventPDA);
    expect(eventAccount.eventId).to.equal(eventId);
    expect(eventAccount.capacity).to.equal(capacity);
  });

  it("Registers a student for an event", async () => {
    const [studentPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("student"), provider.wallet.publicKey.toBuffer(), Buffer.from(studentId)],
      program.programId
    );
    const [eventPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("event"), provider.wallet.publicKey.toBuffer(), Buffer.from(eventId)],
      program.programId
    );
    const [registrationPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("registration"), studentPDA.toBuffer(), eventPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .registerForEvent()
      .accounts({
        registration: registrationPDA,
        student: studentPDA,
        event: eventPDA,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const registrationAccount = await program.account.eventRegistration.fetch(registrationPDA);
    expect(registrationAccount.student.toString()).to.equal(studentPDA.toString());
  });

  it("Marks attendance", async () => {
    const [studentPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("student"), provider.wallet.publicKey.toBuffer(), Buffer.from(studentId)],
      program.programId
    );
    const [eventPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("event"), provider.wallet.publicKey.toBuffer(), Buffer.from(eventId)],
      program.programId
    );
    const [attendancePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("attendance"), studentPDA.toBuffer(), eventPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .markAttendance()
      .accounts({
        attendance: attendancePDA,
        student: studentPDA,
        event: eventPDA,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const attendanceAccount = await program.account.attendanceRecord.fetch(attendancePDA);
    expect(attendanceAccount.verified).to.be.false;
  });

  it("Verifies attendance", async () => {
    const [studentPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("student"), provider.wallet.publicKey.toBuffer(), Buffer.from(studentId)],
      program.programId
    );
    const [eventPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("event"), provider.wallet.publicKey.toBuffer(), Buffer.from(eventId)],
      program.programId
    );
    const [attendancePDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("attendance"), studentPDA.toBuffer(), eventPDA.toBuffer()],
      program.programId
    );

    await program.methods
      .verifyAttendance()
      .accounts({
        attendance: attendancePDA,
        event: eventPDA,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const attendanceAccount = await program.account.attendanceRecord.fetch(attendancePDA);
    expect(attendanceAccount.verified).to.be.true;
  });
});
