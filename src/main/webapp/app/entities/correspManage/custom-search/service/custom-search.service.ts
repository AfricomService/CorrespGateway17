import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ICustomSearch, NewCustomSearch } from '../custom-search.model';
import { CustomSearchView } from '../custom-search-view';

export type PartialUpdateCustomSearch = Partial<ICustomSearch> & Pick<ICustomSearch, 'id'>;

type RestOf<T extends ICustomSearch | NewCustomSearch> = Omit<T, 'dateCreation'> & {
  dateCreation?: string | null;
};

export type RestCustomSearch = RestOf<ICustomSearch>;

export type NewRestCustomSearch = RestOf<NewCustomSearch>;

export type PartialUpdateRestCustomSearch = RestOf<PartialUpdateCustomSearch>;

export type EntityResponseType = HttpResponse<ICustomSearch>;
export type EntityArrayResponseType = HttpResponse<ICustomSearch[]>;

@Injectable({ providedIn: 'root' })
export class CustomSearchService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/custom-searches', 'correspmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(customSearch: NewCustomSearch): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(customSearch);
    return this.http
      .post<RestCustomSearch>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(customSearch: ICustomSearch): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(customSearch);
    return this.http
      .put<RestCustomSearch>(`${this.resourceUrl}/${this.getCustomSearchIdentifier(customSearch)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(customSearch: PartialUpdateCustomSearch): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(customSearch);
    return this.http
      .patch<RestCustomSearch>(`${this.resourceUrl}/${this.getCustomSearchIdentifier(customSearch)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestCustomSearch>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestCustomSearch[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getCustomSearchIdentifier(customSearch: Pick<ICustomSearch, 'id'>): number {
    return customSearch.id;
  }

  compareCustomSearch(o1: Pick<ICustomSearch, 'id'> | null, o2: Pick<ICustomSearch, 'id'> | null): boolean {
    return o1 && o2 ? this.getCustomSearchIdentifier(o1) === this.getCustomSearchIdentifier(o2) : o1 === o2;
  }

  addCustomSearchToCollectionIfMissing<Type extends Pick<ICustomSearch, 'id'>>(
    customSearchCollection: Type[],
    ...customSearchesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const customSearches: Type[] = customSearchesToCheck.filter(isPresent);
    if (customSearches.length > 0) {
      const customSearchCollectionIdentifiers = customSearchCollection.map(
        customSearchItem => this.getCustomSearchIdentifier(customSearchItem)!
      );
      const customSearchesToAdd = customSearches.filter(customSearchItem => {
        const customSearchIdentifier = this.getCustomSearchIdentifier(customSearchItem);
        if (customSearchCollectionIdentifiers.includes(customSearchIdentifier)) {
          return false;
        }
        customSearchCollectionIdentifiers.push(customSearchIdentifier);
        return true;
      });
      return [...customSearchesToAdd, ...customSearchCollection];
    }
    return customSearchCollection;
  }

  protected convertDateFromClient<T extends ICustomSearch | NewCustomSearch | PartialUpdateCustomSearch>(customSearch: T): RestOf<T> {
    return {
      ...customSearch,
      dateCreation: customSearch.dateCreation?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restCustomSearch: RestCustomSearch): ICustomSearch {
    return {
      ...restCustomSearch,
      dateCreation: restCustomSearch.dateCreation ? dayjs(restCustomSearch.dateCreation) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestCustomSearch>): HttpResponse<ICustomSearch> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestCustomSearch[]>): HttpResponse<ICustomSearch[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }

  saveCustomSearch(req?: any): Observable<any> {
    const options = createRequestOption(req);

    return this.http.post(`${this.resourceUrl}/saveRequest`, null, {
      params: options,
      responseType: 'text',
    });
  }

  getByUserLogin(): Observable<CustomSearchView[]> {
    return this.http.get<CustomSearchView[]>(`${this.resourceUrl}/findByUserLogin`);
  }
}
