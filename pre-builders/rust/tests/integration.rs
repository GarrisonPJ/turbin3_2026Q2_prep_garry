use anyhow::Result;
use rust_prereq::config::Config;
use rust_prereq::solana_ops::SolanaOps;
use solana_client::client_error::{ClientError, ClientErrorKind};

#[test]
#[ignore] //Prevent CI/CD auto runtime error
fn test_enroll() -> Result<()> {
    let config = Config::load()?;

    let ops = SolanaOps::new(&config)?;

    println!(
        "[INFO] Submitting enrollment transaction for Github:{}...",
        config.github_handle
    );

    match ops.enroll() {
        Ok(signature) => {
            println!("[INFO] Success! Transaction Signature:");
            println!(
                "https://explorer.solana.com/tx/{}?cluster=devnet",
                signature
            );

            assert!(
                signature.len() > 64,
                "[WARN] Signature length is unusually short, expect valid Base58 hash"
            );

            Ok(())
        }
        Err(e) => {
            let mut is_network_error = false;
            let mut is_already_enrolled = false;

            for cause in e.chain() {
                if let Some(client_error) = cause.downcast_ref::<ClientError>() {
                    match client_error.kind() {
                        ClientErrorKind::RpcError(rpc_err) => {
                            let err_str = format!("{:?}", rpc_err);
                            if err_str.contains("already in use")
                                || err_str.contains("custom program error: 0x0")
                            {
                                is_already_enrolled = true;
                            } else {
                                eprintln!("[ERROR] Your transaction is refused:{:?}", rpc_err);
                            }
                        }
                        ClientErrorKind::Io(_) | ClientErrorKind::Reqwest(_) => {
                            eprintln!("[WARN] RPC endpoint connect failed or timeout");
                            is_network_error = true;
                        }
                        _ => {
                            eprintln!("[ERROR] Unknown Error:{:?}", client_error);
                        }
                    }
                }
            }

            if is_already_enrolled {
                println!("[INFO] You have already enrolled.");
                return Ok(());
            } else if is_network_error {
                eprintln!("[ERROR] Please change your RPC node in .env and run again");
            } else {
                eprintln!("[ERROR] Fatal errors, program aborted");
            }

            Err(e)
        }
    }
}
