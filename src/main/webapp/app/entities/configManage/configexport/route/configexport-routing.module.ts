import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ConfigexportComponent } from '../list/configexport.component';
import { ConfigexportDetailComponent } from '../detail/configexport-detail.component';
import { ConfigexportUpdateComponent } from '../update/configexport-update.component';
import { ConfigexportRoutingResolveService } from './configexport-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const configexportRoute: Routes = [
  {
    path: '',
    component: ConfigexportComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ConfigexportDetailComponent,
    resolve: {
      configexport: ConfigexportRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ConfigexportUpdateComponent,
    resolve: {
      configexport: ConfigexportRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ConfigexportUpdateComponent,
    resolve: {
      configexport: ConfigexportRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(configexportRoute)],
  exports: [RouterModule],
})
export class ConfigexportRoutingModule {}
