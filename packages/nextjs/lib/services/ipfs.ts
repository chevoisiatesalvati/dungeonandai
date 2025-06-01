import { PinataSDK } from "pinata";

interface IPFSConfig {
  pinataJwt: string;
  pinataGateway: string;
}

interface PinataUploadResponse {
  id: string;
  user_id: string;
  name: string;
  network: string;
  vectorized: boolean;
  created_at: string;
  updated_at: string;
  accept_duplicates: boolean;
  streamable: boolean;
  cid: string;
  mime_type: string;
  size: number;
  number_of_files: number;
  is_duplicate: boolean;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    type: string;
    rarity: string;
    stats?: {
      damage?: number;
      speed?: number;
      durability?: number;
      [key: string]: any;
    };
    properties?: {
      material?: string;
      weight?: string;
      length?: string;
      [key: string]: any;
    };
    special_abilities?: Array<{
      name: string;
      description: string;
    }>;
    [key: string]: any;
  };
  category: string;
  subcategory?: string;
  level_requirement?: number;
  crafting_requirements?: {
    materials: Array<{
      name: string;
      quantity: number;
    }>;
    skill_requirement?: {
      name: string;
      level: number;
    };
  };
}

export class IPFSService {
  private pinata: PinataSDK;

  constructor() {
    if (!process.env.PINATA_JWT || !process.env.PINATA_GATEWAY) {
      throw new Error("Missing required environment variables: PINATA_JWT or PINATA_GATEWAY");
    }

    const config: IPFSConfig = {
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: process.env.PINATA_GATEWAY,
    };

    this.pinata = new PinataSDK(config);
  }

  async uploadImage(file: File): Promise<string> {
    try {
      console.log("Uploading file:", file);
      const upload = (await (this.pinata.upload as any).public.file(file)) as PinataUploadResponse;
      console.log("Upload response:", upload);
      if (!upload?.cid) {
        throw new Error("No IPFS hash received from upload");
      }
      return `ipfs://${upload.cid}`;
    } catch (error) {
      console.error("Error uploading image to IPFS:", error);
      throw new Error("Failed to upload image to IPFS");
    }
  }

  async uploadMetadata(metadata: NFTMetadata): Promise<string> {
    try {
      const upload = (await (this.pinata.upload as any).public.json(metadata)) as PinataUploadResponse;
      if (!upload?.cid) {
        throw new Error("No IPFS hash received from upload");
      }
      return `ipfs://${upload.cid}`;
    } catch (error) {
      console.error("Error uploading metadata to IPFS:", error);
      throw new Error("Failed to upload metadata to IPFS");
    }
  }

  async uploadNFT(
    image: File,
    metadata: Omit<NFTMetadata, "image">,
  ): Promise<{ imageCid: string; metadataCid: string }> {
    try {
      // 1. Upload image to IPFS
      const imageCid = await this.uploadImage(image);

      // 2. Create metadata with image CID
      const fullMetadata: NFTMetadata = {
        ...metadata,
        image: imageCid,
      };

      // 3. Upload metadata to IPFS
      const metadataCid = await this.uploadMetadata(fullMetadata);

      return {
        imageCid,
        metadataCid,
      };
    } catch (error) {
      console.error("Error uploading NFT to IPFS:", error);
      throw new Error("Failed to upload NFT to IPFS");
    }
  }
}
