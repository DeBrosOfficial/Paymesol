import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { encodeURL } from '@solana/pay';
import { PublicKey } from '@solana/web3.js';
import QRCode from 'qrcode';
import BigNumber from 'bignumber.js';
import eurcIcon from './images/eurc-icon.png';
import solIcon from './images/solana2-logo.png';
import usdcIcon from './images/usdc-icon.png';
import logoIcon from './images/paymesol.png';
import phantomIcon from './images/phantom.png';
import helpIcon from './images/help.png';
import logoutIcon from './images/logout.png';
import debrosIcon from './images/debros.png';

// Constants for token addresses
const tokenMints = {
    EURC: new PublicKey('HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr'),
    USDC: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    SOL: null
};

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

function App() {
    const wallet = useWallet();
    const [eurAmount, setEurAmount] = useState('');
    const [convertedAmount, setConvertedAmount] = useState('');
    const [selectedToken, setSelectedToken] = useState('EURC');

    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    useEffect(() => {
        const fetchConversionRate = async () => {
            if (!eurAmount || !selectedToken) return;

            const cryptoIdMap = {
                EURC: 'euro-coin',
                USDC: 'usd-coin',
                SOL: 'solana'
            };
            const cryptoId = cryptoIdMap[selectedToken];

            try {
                const response = await fetch(`${COINGECKO_API_URL}?ids=${cryptoId}&vs_currencies=eur`);
                const data = await response.json();
                const conversionRate = data[cryptoId].eur;
                const amount = parseFloat(eurAmount) / conversionRate;
                setConvertedAmount(amount.toFixed(4));
            } catch (error) {
                console.error("Failed to fetch conversion rate:", error);
            }
        };

        fetchConversionRate();
    }, [eurAmount, selectedToken]);

    const handleKeypadInput = (value) => {
        if (value === '.' && eurAmount.includes('.')) return;
        if (value === '.' && eurAmount === '') setEurAmount('0.');
        else setEurAmount((prev) => (prev === '0' ? value : prev + value));
    };

    const clearInput = () => setEurAmount('');

    const generatePaymentURL = async (recipientAddress) => {
        const recipient = new PublicKey(recipientAddress);
        if (!convertedAmount || isNaN(convertedAmount)) {
            alert("Please enter a valid EUR amount to convert before generating the QR code.");
            return null;
        }

        const amount = new BigNumber(convertedAmount);
        const tokenMint = tokenMints[selectedToken];

        return encodeURL({
            recipient,
            amount,
            splToken: tokenMint,
            label: "Paymesol QR Payment",
            message: "Thank you for your payment!",
        });
    };

    const displayQRCode = async () => {
        if (!wallet.connected || !wallet.publicKey) {
            alert("Please connect your wallet before generating the QR code.");
            return;
        }

        const recipientAddress = wallet.publicKey.toString();
        const paymentURL = await generatePaymentURL(recipientAddress);
        if (!paymentURL) return;

        QRCode.toCanvas(document.getElementById('qr-canvas'), paymentURL, (error) => {
            if (error) console.error(error);
            console.log('QR code generated!');
        });

        document.getElementById('qr-modal').style.display = 'flex';
    };

    const handleLogout = async () => {
        // Disconnect the wallet
        if (wallet.connected) {
            await wallet.disconnect();
        }

        // Clear cookies (limited to specific cookies if known)
        document.cookie.split(";").forEach((cookie) => {
            const [name] = cookie.split("=");
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        // Redirect to homepage
        window.location.reload(true);

    };

    return (
        <div className="app-container">
            {/* Logo */}
            <div className="logo-container">
                <img src={logoIcon} alt="payme.sol logo" className="logo" />
            </div>

            {/* Wallet Connect Button */}
            <WalletMultiButton style={{ width: '285px', justifyContent: 'center', backgroundColor: '#ab9ff2', font: '25px', height: '35px' }} />
            <label htmlFor="radio-dropdown" style={{ color: 'white' }}>Choose Cryptocurrency:</label>
            {/* Cryptocurrency Selection */}
            <div className="radio-dropdown">
    <input
        type="radio"
        id="eurc"
        name="token"
        value="EURC"
        checked={selectedToken === 'EURC'}
        onChange={() => setSelectedToken('EURC')}
    />
    <label htmlFor="eurc">
        <img src={eurcIcon} alt="EURC Icon" className="icon" /> EURC
    </label>

    <input
        type="radio"
        id="sol"
        name="token"
        value="SOL"
        checked={selectedToken === 'SOL'}
        onChange={() => setSelectedToken('SOL')}
    />
    <label htmlFor="sol">
        <img src={solIcon} alt="SOL Icon" className="icon" /> SOL
    </label>

    <input
        type="radio"
        id="usdc"
        name="token"
        value="USDC"
        checked={selectedToken === 'USDC'}
        onChange={() => setSelectedToken('USDC')}
    />
    <label htmlFor="usdc">
        <img src={usdcIcon} alt="USDC Icon" className="icon"  /> USDC
    </label>
</div>

                <label htmlFor="eur-amount" style={{ color: 'white' }}>Amount in Euro:</label>
                {/* Euro Amount Input */}
                <input type="text" value={eurAmount} placeholder="" readOnly />

                {/* Keypad */}
                <div className="keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((key) => (
                    <button key={key} onClick={() => handleKeypadInput(key.toString())}>{key}</button>
                ))}
                <button onClick={clearInput} className="clear">Clear</button>
                </div>

               

          
            <label htmlFor="converted-amount" style={{ color: 'white' }}>Amount in Cryptocurrency:</label>
            {/* Converted Amount Display */}
            <input type="text" value={convertedAmount} placeholder="" readOnly />

            {/* Generate QR Code Button */}
            <button onClick={displayQRCode} id="generate-qr">Generate QR Code</button>

            {/* QR Modal */}
            <div id="qr-modal" className="modal">
                <div className="modal-content">
                    <h3>Payment QR Code</h3>
                    <canvas id="qr-canvas"></canvas>
                    <button onClick={() => (document.getElementById('qr-modal').style.display = 'none')} className="close-button">CLOSE</button>
                </div>
            </div>

            {/* Footer with icons */}
 <div className="footer-icons">
            <a href="#" onClick={handleLogout}>
                <img src={logoutIcon} alt="Logout" className="footer-icon" />
            </a>
            <a href="https://debros.io" target="_blank" rel="noopener noreferrer">
        <img src={debrosIcon} alt="DeBros" className="footer-icon" />
             </a>
            <a href="https://phantom.app" target="_blank" rel="noopener noreferrer">
        <img src={phantomIcon} alt="Phantom" className="footer-icon" />
             </a>
             <a href="https://docs.paymesol.app" target="_blank" rel="noopener noreferrer">
        <img src={helpIcon} alt="Help" className="footer-icon" />
            </a>
</div>

        </div>
    );
}

// Render the App
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <ConnectionProvider endpoint="https://api.mainnet-beta.solana.com">
        <WalletProvider wallets={[new PhantomWalletAdapter()]} autoConnect>
            <WalletModalProvider>
                <App />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
);
