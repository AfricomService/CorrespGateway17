import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { INumsequentielle, NewNumsequentielle } from '../numsequentielle.model';

export type PartialUpdateNumsequentielle = Partial<INumsequentielle> & Pick<INumsequentielle, 'id'>;

export type EntityResponseType = HttpResponse<INumsequentielle>;
export type EntityArrayResponseType = HttpResponse<INumsequentielle[]>;

@Injectable({ providedIn: 'root' })
export class NumsequentielleService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/numsequentielles', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(numsequentielle: NewNumsequentielle): Observable<EntityResponseType> {
    return this.http.post<INumsequentielle>(this.resourceUrl, numsequentielle, { observe: 'response' });
  }

  update(numsequentielle: INumsequentielle): Observable<EntityResponseType> {
    return this.http.put<INumsequentielle>(`${this.resourceUrl}/${this.getNumsequentielleIdentifier(numsequentielle)}`, numsequentielle, {
      observe: 'response',
    });
  }

  partialUpdate(numsequentielle: PartialUpdateNumsequentielle): Observable<EntityResponseType> {
    return this.http.patch<INumsequentielle>(`${this.resourceUrl}/${this.getNumsequentielleIdentifier(numsequentielle)}`, numsequentielle, {
      observe: 'response',
    });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<INumsequentielle>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<INumsequentielle[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getNumsequentielleIdentifier(numsequentielle: Pick<INumsequentielle, 'id'>): string {
    return numsequentielle.id;
  }

  compareNumsequentielle(o1: Pick<INumsequentielle, 'id'> | null, o2: Pick<INumsequentielle, 'id'> | null): boolean {
    return o1 && o2 ? this.getNumsequentielleIdentifier(o1) === this.getNumsequentielleIdentifier(o2) : o1 === o2;
  }

  addNumsequentielleToCollectionIfMissing<Type extends Pick<INumsequentielle, 'id'>>(
    numsequentielleCollection: Type[],
    ...numsequentiellesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const numsequentielles: Type[] = numsequentiellesToCheck.filter(isPresent);
    if (numsequentielles.length > 0) {
      const numsequentielleCollectionIdentifiers = numsequentielleCollection.map(
        numsequentielleItem => this.getNumsequentielleIdentifier(numsequentielleItem)!
      );
      const numsequentiellesToAdd = numsequentielles.filter(numsequentielleItem => {
        const numsequentielleIdentifier = this.getNumsequentielleIdentifier(numsequentielleItem);
        if (numsequentielleCollectionIdentifiers.includes(numsequentielleIdentifier)) {
          return false;
        }
        numsequentielleCollectionIdentifiers.push(numsequentielleIdentifier);
        return true;
      });
      return [...numsequentiellesToAdd, ...numsequentielleCollection];
    }
    return numsequentielleCollection;
  }
}
