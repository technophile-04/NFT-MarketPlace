import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import { ethers } from 'ethers';
import { nftAddress, marketAddress } from '../config';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';

export default function Home() {
	const [nfts, setNfts] = useState([]);
	const [loading, setLoading] = useState('not-loaded');

	async function loadNFTs() {
		const provider = new ethers.providers.JsonRpcProvider();
		const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
		const marketContract = new ethers.Contract(
			marketAddress,
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
			marketAddress,
			Market.abi,
			signer
		);

		const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
		const transaction = await marketContract.createMarketSale(
			nftAddress,
			nft.tokenId,
			{ value: price }
		);

		await transaction.wait();
		loadNFTs();
	}

	useEffect(() => {
		loadNFTs();
	}, []);

	if (loading === 'loaded' && !nfts.length) {
		return <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>;
	}

	return (
		<div className="flex justify-center">
			<div className="px-4" style={{ maxWidth: '1600px' }}>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
					{nfts.map((nft, i) => (
						<div key={i} className="border shadow rounded-xl overflow-hidden">
							<img src={nft.image} />
							<div className="p-4">
								<p
									style={{ height: '64px' }}
									className="text-2xl font-semibold"
								>
									{nft.name}
								</p>
								<div style={{ height: '70px', overflow: 'hidden' }}>
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
			</div>
		</div>
	);
}
