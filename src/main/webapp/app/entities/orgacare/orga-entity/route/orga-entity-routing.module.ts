import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { OrgaEntityComponent } from '../list/orga-entity.component';
import { OrgaEntityDetailComponent } from '../detail/orga-entity-detail.component';
import { OrgaEntityUpdateComponent } from '../update/orga-entity-update.component';
import { OrgaEntityRoutingResolveService } from './orga-entity-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const orgaEntityRoute: Routes = [
  {
    path: '',
    component: OrgaEntityComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: OrgaEntityDetailComponent,
    resolve: {
      orgaEntity: OrgaEntityRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: OrgaEntityUpdateComponent,
    resolve: {
      orgaEntity: OrgaEntityRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: OrgaEntityUpdateComponent,
    resolve: {
      orgaEntity: OrgaEntityRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(orgaEntityRoute)],
  exports: [RouterModule],
})
export class OrgaEntityRoutingModule {}
