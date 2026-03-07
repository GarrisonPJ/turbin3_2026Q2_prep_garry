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
        "Submitting enrollment transaction for Github:{}...",
        config.github_handle
    );

    match ops.enroll() {
        Ok(signature) => {
            println!("Success! Transaction Signature:");
            println!(
                "https://explorer.solana.com/tx/{}?cluster=devnet",
                signature
            );

            assert!(!signature.is_empty(), "Signature shouldn't be empty");

            Ok(())
        }
        Err(e) => {
            let mut is_network_error = false;

            for cause in e.chain() {
                if let Some(client_error) = cause.downcast_ref::<ClientError>() {
                    match client_error.kind() {
                        ClientErrorKind::RpcError(rpc_err) => {
                            eprintln!("Your transaction is refused:{:?}", rpc_err);
                        }
                        ClientErrorKind::Io(_) | ClientErrorKind::Reqwest(_) => {
                            eprintln!("RPC node connect failed or timeout");
                            is_network_error = true;
                        }
                        _ => {
                            eprintln!("Unknown Error:{:?}", client_error);
                        }
                    }
                }
            }

            if is_network_error {
                eprintln!("Please change your RPC node in .env and run again");
            } else {
                eprintln!("Deadly errors, program aborted");
            }

            Err(e)
        }
    }
}
