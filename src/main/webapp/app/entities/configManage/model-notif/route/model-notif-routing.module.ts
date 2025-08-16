import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ModelNotifComponent } from '../list/model-notif.component';
import { ModelNotifDetailComponent } from '../detail/model-notif-detail.component';
import { ModelNotifUpdateComponent } from '../update/model-notif-update.component';
import { ModelNotifRoutingResolveService } from './model-notif-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const modelNotifRoute: Routes = [
  {
    path: '',
    component: ModelNotifComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ModelNotifDetailComponent,
    resolve: {
      modelNotif: ModelNotifRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ModelNotifUpdateComponent,
    resolve: {
      modelNotif: ModelNotifRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ModelNotifUpdateComponent,
    resolve: {
      modelNotif: ModelNotifRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(modelNotifRoute)],
  exports: [RouterModule],
})
export class ModelNotifRoutingModule {}
