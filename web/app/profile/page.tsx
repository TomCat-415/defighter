"use client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState, useCallback } from "react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram, getProgramId } from "@/lib/program";
import { playerPda, configPda } from "@/lib/pdas";
import { 
  CLASS_NAMES, 
  getClassSpecificPowerDisplay, 
  calculateUpgradeCost, 
  calculatePowerLevel, 
  formatAddress, 
  copyToClipboard 
} from "@/lib/profile-utils";
import { showSuccessToast, showErrorToast, showInfoToast } from "@/lib/toast";

interface PlayerData {
  authority: PublicKey;
  class: any;
  abilities: number[];
  xp: number;
  elo?: number;
}

interface BalanceConfig {
  base: number;
  linear_a: number;
  max_level: number;
  xp_base: number;
  upgrade_c0: number;
  upgrade_p_bps: number;
  [key: string]: any;
}

export default function ProfilePage() {
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [config, setConfig] = useState<BalanceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [upgrading, setUpgrading] = useState<number | null>(null);
  const [airdropping, setAirdropping] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('shitposter');
  const [rpcUrl, setRpcUrl] = useState<string>('');
  
  // Network mismatch warning
  const [networkMismatch, setNetworkMismatch] = useState(false);
  
  // Rate limiting protection
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [fetchAttempts, setFetchAttempts] = useState<number>(0);
  
  // Debug mode for testing create flow
  const [debugMode, setDebugMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRpcUrl(process.env.NEXT_PUBLIC_RPC_URL || 'Unknown');
    }
  }, []);

  const program = publicKey && wallet ? getProgram(connection, wallet.adapter as any) : null;
  const [playerPdaAddr] = publicKey ? playerPda(publicKey) : [null];

  // Fetch player and config data
  const fetchData = useCallback(async (skipDebugMode = false) => {
    if (!program || !publicKey || !playerPdaAddr) return;
    
    // Skip fetching if in debug mode (unless explicitly overridden)
    if (debugMode && !skipDebugMode) {
      console.log('Skipping fetch due to debug mode');
      setLoading(false);
      return;
    }
    
    // Rate limiting protection - prevent excessive calls
    const now = Date.now();
    if (now - lastFetchTime < 2000) { // 2 second minimum between calls
      console.log('Skipping fetch due to rate limiting');
      return;
    }
    
    // Exponential backoff for repeated failures
    if (fetchAttempts > 5) {
      console.log('Too many fetch attempts, stopping');
      showErrorToast('Connection issues', 'Please refresh the page or try again later');
      return;
    }
    
    setLastFetchTime(now);
    setLoading(true);
    
    try {
      // Fetch config
      const [configAddr] = configPda();
      const configInfo = await connection.getAccountInfo(configAddr);
      if (configInfo) {
        const configData = await program.account.balanceConfig.fetch(configAddr) as any;
        setConfig(configData);
      }

      // Fetch player (respect debug mode)
      if (!debugMode) {
        const playerInfo = await connection.getAccountInfo(playerPdaAddr);
        if (playerInfo) {
          const playerData = await program.account.player.fetch(playerPdaAddr) as any;
          setPlayer({
            authority: playerData.authority,
            class: playerData.class,
            abilities: playerData.abilities,
            xp: playerData.xp?.toNumber ? playerData.xp.toNumber() : playerData.xp,
            elo: 0 // Skip ELO for now
          });
        } else {
          setPlayer(null);
        }
      }
      
      // Reset attempts on success
      setFetchAttempts(0);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setFetchAttempts(prev => prev + 1);
      
      // Only show toast for first few attempts to avoid spam
      if (fetchAttempts < 3) {
        if (error.message?.includes('429') || error.message?.includes('rate')) {
          showErrorToast('Rate limited', 'Slowing down requests...');
        } else {
          showErrorToast('Failed to load', error.message || 'Could not fetch player data');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [program, connection, publicKey, playerPdaAddr, lastFetchTime, fetchAttempts, debugMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create player
  const createPlayer = async () => {
    if (!program || !publicKey || !playerPdaAddr) {
      showErrorToast('Error', 'Wallet not connected or program not available');
      return;
    }
    
    if (!selectedClass) {
      showErrorToast('Error', 'Please select a class first');
      return;
    }
    
    setCreating(true);
    try {
      console.log('Creating player with class:', selectedClass);
      const classVariant = { [selectedClass]: {} };
      console.log('Class variant:', classVariant);
      
      const tx = await program.methods
        .createPlayer(classVariant)
        .accounts({
          player: playerPdaAddr,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      
      console.log('Player created! Transaction:', tx);
      showSuccessToast(
        'Fighter created successfully!', 
        `Your ${CLASS_NAMES[selectedClass as keyof typeof CLASS_NAMES]} is ready for battle!`
      );
      // Exit debug mode and refresh data
      setDebugMode(false);
      await fetchData(true); // Skip debug mode for this fetch
    } catch (error: any) {
      console.error('Failed to create player:', error);
      console.error('Error details:', error.message, error.logs);
      showErrorToast('Creation failed', error.message || 'Unknown error occurred');
    } finally {
      setCreating(false);
    }
  };

  // Upgrade ability
  const upgradeAbility = async (abilityIndex: number) => {
    if (!program || !publicKey || !playerPdaAddr || !player || !config) return;
    
    const currentLevel = player.abilities[abilityIndex];
    const cost = calculateUpgradeCost(currentLevel, config.upgrade_c0, config.upgrade_p_bps);
    
    if (currentLevel >= config.max_level) {
      showInfoToast('Max level reached', 'This ability is already at maximum level');
      return;
    }
    
    if (player.xp < cost) {
      showInfoToast('Insufficient XP', `Need ${cost} XP (you have ${player.xp})`);
      return;
    }

    setUpgrading(abilityIndex);
    try {
      const tx = await program.methods
        .upgradeAbility(abilityIndex)
        .accounts({
          player: playerPdaAddr,
          authority: publicKey,
        } as any)
        .rpc();
      
      showSuccessToast('Upgrade successful!', `Level ${currentLevel} → ${currentLevel + 1}`);
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Failed to upgrade:', error);
      showErrorToast('Upgrade failed', error.message || 'Unknown error');
    } finally {
      setUpgrading(null);
    }
  };

  // Airdrop SOL
  const requestAirdrop = async (amount = 2) => {
    if (!publicKey) return;
    
    setAirdropping(true);
    try {
      const sig = await connection.requestAirdrop(publicKey, amount * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
      showSuccessToast('Airdrop successful!', `${amount} SOL added to wallet`);
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('rate')) {
        showInfoToast('Rate limited', 'Use devnet faucet: https://faucet.solana.com/devnet');
      } else {
        showErrorToast('Airdrop failed', error.message || 'Unknown error');
      }
    } finally {
      setAirdropping(false);
    }
  };

  // Copy address helper
  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      showSuccessToast(`${label} copied!`);
    } else {
      showErrorToast('Copy failed', 'Please copy manually');
    }
  };

  if (!publicKey) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Profile</h2>
        <div className="rounded bg-slate-800 p-6 text-center">
          <p className="text-lg opacity-80">Connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  const powerLevel = player && config ? calculatePowerLevel(player.abilities, config) : 0;
  const fighterClassName = player?.class ? Object.keys(player.class)[0] : '';
  const powerDisplay = fighterClassName ? getClassSpecificPowerDisplay(fighterClassName, powerLevel) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile</h2>
      
      {/* Network mismatch warning */}
      {networkMismatch && (
        <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Wallet network doesn't match app RPC</span>
          </div>
        </div>
      )}

      {/* Diagnostics */}
      <div className="rounded-lg bg-slate-800 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Diagnostics</h3>
          <button
            onClick={() => {
              setFetchAttempts(0);
              setLastFetchTime(0);
              setDebugMode(false);  // Exit debug mode when refreshing
              fetchData(true);      // Force refresh regardless of debug mode
            }}
            disabled={loading}
            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 px-3 py-1 rounded"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {fetchAttempts > 0 && (
          <div className="text-xs bg-yellow-600/20 border border-yellow-600/50 rounded p-2">
            Connection issues detected. Attempts: {fetchAttempts}/5
            {fetchAttempts >= 5 && ' - Please refresh the page'}
          </div>
        )}
        
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-70">RPC:</span>
            <span className="font-mono">{formatAddress(rpcUrl, 12)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Program ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{formatAddress(getProgramId())}</span>
              <button
                onClick={() => handleCopy(getProgramId().toBase58(), 'Program ID')}
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                copy
              </button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">Authority:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{formatAddress(publicKey)}</span>
              <button
                onClick={() => handleCopy(publicKey.toBase58(), 'Authority')}
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                copy
              </button>
            </div>
          </div>
          {playerPdaAddr && (
            <div className="flex justify-between">
              <span className="opacity-70">Player PDA:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{formatAddress(playerPdaAddr)}</span>
                <button
                  onClick={() => handleCopy(playerPdaAddr.toBase58(), 'Player PDA')}
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Airdrop (devnet only) */}
      {rpcUrl.includes('devnet') && (
        <div className="rounded-lg bg-slate-800 p-4">
          <button
            onClick={() => requestAirdrop(2)}
            disabled={airdropping}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 px-4 py-2 rounded-lg"
          >
            {airdropping ? 'Airdropping...' : 'Airdrop 2 SOL (devnet)'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg bg-slate-800 p-6 text-center">
          <p>Loading player data...</p>
        </div>
      ) : !player ? (
        /* Create Player Flow */
        <div className="rounded-lg bg-slate-800 p-6 space-y-4">
          <h3 className="text-xl font-semibold">Create Your Fighter</h3>
          <p className="opacity-80">Choose your class to begin your DeFi fighting journey:</p>
          
          <div className="grid gap-4">
            {Object.entries(CLASS_NAMES).map(([key, name]) => (
              <label 
                key={key} 
                className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                  selectedClass === key 
                    ? 'border-indigo-500 bg-indigo-500/20' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="class"
                  value={key}
                  checked={selectedClass === key}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-semibold">{name}</div>
                  <div className="text-sm opacity-70">
                    {key === 'shitposter' && 'Master of memes and market manipulation'}
                    {key === 'builder' && 'Code wizard and protocol architect'}
                    {key === 'vc' && 'Network effect amplifier and deal maker'}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={createPlayer}
            disabled={creating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold"
          >
            {creating ? 'Creating Fighter...' : 'Create Fighter'}
          </button>
        </div>
      ) : (
        /* Player Profile */
        <div className="space-y-4">
          {/* Player Card */}
          <div className="rounded-lg bg-slate-800 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {CLASS_NAMES[fighterClassName as keyof typeof CLASS_NAMES] || 'Unknown Class'}
                </h3>
                <p className="text-sm opacity-70">Level {Math.max(...player.abilities)} Fighter</p>
              </div>
              {powerDisplay && (
                <div className="text-right">
                  <div className="text-sm opacity-70">{powerDisplay.label}</div>
                  <div className="text-lg font-semibold text-green-400">{powerDisplay.value}</div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm opacity-70">Experience Points</div>
                <div className="text-lg font-semibold">{player.xp.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Total Levels</div>
                <div className="text-lg font-semibold">{player.abilities.reduce((a, b) => a + b, 0)}</div>
              </div>
            </div>

            {/* Abilities */}
            <div className="space-y-3">
              <h4 className="font-semibold">Abilities</h4>
              {player.abilities.map((level, index) => {
                // Get class-specific move names
                const MOVE_NAMES_BY_CLASS = {
                  shitposter: ["MemeBomb", "RugPullRumor"],
                  builder: ["ShipIt", "TestnetDeploy"], 
                  vc: ["SeriesACannon", "ExitLiquidity"]
                };
                
                const classMoves = MOVE_NAMES_BY_CLASS[fighterClassName as keyof typeof MOVE_NAMES_BY_CLASS] || ["Unknown", "Unknown"];
                const abilityName = classMoves[index] || `Move ${index + 1}`;
                const cost = config ? calculateUpgradeCost(level, config.upgrade_c0, config.upgrade_p_bps) : 0;
                const canUpgrade = level < (config?.max_level || 100) && player.xp >= cost;
                const isMaxLevel = level >= (config?.max_level || 100);
                const isUpgrading = upgrading === index;

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div>
                      <div className="font-medium">{abilityName}</div>
                      <div className="text-sm opacity-70">Level {level}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isMaxLevel && (
                        <div className="text-sm opacity-70">
                          Cost: {cost.toLocaleString()} XP
                        </div>
                      )}
                      <button
                        onClick={() => upgradeAbility(index)}
                        disabled={!canUpgrade || isUpgrading || isMaxLevel}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium min-w-[80px]"
                      >
                        {isUpgrading ? '...' : isMaxLevel ? 'MAX' : 'Upgrade'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Debug: Test Create Flow Button */}
            <div className="mt-6 p-4 border border-yellow-600/50 rounded-lg bg-yellow-600/10">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">Debug Mode</h4>
              <p className="text-xs opacity-70 mb-3">
                Test the character creation flow without affecting your real player data.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDebugMode(true);
                    setPlayer(null);
                    showInfoToast('Debug mode ON', 'Character creation flow active');
                  }}
                  className="text-xs bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded"
                >
                  Test Create Flow
                </button>
                {debugMode && (
                  <button
                    onClick={() => {
                      setDebugMode(false);
                      fetchData(true);
                      showInfoToast('Debug mode OFF', 'Returning to normal mode');
                    }}
                    className="text-xs bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
                  >
                    Exit Debug Mode
                  </button>
                )}
              </div>
              {debugMode && (
                <div className="mt-2 text-xs text-yellow-300">
                  🟡 Debug mode active - Create flow simulation
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


