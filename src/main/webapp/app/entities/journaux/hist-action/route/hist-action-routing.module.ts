import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { HistActionComponent } from '../list/hist-action.component';
import { HistActionDetailComponent } from '../detail/hist-action-detail.component';
import { HistActionUpdateComponent } from '../update/hist-action-update.component';
import { HistActionRoutingResolveService } from './hist-action-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const histActionRoute: Routes = [
  {
    path: '',
    component: HistActionComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: HistActionDetailComponent,
    resolve: {
      histAction: HistActionRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: HistActionUpdateComponent,
    resolve: {
      histAction: HistActionRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: HistActionUpdateComponent,
    resolve: {
      histAction: HistActionRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(histActionRoute)],
  exports: [RouterModule],
})
export class HistActionRoutingModule {}
