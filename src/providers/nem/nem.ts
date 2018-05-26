import { Injectable } from '@angular/core';

import {
  NEMLibrary,
  NetworkTypes,
  SimpleWallet,
  Address,
  AccountHttp,
  MosaicHttp,
  AccountOwnedMosaicsService,
  MosaicTransferable,
  XEM,
  TransactionHttp,
  Transaction,
  Mosaic,
  QRService,
  ServerConfig
} from 'nem-library';

import { Observable } from 'nem-library/node_modules/rxjs';

export const MAIN_NET_NODES: ServerConfig[] = [
  { protocol: 'http', domain: 'alice4.nem.ninja', port: 7890 },
  { protocol: 'http', domain: 'san.nem.ninja', port: 7890 },
  { protocol: 'http', domain: 'go.nem.ninja', port: 7890 },
  { protocol: 'http', domain: 'hachi.nem.ninja', port: 7890 },
];

/*
 Generated class for the NemProvider provider.

 See https://angular.io/docs/ts/latest/guide/dependency-injection.html
 for more info on providers and Angular DI.
 */
@Injectable()
export class NemProvider {
  wallets: SimpleWallet[];
  accountHttp: AccountHttp;
  mosaicHttp: MosaicHttp;
  transactionHttp: TransactionHttp;
  qrService: QRService;
  accountOwnedMosaicsService: AccountOwnedMosaicsService;

  constructor() {
    NEMLibrary.bootstrap(NetworkTypes.TEST_NET);
    this.accountHttp = new AccountHttp();
    this.mosaicHttp = new MosaicHttp();
    this.transactionHttp = new TransactionHttp();
    this.qrService = new QRService();
    this.accountOwnedMosaicsService = new AccountOwnedMosaicsService(
      this.accountHttp,
      this.mosaicHttp
    );
  }

  changeNetwork(network = NetworkTypes.TEST_NET) {
    NEMLibrary.reset();
    NEMLibrary.bootstrap(network);
    console.log(NEMLibrary.getNetworkType());

    if (NEMLibrary.getNetworkType() == NetworkTypes.MAIN_NET) {
      this.accountHttp = new AccountHttp(MAIN_NET_NODES);
      this.mosaicHttp = new MosaicHttp(MAIN_NET_NODES);
      this.transactionHttp = new TransactionHttp(MAIN_NET_NODES);
    }
  }

  /**
   * Turns plain text address to Address object.
   * @param address The address of the account.
   */
  createNemAddress(address: string) {
    return new Address(address);
  }

  /**
   * Check if acount belongs it is valid, has 40 characters and belongs to network
   * @param address address to check
   * @return Return prepared transaction
   */
  public isValidAddress(address: Address): boolean {
    // Reset recipient data
    let success = true;
    // From documentation: Addresses have always a length of 40 characters.
    if (!address || address.plain().length != 40) success = false;

    //if raw data, clean address and check if it is from network
    if (address.network() != NEMLibrary.getNetworkType()) success = false;
    return success;
  }

  /**
   * Gets an AccountInfoWithMetaData for an account.
   * @param address address - Address
   * @return Observable<AccountInfoWithMetaData>
   */
  getAccountInfoFromAddress(address: Address) {
    return this.accountHttp.getFromAddress(address);
  }

  /**
   * Get mosaics form an account
   * @param address address to check balance
   * @return Promise with mosaics information
   */
  public getBalance(address: Address): Promise<MosaicTransferable[]> {
    return this.accountOwnedMosaicsService.fromAddress(address).toPromise();
  }

  /**
   * Adds to a transaction data mosaic definitions
   * @param mosaics array of mosaics
   * @return Promise with altered transaction
   */
  public addDefinitionToMosaics(
    mosaics: Mosaic[]
  ): Observable<MosaicTransferable[]> {
    return Observable.from(mosaics)
      .flatMap((mosaic: Mosaic) => {
        if (XEM.MOSAICID.equals(mosaic.mosaicId))
          return Observable.of(
            new XEM(mosaic.quantity / Math.pow(10, XEM.DIVISIBILITY))
          );
        else {
          return this.mosaicHttp
            .getMosaicDefinition(mosaic.mosaicId)
            .map(mosaicDefinition => {
              return MosaicTransferable.createWithMosaicDefinition(
                mosaicDefinition,
                mosaic.quantity /
                  Math.pow(10, mosaicDefinition.properties.divisibility)
              );
            });
        }
      })
      .toArray();
  }

  /**
   * Returns if transaction has at least one mosaic with levy
   * @param mosaics array of mosaics
   * @return Boolean indicating the result
   */

  public transactionHasAtLeastOneMosaicWithLevy(
    mosaics: MosaicTransferable[]
  ): boolean {
    let hasLevy = false;
    mosaics.filter(mosaic => {
      if (mosaic.levy) hasLevy = true;
    });
    return hasLevy;
  }

  /**
   * Get all confirmed transactions of an account
   * @param address account Address
   * @return Promise with account transactions
   */
  public getAllTransactionsFromAnAccount(
    address: Address
  ): Observable<Transaction[]> {
    return this.accountHttp.allTransactions(address);
  }

  /**
   * Get all unconfirmed transactions of an account
   * @param address account Address
   * @return Promise with account transactions
   */
  public getUnconfirmedTransactionsFromAnAccount(
    address: Address
  ): Observable<Transaction[]> {
    return this.accountHttp.unconfirmedTransactions(address);
  }
}
