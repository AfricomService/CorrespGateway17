import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IConfigexport, NewConfigexport } from '../configexport.model';

export type PartialUpdateConfigexport = Partial<IConfigexport> & Pick<IConfigexport, 'id'>;

type RestOf<T extends IConfigexport | NewConfigexport> = Omit<T, 'dateCreated'> & {
  dateCreated?: string | null;
};

export type RestConfigexport = RestOf<IConfigexport>;

export type NewRestConfigexport = RestOf<NewConfigexport>;

export type PartialUpdateRestConfigexport = RestOf<PartialUpdateConfigexport>;

export type EntityResponseType = HttpResponse<IConfigexport>;
export type EntityArrayResponseType = HttpResponse<IConfigexport[]>;

@Injectable({ providedIn: 'root' })
export class ConfigexportService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/configexports', 'configmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(configexport: NewConfigexport): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(configexport);
    return this.http
      .post<RestConfigexport>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(configexport: IConfigexport): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(configexport);
    return this.http
      .put<RestConfigexport>(`${this.resourceUrl}/${this.getConfigexportIdentifier(configexport)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(configexport: PartialUpdateConfigexport): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(configexport);
    return this.http
      .patch<RestConfigexport>(`${this.resourceUrl}/${this.getConfigexportIdentifier(configexport)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestConfigexport>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestConfigexport[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getConfigexportIdentifier(configexport: Pick<IConfigexport, 'id'>): number {
    return configexport.id;
  }

  compareConfigexport(o1: Pick<IConfigexport, 'id'> | null, o2: Pick<IConfigexport, 'id'> | null): boolean {
    return o1 && o2 ? this.getConfigexportIdentifier(o1) === this.getConfigexportIdentifier(o2) : o1 === o2;
  }

  addConfigexportToCollectionIfMissing<Type extends Pick<IConfigexport, 'id'>>(
    configexportCollection: Type[],
    ...configexportsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const configexports: Type[] = configexportsToCheck.filter(isPresent);
    if (configexports.length > 0) {
      const configexportCollectionIdentifiers = configexportCollection.map(
        configexportItem => this.getConfigexportIdentifier(configexportItem)!
      );
      const configexportsToAdd = configexports.filter(configexportItem => {
        const configexportIdentifier = this.getConfigexportIdentifier(configexportItem);
        if (configexportCollectionIdentifiers.includes(configexportIdentifier)) {
          return false;
        }
        configexportCollectionIdentifiers.push(configexportIdentifier);
        return true;
      });
      return [...configexportsToAdd, ...configexportCollection];
    }
    return configexportCollection;
  }

  protected convertDateFromClient<T extends IConfigexport | NewConfigexport | PartialUpdateConfigexport>(configexport: T): RestOf<T> {
    return {
      ...configexport,
      dateCreated: configexport.dateCreated?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restConfigexport: RestConfigexport): IConfigexport {
    return {
      ...restConfigexport,
      dateCreated: restConfigexport.dateCreated ? dayjs(restConfigexport.dateCreated) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestConfigexport>): HttpResponse<IConfigexport> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestConfigexport[]>): HttpResponse<IConfigexport[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
