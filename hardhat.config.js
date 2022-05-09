require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
	solidity: '0.8.4',
	networks: {
		hardhat: {
			chainId: 1337,
		},
		rinkeby: {
			url: process.env.RINKEBY_RPC_URL,
			accounts: [process.env.PRIVATE_KEY],
		},
	},
};
