import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { SmtpConfigComponent } from '../list/smtp-config.component';
import { SmtpConfigDetailComponent } from '../detail/smtp-config-detail.component';
import { SmtpConfigUpdateComponent } from '../update/smtp-config-update.component';
import { SmtpConfigRoutingResolveService } from './smtp-config-routing-resolve.service';
import { ASC } from 'app/config/navigation.constants';

const smtpConfigRoute: Routes = [
  {
    path: '',
    component: SmtpConfigComponent,
    data: {
      defaultSort: 'id,' + ASC,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: SmtpConfigDetailComponent,
    resolve: {
      smtpConfig: SmtpConfigRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: SmtpConfigUpdateComponent,
    resolve: {
      smtpConfig: SmtpConfigRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: SmtpConfigUpdateComponent,
    resolve: {
      smtpConfig: SmtpConfigRoutingResolveService,
    },
    canActivate: [UserRouteAccessService],
  },
];

@NgModule({
  imports: [RouterModule.forChild(smtpConfigRoute)],
  exports: [RouterModule],
})
export class SmtpConfigRoutingModule {}
