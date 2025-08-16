import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { PersonCompanyComponent } from '../list/person-company.component';
import { PersonCompanyDetailComponent } from '../detail/person-company-detail.component';
import { PersonCompanyUpdateComponent } from '../update/person-company-update.component';
import { PersonCompanyRoutingResolveService } from './person-company-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const personCompanyRoute: Routes = [
  {
    path: '',
    component: PersonCompanyComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: PersonCompanyDetailComponent,
    resolve: {
      personCompany: PersonCompanyRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: PersonCompanyUpdateComponent,
    resolve: {
      personCompany: PersonCompanyRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: PersonCompanyUpdateComponent,
    resolve: {
      personCompany: PersonCompanyRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(personCompanyRoute)],
  exports: [RouterModule],
})
export class PersonCompanyRoutingModule {}
