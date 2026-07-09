import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { DetailInfoComponent } from '../list/detail-info.component';
import { DetailInfoUpdateComponent } from '../update/detail-info-update.component';
import { DetailInfoRoutingResolveService } from './detail-info-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const detailInfoRoute = [
  {
    path: '',
    component: DetailInfoComponent,
    data: {
      defaultSort: 'id,' + ASC,
      pageTitle: 'correspCareApp.configManageDetailInfo.home.title',
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: DetailInfoUpdateComponent,
    resolve: { detailInfo: DetailInfoRoutingResolveService },
    data: {
      pageTitle: 'correspCareApp.configManageDetailInfo.home.createOrEditLabel',
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: DetailInfoUpdateComponent,
    resolve: { detailInfo: DetailInfoRoutingResolveService },
    data: {
      pageTitle: 'correspCareApp.configManageDetailInfo.home.createOrEditLabel',
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(detailInfoRoute)],
  exports: [RouterModule],
})
export class DetailInfoRoutingModule {}
