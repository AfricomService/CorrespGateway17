import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { MyreportComponent } from '../list/myreport.component';
import { MyreportDetailComponent } from '../detail/myreport-detail.component';
import { MyreportUpdateComponent } from '../update/myreport-update.component';
import { MyreportRoutingResolveService } from './myreport-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const myreportRoute: Routes = [
  {
    path: '',
    component: MyreportComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: MyreportDetailComponent,
    resolve: {
      myreport: MyreportRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: MyreportUpdateComponent,
    resolve: {
      myreport: MyreportRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: MyreportUpdateComponent,
    resolve: {
      myreport: MyreportRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(myreportRoute)],
  exports: [RouterModule],
})
export class MyreportRoutingModule {}
