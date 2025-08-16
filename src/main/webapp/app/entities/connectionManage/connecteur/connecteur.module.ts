import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { ConnecteurComponent } from './list/connecteur.component';
import { ConnecteurDetailComponent } from './detail/connecteur-detail.component';
import { ConnecteurUpdateComponent } from './update/connecteur-update.component';
import { ConnecteurDeleteDialogComponent } from './delete/connecteur-delete-dialog.component';
import { ConnecteurRoutingModule } from './route/connecteur-routing.module';

@NgModule({
  imports: [SharedModule, ConnecteurRoutingModule],
  declarations: [ConnecteurComponent, ConnecteurDetailComponent, ConnecteurUpdateComponent, ConnecteurDeleteDialogComponent],
})
export class ConnectionManageConnecteurModule {}
