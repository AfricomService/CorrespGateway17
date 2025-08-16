import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IDossier, NewDossier } from '../dossier.model';

export type PartialUpdateDossier = Partial<IDossier> & Pick<IDossier, 'id'>;

type RestOf<T extends IDossier | NewDossier> = Omit<T, 'updatedDate'> & {
  updatedDate?: string | null;
};

export type RestDossier = RestOf<IDossier>;

export type NewRestDossier = RestOf<NewDossier>;

export type PartialUpdateRestDossier = RestOf<PartialUpdateDossier>;

export type EntityResponseType = HttpResponse<IDossier>;
export type EntityArrayResponseType = HttpResponse<IDossier[]>;

@Injectable({ providedIn: 'root' })
export class DossierService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/dossiers', 'correspmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(dossier: NewDossier): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(dossier);
    return this.http
      .post<RestDossier>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(dossier: IDossier): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(dossier);
    return this.http
      .put<RestDossier>(`${this.resourceUrl}/${this.getDossierIdentifier(dossier)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(dossier: PartialUpdateDossier): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(dossier);
    return this.http
      .patch<RestDossier>(`${this.resourceUrl}/${this.getDossierIdentifier(dossier)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestDossier>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestDossier[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getDossierIdentifier(dossier: Pick<IDossier, 'id'>): number {
    return dossier.id;
  }

  compareDossier(o1: Pick<IDossier, 'id'> | null, o2: Pick<IDossier, 'id'> | null): boolean {
    return o1 && o2 ? this.getDossierIdentifier(o1) === this.getDossierIdentifier(o2) : o1 === o2;
  }

  addDossierToCollectionIfMissing<Type extends Pick<IDossier, 'id'>>(
    dossierCollection: Type[],
    ...dossiersToCheck: (Type | null | undefined)[]
  ): Type[] {
    const dossiers: Type[] = dossiersToCheck.filter(isPresent);
    if (dossiers.length > 0) {
      const dossierCollectionIdentifiers = dossierCollection.map(dossierItem => this.getDossierIdentifier(dossierItem)!);
      const dossiersToAdd = dossiers.filter(dossierItem => {
        const dossierIdentifier = this.getDossierIdentifier(dossierItem);
        if (dossierCollectionIdentifiers.includes(dossierIdentifier)) {
          return false;
        }
        dossierCollectionIdentifiers.push(dossierIdentifier);
        return true;
      });
      return [...dossiersToAdd, ...dossierCollection];
    }
    return dossierCollection;
  }

  protected convertDateFromClient<T extends IDossier | NewDossier | PartialUpdateDossier>(dossier: T): RestOf<T> {
    return {
      ...dossier,
      updatedDate: dossier.updatedDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restDossier: RestDossier): IDossier {
    return {
      ...restDossier,
      updatedDate: restDossier.updatedDate ? dayjs(restDossier.updatedDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestDossier>): HttpResponse<IDossier> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestDossier[]>): HttpResponse<IDossier[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
