import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ISmtpConfig } from '../smtp-config.model';
import { SmtpConfigService } from '../service/smtp-config.service';

@Injectable({ providedIn: 'root' })
export class SmtpConfigRoutingResolveService implements Resolve<ISmtpConfig | null> {
  constructor(protected service: SmtpConfigService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ISmtpConfig | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((smtpConfig: HttpResponse<ISmtpConfig>) => {
          if (smtpConfig.body) {
            return of(smtpConfig.body);
          } else {
            this.router.navigate(['404']);
            return EMPTY;
          }
        })
      );
    }
    return of(null);
  }
}
