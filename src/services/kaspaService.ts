import { KASPA_NETWORKS } from '@/constants/networks';

class KaspaService {
  private static instance: KaspaService;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;
  private kaspaModule: any = null;

  private constructor() {}

  static getInstance(): KaspaService {
    if (!KaspaService.instance) {
      KaspaService.instance = new KaspaService();
    }
    return KaspaService.instance;
  }

  async ensureLoaded(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadSDK();
    await this.loadPromise;
  }

  private async loadSDK(): Promise<void> {
    try {
      if (!this.kaspaModule) {
        console.log('Loading Kaspa WASM SDK...');
        
        // Import the entire module first
        const kaspaModule = await import('../kaspa-wasm32-sdk/web/kaspa/kaspa.js');
        //console.log('Kaspa module imported, available exports:', Object.keys(kaspaModule));
        
        // Then initialize the WASM with the default export (this is the init function)
        await kaspaModule.default();
        //console.log('Kaspa WASM initialized');
        
        this.kaspaModule = kaspaModule;
        
        // Also attach to window for compatibility
        (window as any).kaspa = kaspaModule;
        //console.log('Kaspa SDK loaded and available');
      }
      this.isLoaded = true;
      console.log('Kaspa SDK loaded successfully');
    } catch (error) {
      console.error('Failed to load Kaspa SDK:', error);
      this.isLoaded = false;
      this.loadPromise = null;
      throw new Error(`Failed to load Kaspa SDK: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getKaspa() {
    if (!this.isLoaded || !this.kaspaModule) {
      throw new Error('Kaspa SDK not loaded. Call ensureLoaded() first.');
    }
    return this.kaspaModule;
  }

  generateKeyPair(privateKeyHex?: string, networkId?: string): { privateKey: string; publicKey: string; address: string } {
    const kaspa = this.getKaspa();
    
    try {
      let privKey: string;
      if (privateKeyHex) {
        privKey = privateKeyHex;
      } else {
        // Generate new keypair and extract private key
        if (!kaspa.Keypair || !kaspa.Keypair.random) {
          throw new Error('Keypair.random method not available in Kaspa SDK');
        }
        const keypair = kaspa.Keypair.random();
        privKey = keypair.privateKey;
      }

      // Create private key object
      const privateKeyObj = new kaspa.PrivateKey(privKey);
      
      // Get public key
      const publicKeyObj = privateKeyObj.toPublicKey();
      const pubKey = publicKeyObj.toString();

      // Get address - use provided networkId or default to mainnet
      const targetNetwork = networkId || KASPA_NETWORKS.MAINNET;
      const addressObj = publicKeyObj.toAddress(targetNetwork);
      const addr = addressObj.toString();
      return {
        privateKey: privKey,
        publicKey: pubKey,
        address: addr
      };
    } catch (error) {
      console.error('Error generating key pair:', error);
      console.error('Error details:', error);
      throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validatePrivateKey(privateKeyHex: string): boolean {
    try {
      const kaspa = this.getKaspa();
      new kaspa.PrivateKey(privateKeyHex);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default KaspaService.getInstance();