require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
	solidity: '0.8.4',
	networks: {
		hardhat: {
			chainId: 1337,
		},
		mainnet: {},
		mumbai: {
			url: API_URL,
			accounts: [PRIVATE_KEY],
		},
	},
};
