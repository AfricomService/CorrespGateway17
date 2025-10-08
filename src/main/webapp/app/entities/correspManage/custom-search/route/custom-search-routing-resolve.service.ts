import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of, EMPTY } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ICustomSearch } from '../custom-search.model';
import { CustomSearchService } from '../service/custom-search.service';

@Injectable({ providedIn: 'root' })
export class CustomSearchRoutingResolveService implements Resolve<ICustomSearch | null> {
  constructor(protected service: CustomSearchService, protected router: Router) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ICustomSearch | null | never> {
    const id = route.params['id'];
    if (id) {
      return this.service.find(id).pipe(
        mergeMap((customSearch: HttpResponse<ICustomSearch>) => {
          if (customSearch.body) {
            return of(customSearch.body);
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
