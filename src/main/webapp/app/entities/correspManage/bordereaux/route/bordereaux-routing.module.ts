import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { BordereauxComponent } from '../list/bordereaux.component';
import { BordereauxDetailComponent } from '../detail/bordereaux-detail.component';
import { BordereauxUpdateComponent } from '../update/bordereaux-update.component';
import { BordereauxRoutingResolveService } from './bordereaux-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const bordereauxRoute: Routes = [
  {
    path: '',
    component: BordereauxComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: BordereauxDetailComponent,
    resolve: {
      bordereaux: BordereauxRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: BordereauxUpdateComponent,
    resolve: {
      bordereaux: BordereauxRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: BordereauxUpdateComponent,
    resolve: {
      bordereaux: BordereauxRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(bordereauxRoute)],
  exports: [RouterModule],
})
export class BordereauxRoutingModule {}
