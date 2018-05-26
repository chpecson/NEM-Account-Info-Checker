import { NemProvider } from './../../providers/nem/nem';
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NetworkTypes, AccountInfoWithMetaData } from 'nem-library';

import 'rxjs/add/operator/debounceTime';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  accountInfo: AccountInfoWithMetaData;
  form: FormGroup;
  network: any;

  constructor(
    public navCtrl: NavController,
    public nemProvider: NemProvider,
    public formBuilder: FormBuilder
  ) {
    this.network = NetworkTypes;
    this.form = this.formBuilder.group({
      network: [this.network.TEST_NET, Validators.required],
      address: ['TCVXPBY223WONUWOIVQXTKUDTF4CBG4TCW4FFCUE', Validators.required]
    });

    this.form.controls['network'].valueChanges.subscribe(network =>
      this.nemProvider.changeNetwork(network)
    );
    this.form.controls['address'].valueChanges.debounceTime(300).subscribe(network =>
      this.onSubmit(this.form.value)
    );
  }

  onSubmit(form) {
    const address = this.nemProvider.createNemAddress(form.address);
    const isValidAddress = this.nemProvider.isValidAddress(address);
    // this.nemProvider.changeNetwork(form.network);

    // Ignore invalid address .
    if (!isValidAddress) {
      alert('Not a valid address');
      return;
    }

    this.nemProvider.getAccountInfoFromAddress(address).subscribe(
      accountInfo => {
        this.accountInfo = accountInfo;
        console.log(accountInfo);
      },
      err => {
        alert('An error occured. \nView Dev console for more details.');
        console.error(err);
      }
    );
  }

  showCosignerDetail(cosigner) {
    cosigner.visible = !cosigner.visible ? true : false;
  }
}
