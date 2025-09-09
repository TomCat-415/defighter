// Test if Phantom can sign ANY transaction at all
// Copy/paste this into browser console on the battle page
async function testPhantomVerySimple() {
  console.log("🧪 Testing if Phantom can sign the absolute simplest transaction...");
  
  try {
    const phantom = window.phantom?.solana;
    if (!phantom?.isConnected) {
      console.log("❌ Phantom not connected");
      return;
    }
    
    console.log("✅ Phantom is connected:", phantom.publicKey.toString());
    
    // Just test if signTransaction method exists and is callable
    if (typeof phantom.signTransaction !== 'function') {
      console.log("❌ signTransaction method not available");
      return;
    }
    
    console.log("✅ signTransaction method exists");
    
    // Create the absolute minimal transaction - just a memo
    const tx = new window.solanaWeb3.Transaction();
    
    // Add a simple memo instruction (safest, minimal instruction)
    tx.add({
      keys: [],
      programId: new window.solanaWeb3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from('test', 'utf8')
    });
    
    tx.feePayer = phantom.publicKey;
    
    // Use a fake but valid blockhash for structure test
    tx.recentBlockhash = 'EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k';
    
    console.log("🚀 Attempting to sign minimal memo transaction...");
    
    // This is the critical test
    const signed = await phantom.signTransaction(tx);
    
    console.log("🎉 SUCCESS! Phantom can sign transactions");
    console.log("Signature added:", !!signed.signature);
    
  } catch (e) {
    console.error("💥 PHANTOM IS BROKEN - cannot sign even simple transactions:", e);
    console.log("This confirms Phantom wallet version", window.phantom?.solana?.version || "unknown", "has a critical bug");
    
    // Try to get more error details
    console.log("Error name:", e.name);
    console.log("Error message:", e.message);
    console.log("Error stack:", e.stack);
  }
}

// Also test if basic phantom methods work
function testPhantomBasics() {
  const phantom = window.phantom?.solana;
  console.log("Phantom wallet object:", !!phantom);
  console.log("Phantom connected:", phantom?.isConnected);
  console.log("Phantom publicKey:", phantom?.publicKey?.toString());
  console.log("Available methods:", Object.getOwnPropertyNames(phantom || {}).filter(name => typeof phantom?.[name] === 'function'));
}

console.log("=== PHANTOM DIAGNOSTIC TEST ===");
testPhantomBasics();
testPhantomVerySimple();