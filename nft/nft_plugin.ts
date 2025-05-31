import {
    GenericPlugin,
    GenericPluginContext,
  } from '@hashgraphonline/standards-agent-kit';
  import { StructuredTool, DynamicStructuredTool } from '@langchain/core/tools';
  import { z } from 'zod';
  import {
    Client,
    TokenCreateTransaction,
    TokenType,
    TokenSupplyType,
    TokenInfoQuery,
    AccountBalanceQuery,
    PrivateKey,
    TokenMintTransaction,
    TokenBurnTransaction,
  } from "@hashgraph/sdk";
  
  /**
   * A simple plugin that says hello.
   */
  export class NFTDagger extends GenericPlugin {
    id = 'NFT-plugin';
    name = 'NFT Plugin';
    description = 'A plugin for creating and managing NFTs on Hedera';
    version = '1.0.0';
    author = 'Best Team Ever 2025';
    namespace = 'nft';
  
    private client: Client;
    private accountId: string;
    private privateKey: PrivateKey;
  
    override async initialize(context: GenericPluginContext): Promise<void> {
        context.config
      await super.initialize(context);
      
      this.accountId = process.env.ACCOUNT_ID!;
      this.privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!.replace('0x', ''));
      
      this.client = Client.forTestnet();
      this.client.setOperator(this.accountId, this.privateKey);
      
      this.context.logger.info('NFTPlugin initialized');
    }
  
    getTools(): StructuredTool[] {
      return [
        new DynamicStructuredTool({
          name: 'create_nft',
          description: 'Creates a new NFT collection',
          schema: z.object({
            tokenName: z.string().describe('The name of the NFT collection'),
            tokenSymbol: z.string().describe('The symbol for the NFT collection')
          }),
          func: async ({ tokenName, tokenSymbol }) => {
            return await this.createNFT(tokenName, tokenSymbol);
          },
        }),
        new DynamicStructuredTool({
          name: 'mint_daggernft',
          description: 'Mints a new dagger NFT in the collection',
          schema: z.object({
            tokenId: z.string().describe('The token ID of the NFT collection'),
            metadata: z.string().describe('The metadata URI for the NFT'),
          }),
          func: async ({ tokenId, metadata }) => {
            return await this.mintNFT(tokenId, metadata);
          },
        }),
      ];
    }
  
    private async createNFT(tokenName: string, tokenSymbol: string): Promise<string> {
      let tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.accountId)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(this.privateKey)
        .setFreezeKey(this.privateKey)
        .setPauseKey(this.privateKey)
        .setAdminKey(this.privateKey)
        .setWipeKey(this.privateKey)
        .freezeWith(this.client);
  
      let tokenCreateSign = await tokenCreateTx.sign(this.privateKey);
      let tokenCreateSubmit = await tokenCreateSign.execute(this.client);
      let tokenCreateRx = await tokenCreateSubmit.getReceipt(this.client);
      let tokenId = tokenCreateRx.tokenId;
  
      return `Created NFT collection with ID: ${tokenId}`;
    }
  
    private async mintNFT(tokenId: string, metadata: string): Promise<string> {
      let mintTx = await new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([Buffer.from("ipfs://bafkreibirmhogrkhblrmyefyxurmntgy4zzng2juxaffkjkxgtdddap52y")])
        .execute(this.client);
      
      let mintRx = await mintTx.getReceipt(this.client);
      
      return `Minted NFT with serial numbers: ${mintRx.serials}`;
    }
  }