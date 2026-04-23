Write-Host "Installing Rust..."
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"
.\rustup-init.exe -y --default-toolchain stable --profile minimal
$env:Path += ";$env:USERPROFILE\.cargo\bin"

Write-Host "Installing Solana..."
Invoke-WebRequest -Uri "https://release.anza.xyz/v1.18.17/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "solana-install-init.exe" -UseBasicParsing
.\solana-install-init.exe v1.18.17
$env:Path += ";C:\solana-install\bin"  # Adjust if installed elsewhere. Usually %USERPROFILE%/.local/share/solana/install/active_release/bin

Write-Host "Attempting to install AVM (Anchor Version Manager)..."
# We wrap this in a block because it can fail without MSVC C++ Build Tools
try {
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
} catch {
    Write-Host "AVM installation failed. You might need to install Visual Studio C++ Build Tools and reboot."
}
Write-Host "Installation script completed."
