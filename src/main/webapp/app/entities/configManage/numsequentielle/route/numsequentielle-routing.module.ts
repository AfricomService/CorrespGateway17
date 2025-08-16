import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { NumsequentielleComponent } from '../list/numsequentielle.component';
import { NumsequentielleDetailComponent } from '../detail/numsequentielle-detail.component';
import { NumsequentielleUpdateComponent } from '../update/numsequentielle-update.component';
import { NumsequentielleRoutingResolveService } from './numsequentielle-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const numsequentielleRoute: Routes = [
  {
    path: '',
    component: NumsequentielleComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: NumsequentielleDetailComponent,
    resolve: {
      numsequentielle: NumsequentielleRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: NumsequentielleUpdateComponent,
    resolve: {
      numsequentielle: NumsequentielleRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: NumsequentielleUpdateComponent,
    resolve: {
      numsequentielle: NumsequentielleRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(numsequentielleRoute)],
  exports: [RouterModule],
})
export class NumsequentielleRoutingModule {}
