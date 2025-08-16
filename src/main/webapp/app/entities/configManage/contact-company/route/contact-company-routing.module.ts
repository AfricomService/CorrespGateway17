import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ContactCompanyComponent } from '../list/contact-company.component';
import { ContactCompanyDetailComponent } from '../detail/contact-company-detail.component';
import { ContactCompanyUpdateComponent } from '../update/contact-company-update.component';
import { ContactCompanyRoutingResolveService } from './contact-company-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const contactCompanyRoute: Routes = [
  {
    path: '',
    component: ContactCompanyComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ContactCompanyDetailComponent,
    resolve: {
      contactCompany: ContactCompanyRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ContactCompanyUpdateComponent,
    resolve: {
      contactCompany: ContactCompanyRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ContactCompanyUpdateComponent,
    resolve: {
      contactCompany: ContactCompanyRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(contactCompanyRoute)],
  exports: [RouterModule],
})
export class ContactCompanyRoutingModule {}
