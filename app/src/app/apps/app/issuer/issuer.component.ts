import { Component, effect, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AppService } from '../../../app.service';
import { IdentityService } from '../../../identity.service';
import { VerifiableCredential } from '@web5/credentials';
import { credential } from '../../../../protocols';
import { MatTabsModule } from '@angular/material/tabs';
import { LayoutService } from '../../../layout.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-issuer',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
  ],
  templateUrl: './issuer.component.html',
  styleUrl: './issuer.component.scss',
})
export class IssuerComponent {
  vcType = 'IdentityCredential';

  app = inject(AppService);

  identity = inject(IdentityService);

  layout = inject(LayoutService);

  loading = false;

  signed = false;

  lookupSigned: boolean | undefined = undefined;

  did = '';

  identifier = '';

  name = '';

  gender = '';

  birthdate = '';

  photograph = '';

  credential = '';

  constructor() {
    this.layout.marginOff();

    effect(() => {
      if (this.app.initialized()) {
        this.load();
      }
    });
  }

  async load() {
    var { records: vcRecords } = await this.identity.web5.dwn.records.query({
      message: {
        filter: {
          schema: this.vcType,
          dataFormat: credential.format,
        },
      },
    });

    if (vcRecords!.length > 0) {
      this.signed = true;
    }
  }

  async sign() {
    this.loading = true;

    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 5);

    const vc = await VerifiableCredential.create({
      type: this.vcType,
      issuer: this.identity.did,
      subject: this.did,
      data: {
        identifier: this.identifier,
        name: this.name,
        dateOfBirth: this.birthdate,
        gender: this.gender,
        photo: this.photograph,
      },
      expirationDate: expirationDate.toISOString(),
    });

    const did = await this.identity.activeAgent().did.get({ didUri: this.identity.did });
    console.log('DID:', did);

    const identities = await this.identity.activeAgent().identity.list();
    console.log('Identitites:', identities);

    const bearerDid = await this.identity.activeAgent().identity.get({ didUri: this.identity.did });

    console.log('this.identity.did:', this.identity.did);
    console.log('Bearer DID:', bearerDid);
    console.log('Active Agent:', this.identity.activeAgent());

    const vc_jwt = await vc.sign({ did: bearerDid!.did });

    this.credential = vc_jwt;

    // const { record } = await this.identity.web5.dwn.records.create({
    //   data: vc_jwt,
    //   message: {
    //     schema: this.vcType,
    //     dataFormat: credential.format,
    //     published: true,
    //   },
    // });

    // console.log('VC RECORD:', record);

    // const { status } = await record!.send(this.identity.did);
    // console.log('Record sent:', status, record);

    this.signed = true;
  }

  async lookup() {
    this.lookupSigned = undefined;

    const { records } = await this.identity.web5.dwn.records.query({
      from: this.did,
      message: {
        filter: {
          schema: this.vcType,
          dataFormat: credential.format,
        },
      },
    });

    console.log('VC RECORDS:', records);

    // TODO: Here we should actually validate the VC.
    if (records!.length > 0) {
      this.lookupSigned = true;
    } else {
      this.lookupSigned = false;
    }
  }

  async withdraw() {
    var { records: vcRecords } = await this.identity.web5.dwn.records.query({
      message: {
        filter: {
          schema: this.vcType,
          dataFormat: credential.format,
        },
      },
    });

    for (const record of vcRecords!) {
      await record.delete();
      record.send(this.identity.did);
    }

    this.loading = false;
    this.signed = false;
  }
}
