import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { RulesComponent } from '../list/rules.component';
import { RulesDetailComponent } from '../detail/rules-detail.component';
import { RulesUpdateComponent } from '../update/rules-update.component';
import { RulesRoutingResolveService } from './rules-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const rulesRoute: Routes = [
  {
    path: '',
    component: RulesComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: RulesDetailComponent,
    resolve: {
      rules: RulesRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: RulesUpdateComponent,
    resolve: {
      rules: RulesRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: RulesUpdateComponent,
    resolve: {
      rules: RulesRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(rulesRoute)],
  exports: [RouterModule],
})
export class RulesRoutingModule {}
