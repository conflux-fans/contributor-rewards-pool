import { expect } from "chai"
import { deployments, ethers, getNamedAccounts } from "hardhat"
// import { setup20Fixture } from "./BasicERC20"
import { setup721Fixture } from "./BasicERC721"

const setupFixture = deployments.createFixture(async () => {
	await deployments.fixture()
	const signers = await getNamedAccounts()

	const name = "ProtoToken"
	const symbol = "PT"
	const owner = signers.deployer

	const contract20 = await ethers.deployContract(
		"BasicERC20",
		[name, symbol, owner],
		await ethers.getSigner(signers.deployer)
	)
	const contract20Address = await contract20.getAddress()
	console.log(contract20Address)

	const baseURI = "ipfs://base-uri/"
	const contractURI = "ipfs://contract-uri"

	const contract721 = await ethers.deployContract(
		"BasicERC721",
		[name, symbol, baseURI, contractURI, owner],
		await ethers.getSigner(signers.deployer)
	)
	const contract721Address = await contract721.getAddress()
	console.log(contract721Address)

	const baseTokenAmountPerClaim = 1000

	const pool = await ethers.deployContract(
		"ContributorRewardsPool",
		[contract721Address, contract20Address, baseTokenAmountPerClaim],
		await ethers.getSigner(signers.deployer)
	)
	console.log(await pool.getAddress())

	return {
		pool,
		poolAddress: await pool.getAddress(),
		contract20,
		contract721,
		contract20Address,
		contract721Address,
		accounts: await ethers.getSigners(),
		deployer: await ethers.getSigner(signers.deployer),
	}
})

describe("ContributorRewardsPool", () => {
	it("Should Claim Token if Owning NFT", async () => {
		const { pool, contract20, contract721, contract20Address, contract721Address, accounts, poolAddress } =
			await setupFixture()

		const totalRewards = 1000000000000

		await contract20.mint(poolAddress, totalRewards)

		expect(await contract20.balanceOf(poolAddress)).to.equal(totalRewards)
		await contract721.safeMint(await accounts[0].getAddress())
		// mint nft 1 for accounts[2]
		await contract721.safeMint(await accounts[1].getAddress())
		// await contract721.safeMint(await accounts[2].getAddress())
		expect(await contract721.ownerOf(1)).to.equal(await accounts[0].getAddress())
		// expect(await contract721.ownerOf(2)).to.equal(await accounts[1].getAddress())
		// expect(await contract721.ownerOtokenId

		expect(await pool.rewardAmountsCanClaimForNFTs([1, 2])).to.deep.equal([6000n, 6000n])

		await pool.connect(accounts[0]).claimReward(1)
		expect(await contract20.balanceOf(await accounts[0].getAddress())).to.equal(1000 * 2 * 3)
		expect(await pool.rewardAmountsCanClaimForNFTs([1, 2])).to.deep.equal([0, 6000n])
		await expect(pool.connect(accounts[0]).claimReward(1)).to.be.revertedWith("Tokens already claimed for this NFT")
		await expect(pool.connect(accounts[0]).claimReward(2)).to.be.revertedWith("Not the NFT owner")
	})
})
