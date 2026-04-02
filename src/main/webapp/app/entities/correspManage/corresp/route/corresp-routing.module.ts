import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { CorrespComponent } from '../list/corresp.component';
import { CorrespDetailComponent } from '../detail/corresp-detail.component';
import { CorrespUpdateComponent } from '../update/corresp-update.component';
import { CorrespRoutingResolveService } from './corresp-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';
import { CorrespOutUpdateComponent } from '../corresp-out-update/corresp-out-update.component';

const correspRoute: Routes = [
  {
    path: '',
    component: CorrespComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: CorrespDetailComponent,
    resolve: {
      corresp: CorrespRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: CorrespUpdateComponent,
    resolve: {
      corresp: CorrespRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new-out',
    component: CorrespOutUpdateComponent,
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: CorrespUpdateComponent,
    resolve: {
      corresp: CorrespRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(correspRoute)],
  exports: [RouterModule],
})
export class CorrespRoutingModule {}
