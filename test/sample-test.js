const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('NFTMarket', function () {
	it('Should create and execute market sales', async function () {
		const MarketFactory = await ethers.getContractFactory('NFTMarket');
		const Market = await MarketFactory.deploy();
		await Market.deployed();
		const marketAddress = Market.address;

		const NFTFactory = await ethers.getContractFactory('NFT');
		const nft = await NFTFactory.deploy(marketAddress);
		await nft.deployed();
		const nftAddress = nft.address;

		let listingPrice = await Market.getListingPrice();
		console.log(listingPrice);
		listingPrice = listingPrice.toString();
		console.log(
			'Listing price formated',
			ethers.utils.formatEther(listingPrice)
		);

		const auctionPrice = ethers.utils.parseUnits('1', 'ether');
		console.log('Auction Price : ', auctionPrice);

		await nft.createToken('https://mytokenlocation.com');
		await nft.createToken('https://mytokenlocation2.com');

		await Market.createMarketItem(nftAddress, 1, auctionPrice, {
			value: listingPrice,
		});
		await Market.createMarketItem(nftAddress, 2, auctionPrice, {
			value: listingPrice,
		});

		const [_, buyerAddress] = await ethers.getSigners();

		await Market.connect(buyerAddress).createMarketSale(nftAddress, 1, {
			value: auctionPrice,
		});

		items = await Market.fetchMarketItems();
		items = await Promise.all(
			items.map(async (i) => {
				const tokenUri = await nft.tokenURI(i.tokenId);
				let item = {
					price: i.price.toString(),
					tokenId: i.tokenId.toString(),
					seller: i.seller,
					owner: i.owner,
					tokenUri,
				};
				return item;
			})
		);
		console.log('items: ', items);
	});
});
