import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { NotifComponent } from '../list/notif.component';
import { NotifDetailComponent } from '../detail/notif-detail.component';
import { NotifUpdateComponent } from '../update/notif-update.component';
import { NotifRoutingResolveService } from './notif-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const notifRoute: Routes = [
  {
    path: '',
    component: NotifComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: NotifDetailComponent,
    resolve: {
      notif: NotifRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: NotifUpdateComponent,
    resolve: {
      notif: NotifRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: NotifUpdateComponent,
    resolve: {
      notif: NotifRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(notifRoute)],
  exports: [RouterModule],
})
export class NotifRoutingModule {}
