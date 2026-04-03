import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ITypedocument, NewTypedocument } from '../typedocument.model';

export type PartialUpdateTypedocument = Partial<ITypedocument> & Pick<ITypedocument, 'id'>;

export type EntityResponseType = HttpResponse<ITypedocument>;
export type EntityArrayResponseType = HttpResponse<ITypedocument[]>;

@Injectable({ providedIn: 'root' })
export class TypedocumentService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/typedocuments', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(typedocument: NewTypedocument): Observable<EntityResponseType> {
    return this.http.post<ITypedocument>(this.resourceUrl, typedocument, { observe: 'response' });
  }

  update(typedocument: ITypedocument): Observable<EntityResponseType> {
    return this.http.put<ITypedocument>(`${this.resourceUrl}/${this.getTypedocumentIdentifier(typedocument)}`, typedocument, {
      observe: 'response',
    });
  }

  partialUpdate(typedocument: PartialUpdateTypedocument): Observable<EntityResponseType> {
    return this.http.patch<ITypedocument>(`${this.resourceUrl}/${this.getTypedocumentIdentifier(typedocument)}`, typedocument, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<ITypedocument>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<ITypedocument[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getTypedocumentIdentifier(typedocument: Pick<ITypedocument, 'id'>): number {
    return typedocument.id;
  }

  findByCorrespType(correspType: string): Observable<EntityArrayResponseType> {
    return this.http.get<ITypedocument[]>(`${this.resourceUrl}/by-corresp-type`, { params: { correspType }, observe: 'response' });
  }

  compareTypedocument(o1: Pick<ITypedocument, 'id'> | null, o2: Pick<ITypedocument, 'id'> | null): boolean {
    return o1 && o2 ? this.getTypedocumentIdentifier(o1) === this.getTypedocumentIdentifier(o2) : o1 === o2;
  }

  addTypedocumentToCollectionIfMissing<Type extends Pick<ITypedocument, 'id'>>(
    typedocumentCollection: Type[],
    ...typedocumentsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const typedocuments: Type[] = typedocumentsToCheck.filter(isPresent);
    if (typedocuments.length > 0) {
      const typedocumentCollectionIdentifiers = typedocumentCollection.map(
        typedocumentItem => this.getTypedocumentIdentifier(typedocumentItem)!
      );
      const typedocumentsToAdd = typedocuments.filter(typedocumentItem => {
        const typedocumentIdentifier = this.getTypedocumentIdentifier(typedocumentItem);
        if (typedocumentCollectionIdentifiers.includes(typedocumentIdentifier)) {
          return false;
        }
        typedocumentCollectionIdentifiers.push(typedocumentIdentifier);
        return true;
      });
      return [...typedocumentsToAdd, ...typedocumentCollection];
    }
    return typedocumentCollection;
  }
}
