import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { HistConsultComponent } from '../list/hist-consult.component';
import { HistConsultDetailComponent } from '../detail/hist-consult-detail.component';
import { HistConsultUpdateComponent } from '../update/hist-consult-update.component';
import { HistConsultRoutingResolveService } from './hist-consult-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const histConsultRoute: Routes = [
  {
    path: '',
    component: HistConsultComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: HistConsultDetailComponent,
    resolve: {
      histConsult: HistConsultRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: HistConsultUpdateComponent,
    resolve: {
      histConsult: HistConsultRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: HistConsultUpdateComponent,
    resolve: {
      histConsult: HistConsultRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(histConsultRoute)],
  exports: [RouterModule],
})
export class HistConsultRoutingModule {}
