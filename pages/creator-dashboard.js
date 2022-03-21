import axios from 'axios';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import { marketAddress, nftAddress } from '../config';

const CreatorDashboard = () => {
	const [nfts, setNfts] = useState([]);
	const [sold, setSold] = useState([]);
	const [loadingState, setLoadingState] = useState('not-loaded');

	const loadNFTs = async () => {
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const MarketContract = new ethers.Contract(
			marketAddress,
			Market.abi,
			signer
		);

		const TokenContract = new ethers.Contract(nftAddress, NFT.abi, signer);

		console.log(MarketContract);
		const data = await MarketContract.fetchItemsCreated();

		const items = await Promise.all(
			data.map(async (i) => {
				const tokenURI = await TokenContract.tokenURI(i.tokenId);
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

		const soldItems = items.filter((i) => i.sold);

		setNfts(items);
		setSold(soldItems);
		setLoadingState('loaded');
	};

	useEffect(() => {
		loadNFTs();
	}, []);

	if (loadingState === 'loaded' && !nfts.length)
		return <h1 className="py-10 px-20 text-3xl">No NFTs listed</h1>;
	return (
		<div>
			<div className="p-4">
				<h2 className="text-2xl py-2">Items Listed</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
					{nfts.map((nft, i) => (
						<div key={i} className="border shadow rounded-xl overflow-hidden">
							<img src={nft.image} className="rounded" />
							<div className="p-4 bg-black">
								<p className="text-2xl font-bold text-white">
									Price - {nft.price} Eth
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="p-4">
				{Boolean(sold.length) && (
					<div>
						<h2 className="text-2xl py-2">Items Sold</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
							{sold.map((nft, i) => (
								<div
									key={i}
									className="border shadow rounded-xl overflow-hidden"
								>
									<img src={nft.image} className="rounded" />
									<div className="p-4 bg-black">
										<p className="text-2xl font-bold text-white">
											Price - {nft.price} Eth
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CreatorDashboard;
