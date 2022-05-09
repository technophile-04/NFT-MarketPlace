import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import contractAddress from '../contract-address.json';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

const CreateItem = () => {
	const [fileUrl, setFileUrl] = useState('');
	const [formInput, setFormInput] = useState({
		price: '',
		name: '',
		description: '',
	});
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const onChange = async (e) => {
		const file = e.target.files[0];
		try {
			setLoading(true);
			const added = await toast.promise(client.add(file), {
				loading: 'Uploading image ipfs',
				success: 'Successfully Uploaded to ipfs!',
				error: 'Error uploading please try again in 2min',
			});

			const url = `https://ipfs.infura.io/ipfs/${added.path}`;
			console.log('url--', url);
			setFileUrl(url);
			setLoading(false);
		} catch (error) {
			console.log('Error uploading file: ', error);
		}
	};

	const createMarket = async () => {
		const { name, description, price } = formInput;
		if (!name || !description || !price || !fileUrl) return;

		const data = JSON.stringify({
			name,
			description,
			image: fileUrl,
		});

		try {
			setLoading(true);
			const added = await toast.promise(client.add(data), {
				loading: 'Uploading  meta data to ipfs',
				success: 'Successfully Uploaded to ipfs!',
				error: 'Error uploading please try again in 2min',
			});
			const url = `https://ipfs.infura.io/ipfs/${added.path}`;

			createSale(url);
		} catch (error) {
			console.log('Error uploading file: ', error);
			setLoading(false);
		}
	};

	const createSale = async (url) => {
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const NFTContract = new ethers.Contract(
			contractAddress.nftAddress,
			NFT.abi,
			signer
		);

		let transaction = await toast.promise(
			NFTContract.createToken(url),
			{
				loading: 'Minting NFT',
				success: 'NFT Minted',
				error: 'Error creating NFT',
			},
			{
				success: {
					icon: '🔥',
				},
			}
		);
		let tx = await toast.promise(transaction.wait(), {
			loading: 'Minning transaction, Hold tight!',
			success: 'Minned successfully !',
			error: 'please wait 5 min and try again',
		});
		const event = tx.events[0];
		let value = event.args[2];
		let tokenId = value.toNumber();
		const price = ethers.utils.parseUnits(formInput.price, 'ether');

		const MarketContract = new ethers.Contract(
			contractAddress.marketAddress,
			Market.abi,
			signer
		);
		let listingPrice = await MarketContract.getListingPrice();
		listingPrice = listingPrice.toString();

		transaction = await toast.promise(
			MarketContract.createMarketItem(
				contractAddress.nftAddress,
				tokenId,
				price,
				{
					value: listingPrice,
				}
			),
			{
				loading: 'Listing your NFT',
				success: 'Your NFT is Listed!',
				error: 'please wait 5 min and try again',
			},
			{
				success: {
					icon: '🔥',
				},
			}
		);

		await toast.promise(transaction.wait(), {
			loading: 'Minning transaction, Hold tight!',
			success: 'Minned successfully !',
			error: 'please wait 5 min and try again',
		});
		setLoading(false);
		router.push('/');
	};

	return (
		<div className="flex justify-center">
			<div className="w-1/2 flex flex-col pb-12">
				<input
					placeholder="Asset Name"
					className="mt-8 border rounded p-4"
					onChange={(e) => setFormInput({ ...formInput, name: e.target.value })}
				/>
				<textarea
					placeholder="Asset Description"
					className="mt-2 border rounded p-4"
					onChange={(e) =>
						setFormInput({ ...formInput, description: e.target.value })
					}
				/>
				<input
					placeholder="Asset Price in Eth"
					className="mt-2 border rounded p-4"
					onChange={(e) =>
						setFormInput({ ...formInput, price: e.target.value })
					}
				/>
				<input type="file" name="Asset" className="my-4" onChange={onChange} />
				{fileUrl && <img className="rounded mt-4" width="350" src={fileUrl} />}
				<button
					onClick={createMarket}
					disabled={loading}
					className={`font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg ${
						loading && 'disabled:opacity-75'
					}`}
				>
					Create Digital Asset
				</button>
			</div>
		</div>
	);
};

export default CreateItem;
