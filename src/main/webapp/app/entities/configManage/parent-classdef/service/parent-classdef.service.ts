import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IParentClassdef, NewParentClassdef } from '../parent-classdef.model';

export type PartialUpdateParentClassdef = Partial<IParentClassdef> & Pick<IParentClassdef, 'id'>;

export type EntityResponseType = HttpResponse<IParentClassdef>;
export type EntityArrayResponseType = HttpResponse<IParentClassdef[]>;

@Injectable({ providedIn: 'root' })
export class ParentClassdefService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/parent-classdefs', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(parentClassdef: NewParentClassdef): Observable<EntityResponseType> {
    return this.http.post<IParentClassdef>(this.resourceUrl, parentClassdef, { observe: 'response' });
  }

  update(parentClassdef: IParentClassdef): Observable<EntityResponseType> {
    return this.http.put<IParentClassdef>(`${this.resourceUrl}/${this.getParentClassdefIdentifier(parentClassdef)}`, parentClassdef, {
      observe: 'response',
    });
  }

  partialUpdate(parentClassdef: PartialUpdateParentClassdef): Observable<EntityResponseType> {
    return this.http.patch<IParentClassdef>(`${this.resourceUrl}/${this.getParentClassdefIdentifier(parentClassdef)}`, parentClassdef, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IParentClassdef>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IParentClassdef[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getParentClassdefIdentifier(parentClassdef: Pick<IParentClassdef, 'id'>): number {
    return parentClassdef.id;
  }

  compareParentClassdef(o1: Pick<IParentClassdef, 'id'> | null, o2: Pick<IParentClassdef, 'id'> | null): boolean {
    return o1 && o2 ? this.getParentClassdefIdentifier(o1) === this.getParentClassdefIdentifier(o2) : o1 === o2;
  }

  /**
   * Récupère le numéro suivant pour le type donné (renvoie une chaîne plain text).
   * Exemple d'URL (via gateway) : /services/configmanage/api/parent-classdefs/next/INCOMING
   */
  getNextNumber(type: string, societeCode?: string | null): Observable<string> {
    let url = `${this.resourceUrl}/next/${encodeURIComponent(type)}`;
    if (societeCode) {
      url += `?societeCode=${encodeURIComponent(societeCode)}`;
    }
    return this.http.get(url, { responseType: 'text' });
  }

  addParentClassdefToCollectionIfMissing<Type extends Pick<IParentClassdef, 'id'>>(
    parentClassdefCollection: Type[],
    ...parentClassdefsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const parentClassdefs: Type[] = parentClassdefsToCheck.filter(isPresent);
    if (parentClassdefs.length > 0) {
      const parentClassdefCollectionIdentifiers = parentClassdefCollection.map(
        parentClassdefItem => this.getParentClassdefIdentifier(parentClassdefItem)!
      );
      const parentClassdefsToAdd = parentClassdefs.filter(parentClassdefItem => {
        const parentClassdefIdentifier = this.getParentClassdefIdentifier(parentClassdefItem);
        if (parentClassdefCollectionIdentifiers.includes(parentClassdefIdentifier)) {
          return false;
        }
        parentClassdefCollectionIdentifiers.push(parentClassdefIdentifier);
        return true;
      });
      return [...parentClassdefsToAdd, ...parentClassdefCollection];
    }
    return parentClassdefCollection;
  }
}
