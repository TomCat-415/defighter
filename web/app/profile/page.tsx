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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRpcUrl(process.env.NEXT_PUBLIC_RPC_URL || 'Unknown');
    }
  }, []);

  const program = publicKey && wallet ? getProgram(connection, wallet.adapter as any) : null;
  const [playerPdaAddr] = publicKey ? playerPda(publicKey) : [null];

  // Fetch player and config data
  const fetchData = useCallback(async () => {
    if (!program || !publicKey || !playerPdaAddr) return;
    
    setLoading(true);
    try {
      // Fetch config
      const [configAddr] = configPda();
      const configInfo = await connection.getAccountInfo(configAddr);
      if (configInfo) {
        console.log('Config account exists, fetching...');
        const configData = await program.account.balanceConfig.fetch(configAddr) as any;
        console.log('Config data:', configData);
        setConfig(configData);
      } else {
        console.log('Config account does not exist');
      }

      // Fetch player
      const playerInfo = await connection.getAccountInfo(playerPdaAddr);
      if (playerInfo) {
        console.log('Player account exists, fetching...', playerPdaAddr.toBase58());
        const playerData = await program.account.player.fetch(playerPdaAddr) as any;
        console.log('Player data:', playerData);
        setPlayer({
          authority: playerData.authority,
          class: playerData.class,
          abilities: playerData.abilities,
          xp: playerData.xp?.toNumber ? playerData.xp.toNumber() : playerData.xp,
          elo: 0 // Skip ELO for now
        });
      } else {
        console.log('Player account does not exist', playerPdaAddr.toBase58());
        setPlayer(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      showErrorToast('Failed to load', error.message || 'Could not fetch player data');
    } finally {
      setLoading(false);
    }
  }, [program, connection, publicKey, playerPdaAddr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create player
  const createPlayer = async () => {
    if (!program || !publicKey || !playerPdaAddr) return;
    
    setCreating(true);
    try {
      const classVariant = { [selectedClass]: {} };
      const tx = await program.methods
        .createPlayer(classVariant)
        .accounts({
          player: playerPdaAddr,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      
      showSuccessToast('Player created!', `Class: ${CLASS_NAMES[selectedClass as keyof typeof CLASS_NAMES]}`);
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Failed to create player:', error);
      showErrorToast('Creation failed', error.message || 'Unknown error');
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
        <h3 className="font-semibold text-lg">Diagnostics</h3>
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
              <label key={key} className="flex items-center space-x-3 cursor-pointer">
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
                const abilityName = ['Shitpost', 'Build', 'VC Network'][index];
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
          </div>
        </div>
      )}
    </div>
  );
}


