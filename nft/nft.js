console.clear();
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenInfoQuery,
  AccountBalanceQuery,
  PrivateKey,
  TokenMintTransaction,
  TokenBurnTransaction,
} = require("@hashgraph/sdk");

const myAccountId = process.env.NFT_ACCOUNT_ID;
const myPrivateKey = PrivateKey.fromStringECDSA(process.env.NFT_PRIVATE_KEY.replace('0x', ''));

const client = Client.forTestnet();
client.setOperator(myAccountId, myPrivateKey);

async function createNFT() {
  console.log("CreateNFT---------------------");
  let tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName("MyNFT")
    .setTokenSymbol("MNFT")
    .setTokenType(TokenType.NonFungibleUnique)
    .setInitialSupply(0)
    .setTreasuryAccountId(myAccountId)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(myPrivateKey)
    .setFreezeKey(myPrivateKey)
    .setPauseKey(myPrivateKey)
    .setAdminKey(myPrivateKey)
    .setWipeKey(myPrivateKey)
    //.setKycKey(myPrivateKey)
    .freezeWith(client);

  let tokenCreateSign = await tokenCreateTx.sign(myPrivateKey);
  let tokenCreateSubmit = await tokenCreateSign.execute(client);
  let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
  let tokenId = tokenCreateRx.tokenId;
  console.log(`- Created token with ID: ${tokenId}`);
  console.log("-----------------------------------");
  return tokenId;
}

async function queryTokenInfo(tokenId) {
  console.log("QueryTokenInfo---------------------");
  const query = new TokenInfoQuery().setTokenId(tokenId);
  const tokenInfo = await query.execute(client);
  console.log(JSON.stringify(tokenInfo, null, 4));
  console.log("-----------------------------------");
}

async function queryAccountBalance(accountId) {
  console.log("QueryAccountBalance----------------");
  const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
  const accountBalance = await balanceQuery.execute(client);
  console.log(JSON.stringify(accountBalance, null, 4));
  console.log("-----------------------------------");
}

async function mintNFT(tokenId) {
  console.log("MintNFT--------------------------");

  // Mint new NFT
  let mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([
      Buffer.from("ipfs://bafybeidzjfm2rdcpeygubqdg74rmsdlu2a6ocyplxks2mnkubhyxqggflq"),
      Buffer.from("secondToken"),
    ])
    .execute(client);
  let mintRx = await mintTx.getReceipt(client);
  //Log the serial number
  console.log(`- Created NFT ${tokenId} with serial: ${mintRx.serials} \n`);
  console.log("-----------------------------------");
}

async function burnNFT(tokenId, serial) {
  console.log("BurnToken--------------------------");
  const txResponse = await new TokenBurnTransaction()
    .setTokenId(tokenId)
    .setSerials([serial])
    .execute(client);
  const receipt = await txResponse.getReceipt(client);
  console.log("Burn token: " + receipt.status.toString());
  console.log("-----------------------------------");
}

async function main() {
  const tokenId = await createNFT();
  await queryTokenInfo(tokenId);
  await queryAccountBalance(myAccountId);
  await mintNFT(tokenId);
  await queryAccountBalance(myAccountId);
  await burnNFT(tokenId, 1);
  await queryAccountBalance(myAccountId);
}
main();