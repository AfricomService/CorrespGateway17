import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { PjComponent } from '../list/pj.component';
import { PjDetailComponent } from '../detail/pj-detail.component';
import { PjUpdateComponent } from '../update/pj-update.component';
import { PjRoutingResolveService } from './pj-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const pjRoute: Routes = [
  {
    path: '',
    component: PjComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: PjDetailComponent,
    resolve: {
      pj: PjRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: PjUpdateComponent,
    resolve: {
      pj: PjRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: PjUpdateComponent,
    resolve: {
      pj: PjRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(pjRoute)],
  exports: [RouterModule],
})
export class PjRoutingModule {}
