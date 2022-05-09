import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import { ethers } from 'ethers';
import contractAddress from '../contract-address.json';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import toast from 'react-hot-toast';

export default function Home() {
	const [nfts, setNfts] = useState([]);
	const [loading, setLoading] = useState('not-loaded');
	const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
	const [isWeb3Wallet, setIsWeb3Wallet] = useState(false);

	async function loadNFTs() {
		if (!window.ethereum) return;
		setLoading('loading');
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		const tokenContract = new ethers.Contract(
			contractAddress.nftAddress,
			NFT.abi,
			provider
		);
		const marketContract = new ethers.Contract(
			contractAddress.marketAddress,
			Market.abi,
			provider
		);
		const data = await marketContract.fetchMarketItems();

		const items = await Promise.all(
			data.map(async (i) => {
				const tokenURI = await tokenContract.tokenURI(i.tokenId);
				const meta = await axios.get(tokenURI);
				const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
				const item = {
					price,
					tokenId: i.tokenId.toNumber(),
					seller: i.seller,
					owner: i.owner,
					image: meta.data.image,
					name: meta.data.name,
					description: meta.data.description,
				};

				return item;
			})
		);

		setNfts(items);
		setLoading('loaded');
	}

	async function buyNFT(nft) {
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const marketContract = new ethers.Contract(
			contractAddress.marketAddress,
			Market.abi,
			signer
		);

		const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

		let transaction = await toast.promise(
			marketContract.createMarketSale(contractAddress.nftAddress, nft.tokenId, {
				value: price,
			}),
			{
				loading: 'Buying NFT!',
				success: 'Congrats',
				error: 'please wait 5 min and try again',
			},
			{
				success: {
					icon: '🥳',
				},
			}
		);

		await toast.promise(transaction.wait(), {
			loading: 'Minning transaction, Hold tight!',
			success: 'Minned successfully !',
			error: 'please wait 5 min and try again',
		});

		loadNFTs();
	}

	useEffect(() => {
		if (window.ethereum) {
			const getChain = async () => {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const { chainId } = await provider.getNetwork(provider);
				console.log('CHAIN ID : ', chainId);
				setIsCorrectNetwork(chainId === 4);
				if (chainId === 4) {
					loadNFTs();
				}
			};
			ethereum.on('networkChanged', function (networkId) {
				window.location.reload();
			});
			setIsWeb3Wallet(true);
			getChain();
		} else {
			setIsWeb3Wallet(false);
		}
	}, []);

	if (loading === 'loaded' && !nfts.length) {
		return <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>;
	}
	if (loading === 'loading' && !nfts.length) {
		return <h1 className="px-20 py-10 text-3xl">Loading...</h1>;
	}

	return (
		<div className="flex justify-center">
			<div className="px-4" style={{ maxWidth: '1600px' }}>
				{isWeb3Wallet ? (
					isCorrectNetwork ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
							{nfts.map((nft, i) => (
								<div
									key={i}
									className="border shadow rounded-xl overflow-hidden"
								>
									<img src={nft.image} />
									<div className="p-4">
										<p className="text-2xl font-semibold">{nft.name}</p>
										<div>
											<p className="text-gray-400">{nft.description}</p>
										</div>
									</div>
									<div className="p-4 bg-black">
										<p className="text-2xl mb-4 font-bold text-white">
											{nft.price} ETH
										</p>
										<button
											className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
											onClick={() => buyNFT(nft)}
										>
											Buy
										</button>
									</div>
								</div>
							))}
						</div>
					) : (
						<h1 className="text-2xl text-black text-center">
							Please switch to Rinkeby network
						</h1>
					)
				) : (
					<div className="w-full flex justify-center items-center gradient-bg-welcome">
						<h1 className="text-2xl text-black text-center">
							Metamask or other EIP-1102 / EIP-1193 compliant wallet not found,
							<br />
							Please install Metamask
						</h1>
					</div>
				)}
			</div>
		</div>
	);
}
