'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
    const [account, setAccount] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        checkIfWalletIsConnected();

        // Listen for account changes
        const { ethereum } = window as any;
        if (ethereum) {
            ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    setAccount("");
                }
            });
        }

        return () => {
            if (ethereum) {
                ethereum.removeListener('accountsChanged', () => { });
            }
        };
    }, []);

    const checkIfWalletIsConnected = async () => {
        try {
            const { ethereum } = window as any;
            if (!ethereum) return;

            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            }
        } catch (error) {
            console.error(error);
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
            setIsConnecting(false);
        } catch (error) {
            console.error(error);
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount("");
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
                    <div className="flex items-center gap-3">
                        <div className="px-4 h-10 rounded-lg bg-gray-800 flex items-center justify-center font-mono text-sm">
                            {formatAddress(account)}
                        </div>
                        <button
                            onClick={disconnectWallet}
                            className="px-4 h-10 rounded-lg bg-red-600 text-white text-sm transition hover:opacity-90"
                        >
                            Disconnect
                        </button>
                    </div>
                )}
                <div className="w-10 h-10 rounded-full bg-gray-800"></div>
            </div>
        </nav>
    );
}