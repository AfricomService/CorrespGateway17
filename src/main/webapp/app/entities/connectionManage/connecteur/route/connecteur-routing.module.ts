import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ConnecteurComponent } from '../list/connecteur.component';
import { ConnecteurDetailComponent } from '../detail/connecteur-detail.component';
import { ConnecteurUpdateComponent } from '../update/connecteur-update.component';
import { ConnecteurRoutingResolveService } from './connecteur-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const connecteurRoute: Routes = [
  {
    path: '',
    component: ConnecteurComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ConnecteurDetailComponent,
    resolve: {
      connecteur: ConnecteurRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ConnecteurUpdateComponent,
    resolve: {
      connecteur: ConnecteurRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ConnecteurUpdateComponent,
    resolve: {
      connecteur: ConnecteurRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(connecteurRoute)],
  exports: [RouterModule],
})
export class ConnecteurRoutingModule {}
