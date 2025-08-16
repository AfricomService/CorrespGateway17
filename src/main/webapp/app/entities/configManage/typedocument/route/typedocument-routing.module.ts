import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { TypedocumentComponent } from '../list/typedocument.component';
import { TypedocumentDetailComponent } from '../detail/typedocument-detail.component';
import { TypedocumentUpdateComponent } from '../update/typedocument-update.component';
import { TypedocumentRoutingResolveService } from './typedocument-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const typedocumentRoute: Routes = [
  {
    path: '',
    component: TypedocumentComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: TypedocumentDetailComponent,
    resolve: {
      typedocument: TypedocumentRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: TypedocumentUpdateComponent,
    resolve: {
      typedocument: TypedocumentRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: TypedocumentUpdateComponent,
    resolve: {
      typedocument: TypedocumentRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(typedocumentRoute)],
  exports: [RouterModule],
})
export class TypedocumentRoutingModule {}
