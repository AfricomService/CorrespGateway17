import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { DossierComponent } from '../list/dossier.component';
import { DossierDetailComponent } from '../detail/dossier-detail.component';
import { DossierUpdateComponent } from '../update/dossier-update.component';
import { DossierRoutingResolveService } from './dossier-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const dossierRoute: Routes = [
  {
    path: '',
    component: DossierComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: DossierDetailComponent,
    resolve: {
      dossier: DossierRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: DossierUpdateComponent,
    resolve: {
      dossier: DossierRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: DossierUpdateComponent,
    resolve: {
      dossier: DossierRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(dossierRoute)],
  exports: [RouterModule],
})
export class DossierRoutingModule {}
