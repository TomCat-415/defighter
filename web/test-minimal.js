// Minimal test - run this in browser console on your app page
async function testMinimal() {
  try {
    // Get wallet directly from window
    const wallet = window.phantom?.solana;
    if (!wallet?.isConnected) {
      console.log("Phantom not connected");
      return;
    }
    
    console.log("Wallet connected:", wallet.publicKey.toString());
    
    // Test a simple transaction
    const { Transaction, SystemProgram, PublicKey } = window.solanaWeb3;
    const tx = new Transaction();
    tx.add(SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: wallet.publicKey, // send to self
      lamports: 1
    }));
    
    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await window.connection.getLatestBlockhash()).blockhash;
    
    console.log("About to sign transaction...");
    const signed = await wallet.signTransaction(tx);
    console.log("SUCCESS: Transaction signed");
    
  } catch (e) {
    console.error("Minimal test failed:", e);
  }
}

// Run it
testMinimal();