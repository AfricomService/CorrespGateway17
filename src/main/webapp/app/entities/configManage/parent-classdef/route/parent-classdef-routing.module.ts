import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ParentClassdefComponent } from '../list/parent-classdef.component';
import { ParentClassdefDetailComponent } from '../detail/parent-classdef-detail.component';
import { ParentClassdefUpdateComponent } from '../update/parent-classdef-update.component';
import { ParentClassdefRoutingResolveService } from './parent-classdef-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const parentClassdefRoute: Routes = [
  {
    path: '',
    component: ParentClassdefComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ParentClassdefDetailComponent,
    resolve: {
      parentClassdef: ParentClassdefRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ParentClassdefUpdateComponent,
    resolve: {
      parentClassdef: ParentClassdefRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ParentClassdefUpdateComponent,
    resolve: {
      parentClassdef: ParentClassdefRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(parentClassdefRoute)],
  exports: [RouterModule],
})
export class ParentClassdefRoutingModule {}
