use anyhow::Result;
use rust_prereq::config::Config;
use rust_prereq::solana_ops::SolanaOps;

#[test]
#[ignore] //Prevent CI/CD auto runtime error
fn test_enroll() -> Result<()> {
    let config = Config::load()?;

    let ops = SolanaOps::new(&config, "dev-wallet.json")?;

    println!(
        "Submitting enrollment transaction for Github:{}...",
        config.github_handle
    );

    let signature = ops.enroll()?;

    println!("Succcss! Transaction Signature:");
    println!(
        "https://explorer.solana.com/tx/{}?cluster=devnet",
        signature
    );

    Ok(())
}
