'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface Token {
    symbol: string;
    balance: string;
    usdValue: string;
    decimals: number;
    contractAddress: string;
}

export default function Navbar() {
    const [account, setAccount] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    const [network, setNetwork] = useState<string>("");
    const [showNetworkGuide, setShowNetworkGuide] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Token addresses on Immutable zkEVM Mainnet
    const TOKEN_CONTRACTS = {
        IMX: 'native', // IMX is the native token
        ETH: '0x52a6c53869ce09a731cd772f245b97a4401d3348', // WETH on Immutable
        GODS: '0xccC8cb5229B0ac8069C51fd58367Fd1e622aFD97', // Gods Unchained token
        USDC: '0x6de8acc0d406837030ce4dd28e7c08c5a96a30d2', // USDC on Immutable zkEVM
    };

    // Immutable zkEVM Mainnet Configuration
    const IMMUTABLE_ZKEVM_MAINNET = {
        chainId: '0x343B',  // 13371 in hex
        chainName: 'Immutable zkEVM',
        nativeCurrency: {
            name: 'Immutable X',
            symbol: 'IMX',
            decimals: 18
        },
        rpcUrls: ['https://rpc.immutable.com'],
        blockExplorerUrls: ['https://explorer.immutable.com']
    };

    useEffect(() => {
        checkIfWalletIsConnected();

        const { ethereum } = window as any;
        if (ethereum) {
            ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    fetchAllBalances(accounts[0]);
                } else {
                    setAccount("");
                    setTokens([]);
                }
            });

            ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            if (ethereum) {
                ethereum.removeListener('accountsChanged', () => { });
                ethereum.removeListener('chainChanged', () => { });
            }
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window as any;
            if (!ethereum) return;

            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                await checkNetwork();
                fetchAllBalances(accounts[0]);
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    };

    const checkNetwork = async () => {
        try {
            const { ethereum } = window as any;
            if (!ethereum) return;

            const chainId = await ethereum.request({ method: 'eth_chainId' });

            if (chainId === IMMUTABLE_ZKEVM_MAINNET.chainId) {
                setNetwork('Immutable zkEVM');
            } else {
                setNetwork('Wrong Network');
            }
        } catch (error) {
            console.error('Error checking network:', error);
        }
    };

    const fetchAllBalances = async (address: string) => {
        setIsLoadingBalances(true);
        const balances: Token[] = [];

        try {
            // Get ETH balance first
            const ethBalance = await getTokenBalance(address, TOKEN_CONTRACTS.ETH, 18);
            balances.push({
                symbol: 'ETH',
                balance: ethBalance,
                usdValue: await getUSDValue('ETH', ethBalance),
                decimals: 18,
                contractAddress: TOKEN_CONTRACTS.ETH
            });

            // Get GODS balance
            const godsBalance = await getTokenBalance(address, TOKEN_CONTRACTS.GODS, 18);
            balances.push({
                symbol: 'GODS',
                balance: godsBalance,
                usdValue: await getUSDValue('GODS', godsBalance),
                decimals: 18,
                contractAddress: TOKEN_CONTRACTS.GODS
            });

            // Get IMX (native token) balance
            const imxBalance = await getIMXBalance(address);
            balances.push({
                symbol: 'IMX',
                balance: imxBalance,
                usdValue: await getUSDValue('IMX', imxBalance),
                decimals: 18,
                contractAddress: 'native'
            });

            // Get USDC balance
            const usdcBalance = await getTokenBalance(address, TOKEN_CONTRACTS.USDC, 6);
            balances.push({
                symbol: 'USDC',
                balance: usdcBalance,
                usdValue: await getUSDValue('USDC', usdcBalance),
                decimals: 6,
                contractAddress: TOKEN_CONTRACTS.USDC
            });

            setTokens(balances);
        } catch (error) {
            console.error('Error fetching balances:', error);
        }

        setIsLoadingBalances(false);
    };

    const getIMXBalance = async (address: string): Promise<string> => {
        try {
            const { ethereum } = window as any;
            if (!ethereum) return '0.0000';

            const balance = await ethereum.request({
                method: 'eth_getBalance',
                params: [address, 'latest']
            });

            const imxBalance = parseInt(balance, 16) / Math.pow(10, 18);
            return imxBalance.toFixed(4);
        } catch (error) {
            console.error('Error getting IMX balance:', error);
            return '0.0000';
        }
    };

    const getTokenBalance = async (walletAddress: string, tokenAddress: string, decimals: number): Promise<string> => {
        try {
            const { ethereum } = window as any;
            if (!ethereum) return '0.0000';

            // ERC-20 balanceOf function signature
            const data = '0x70a08231000000000000000000000000' + walletAddress.slice(2);

            const balance = await ethereum.request({
                method: 'eth_call',
                params: [{
                    to: tokenAddress,
                    data: data
                }, 'latest']
            });

            if (!balance || balance === '0x' || balance === '0x0') return '0.0000';

            const tokenBalance = parseInt(balance, 16) / Math.pow(10, decimals);
            return tokenBalance.toFixed(4);
        } catch (error) {
            console.error(`Error getting token balance for ${tokenAddress}:`, error);
            return '0.0000';
        }
    };

    const getUSDValue = async (symbol: string, balance: string): Promise<string> => {
        try {
            // Fetch real-time prices from Immutable API
            const response = await fetch('https://checkout-api.immutable.com/v1/fiat/conversion?ids=ethereum,immutable-x,usd-coin,gods-unchained,guild-of-guardians,ravenquest,cross-the-ages,tokyo-games-token,immortal-token&currencies=usd,eth');
            const data = await response.json();

            // Map token symbols to API IDs
            const symbolToId: { [key: string]: string } = {
                'ETH': 'ethereum',
                'GODS': 'gods-unchained',
                'IMX': 'immutable-x',
                'USDC': 'usd-coin'
            };

            const tokenId = symbolToId[symbol];
            if (!tokenId || !data[tokenId]) {
                return '$0.00';
            }

            const price = data[tokenId].usd || 0;
            const usdValue = parseFloat(balance) * price;
            return `$${usdValue.toFixed(2)}`;
        } catch (error) {
            console.error('Error fetching USD value:', error);
            return '$0.00';
        }
    };

    const switchToImmutableZkEVM = async () => {
        try {
            const { ethereum } = window as any;
            if (!ethereum) {
                alert('MetaMask is not installed!');
                return;
            }

            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: IMMUTABLE_ZKEVM_MAINNET.chainId }],
                });
                setNetwork('Immutable zkEVM');
                setShowNetworkGuide(false);
            } catch (switchError: any) {
                if (switchError.code === 4902) {
                    try {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [IMMUTABLE_ZKEVM_MAINNET],
                        });
                        setNetwork('Immutable zkEVM');
                        setShowNetworkGuide(false);
                    } catch (addError: any) {
                        console.error('Failed to add network:', addError);
                        setShowNetworkGuide(true);
                    }
                } else if (switchError.code === 4001) {
                    console.log('User rejected network switch');
                } else {
                    console.error('Error switching network:', switchError);
                    setShowNetworkGuide(true);
                }
            }

            if (account) {
                fetchAllBalances(account);
            }
        } catch (error) {
            console.error('Unexpected error switching network:', error);
        }
    };

    const connectWallet = async () => {
        try {
            const { ethereum } = window as any;

            if (!ethereum) {
                alert("Please install MetaMask!");
                window.open("https://metamask.io/download/", "_blank");
                return;
            }

            setIsConnecting(true);

            const accounts = await ethereum.request({
                method: 'eth_requestAccounts'
            });

            setAccount(accounts[0]);

            await checkNetwork();
            const chainId = await ethereum.request({ method: 'eth_chainId' });

            if (chainId !== IMMUTABLE_ZKEVM_MAINNET.chainId) {
                await switchToImmutableZkEVM();
            }

            fetchAllBalances(accounts[0]);
            setIsConnecting(false);
        } catch (error: any) {
            console.error('Error connecting wallet:', error);
            if (error.code === 4001) {
                alert('Connection rejected. Please try again.');
            } else {
                alert('Failed to connect wallet. Please try again.');
            }
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount("");
        setTokens([]);
        setNetwork("");
        setShowDropdown(false);
        setShowNetworkGuide(false);
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(account);
        alert("Address copied!");
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        alert(`${label} copied to clipboard!`);
    };

    const getAvatarUrl = (address: string) => {
        return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`;
    };

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 flex items-center px-6 z-50 border-b border-lines bg-background">
            <div className="flex items-center gap-4 flex-1">
                <Link href='/' className="w-10 h-10 rounded-full flex items-center justify-center relative">
                    <Image
                        src="/assets/icon2.png"
                        alt="Chained Icon"
                        fill
                        className="object-contain scale-150"
                    />
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {!account ? (
                    <button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="px-6 h-10 rounded-lg bg-primary text-white font-medium transition hover:opacity-90 cursor-pointer disabled:opacity-50"
                    >
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                ) : (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="cursor-pointer w-10 h-10 rounded-full bg-gray-800 overflow-hidden relative hover:ring-2 hover:ring-primary transition"
                        >
                            <img
                                src={getAvatarUrl(account)}
                                alt="Wallet Avatar"
                                className="w-full h-full object-cover"
                            />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-80 bg-background rounded-lg shadow-xl border border-lines overflow-hidden z-50">
                                <div className="p-4 border-b bg-background">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden">
                                            <img
                                                src={getAvatarUrl(account)}
                                                alt="Wallet Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-400">{network || 'Loading...'}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm">{formatAddress(account)}</span>
                                                <button
                                                    onClick={copyAddress}
                                                    className="cursor-pointer text-gray-400 hover:text-white transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>



                                {showNetworkGuide && (
                                    <div className="p-4 bg-gray-800/50 border-b border-gray-700 text-xs space-y-3">
                                        <div className="font-semibold text-yellow-400">Manual Setup Instructions:</div>
                                        <div>
                                            <div className="text-gray-400 mb-1">1. Open MetaMask</div>
                                            <div className="text-gray-400 mb-1">2. Click network dropdown (top)</div>
                                            <div className="text-gray-400 mb-1">3. Click "Add Network"</div>
                                            <div className="text-gray-400 mb-2">4. Enter these details:</div>
                                        </div>

                                        <div className="space-y-2 bg-gray-900 p-2 rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Network Name:</span>
                                                <button
                                                    onClick={() => copyToClipboard('Immutable zkEVM', 'Network name')}
                                                    className="text-blue-400 hover:text-blue-300"
                                                >
                                                    Immutable zkEVM
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">RPC URL:</span>
                                                <button
                                                    onClick={() => copyToClipboard('https://rpc.immutable.com', 'RPC URL')}
                                                    className="text-blue-400 hover:text-blue-300 truncate ml-2"
                                                >
                                                    rpc.immutable.com
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Chain ID:</span>
                                                <button
                                                    onClick={() => copyToClipboard('13371', 'Chain ID')}
                                                    className="text-blue-400 hover:text-blue-300"
                                                >
                                                    13371
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Symbol:</span>
                                                <button
                                                    onClick={() => copyToClipboard('IMX', 'Symbol')}
                                                    className="text-blue-400 hover:text-blue-300"
                                                >
                                                    IMX
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Explorer:</span>
                                                <button
                                                    onClick={() => copyToClipboard('https://explorer.immutable.com', 'Explorer URL')}
                                                    className="text-blue-400 hover:text-blue-300 truncate ml-2"
                                                >
                                                    explorer.immutable.com
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-gray-500 italic">Click any value to copy</div>
                                    </div>
                                )}

                                {/* Balances Section */}
                                <div className="p-4 border-b border-gray-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm font-medium">Balances</div>
                                        <button
                                            onClick={() => fetchAllBalances(account)}
                                            className="text-gray-400 hover:text-white transition"
                                            disabled={isLoadingBalances}
                                        >
                                            <svg className={`w-4 h-4 ${isLoadingBalances ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>

                                    {isLoadingBalances ? (
                                        <div className="text-center py-4 text-gray-400">Loading balances...</div>
                                    ) : tokens.length > 0 ? (
                                        <div className="space-y-2">
                                            {tokens.map((token, index) => (
                                                <div key={index} className="flex items-center justify-between py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 relative">
                                                            <Image
                                                                src={`/assets/currency/${token.symbol}.png`}
                                                                alt={token.symbol}
                                                                fill
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        <span className="font-medium">{token.symbol}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-medium">{token.balance}</div>
                                                        <div className="text-xs text-gray-400">{token.usdValue}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-400">No tokens found</div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="p-3 grid grid-cols-4 gap-2">
                                    <button className="flex flex-col items-center gap-1 p-2 hover:bg-gray-800 rounded-lg transition">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <span className="text-xs">Add</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-1 p-2 hover:bg-gray-800 rounded-lg transition">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                            </svg>
                                        </div>
                                        <span className="text-xs">Bridge</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-1 p-2 hover:bg-gray-800 rounded-lg transition">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                        </div>
                                        <span className="text-xs">Swap</span>
                                    </button>
                                    <button className="flex flex-col items-center gap-1 p-2 hover:bg-gray-800 rounded-lg transition">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                        <span className="text-xs">Send</span>
                                    </button>
                                </div>

                                {/* Menu Items */}
                                <div className="border-t border-gray-700">
                                    <button
                                        onClick={() => window.open(`https://explorer.immutable.com/address/${account}`, '_blank')}
                                        className="cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-800 transition text-sm"
                                    >
                                        View on Explorer
                                    </button>
                                    <button
                                        onClick={disconnectWallet}
                                        className="cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-800 transition text-sm text-red-400"
                                    >
                                        Disconnect Wallet
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}