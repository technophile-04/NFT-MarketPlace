import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import { marketAddress, nftAddress } from '../config';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import axios from 'axios';
import { useRouter } from 'next/router';

const MyNFTs = () => {
	const [loading, setLoading] = useState('not-loaded');
	const [nfts, setNfts] = useState([]);
	const router = useRouter();

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

		const data = await MarketContract.fetchMyNFTs();

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

		setNfts(items);
		setLoading('loaded');
	};

	function listNFT(nft) {
		router.push(`/resell-nft?id=${nft.tokenId}&tokenURI=${nft.tokenURI}`);
	}

	useEffect(() => {
		loadNFTs();
	}, []);

	if (loading === 'loaded' && !nfts.length)
		return <h1 className="py-10 px-20 text-3xl">No NFTs owned</h1>;

	return (
		<div className="flex justify-center">
			<div className="p-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
					{nfts.map((nft, i) => (
						<div key={i} className="border shadow rounded-xl overflow-hidden">
							<img src={nft.image} className="rounded" />
							<div className="p-4 bg-black">
								<p className="text-2xl font-bold text-white">
									Price - {nft.price} Eth
								</p>
								<button
									className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
									onClick={() => listNFT(nft)}
								>
									List
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default MyNFTs;
