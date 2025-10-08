import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { CustomSearchComponent } from '../list/custom-search.component';
import { CustomSearchDetailComponent } from '../detail/custom-search-detail.component';
import { CustomSearchUpdateComponent } from '../update/custom-search-update.component';
import { CustomSearchRoutingResolveService } from './custom-search-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const customSearchRoute: Routes = [
  {
    path: '',
    component: CustomSearchComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: CustomSearchDetailComponent,
    resolve: {
      customSearch: CustomSearchRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: CustomSearchUpdateComponent,
    resolve: {
      customSearch: CustomSearchRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: CustomSearchUpdateComponent,
    resolve: {
      customSearch: CustomSearchRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(customSearchRoute)],
  exports: [RouterModule],
})
export class CustomSearchRoutingModule {}
