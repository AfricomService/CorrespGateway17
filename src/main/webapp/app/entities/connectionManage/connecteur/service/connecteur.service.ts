import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IConnecteur, NewConnecteur } from '../connecteur.model';

export type PartialUpdateConnecteur = Partial<IConnecteur> & Pick<IConnecteur, 'id'>;

export type EntityResponseType = HttpResponse<IConnecteur>;
export type EntityArrayResponseType = HttpResponse<IConnecteur[]>;

@Injectable({ providedIn: 'root' })
export class ConnecteurService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/connecteurs', 'connectionmanage');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(connecteur: NewConnecteur): Observable<EntityResponseType> {
    return this.http.post<IConnecteur>(this.resourceUrl, connecteur, { observe: 'response' });
  }

  update(connecteur: IConnecteur): Observable<EntityResponseType> {
    return this.http.put<IConnecteur>(`${this.resourceUrl}/${this.getConnecteurIdentifier(connecteur)}`, connecteur, {
      observe: 'response',
    });
  }

  partialUpdate(connecteur: PartialUpdateConnecteur): Observable<EntityResponseType> {
    return this.http.patch<IConnecteur>(`${this.resourceUrl}/${this.getConnecteurIdentifier(connecteur)}`, connecteur, {
      observe: 'response',
    });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IConnecteur>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IConnecteur[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getConnecteurIdentifier(connecteur: Pick<IConnecteur, 'id'>): number {
    return connecteur.id;
  }

  compareConnecteur(o1: Pick<IConnecteur, 'id'> | null, o2: Pick<IConnecteur, 'id'> | null): boolean {
    return o1 && o2 ? this.getConnecteurIdentifier(o1) === this.getConnecteurIdentifier(o2) : o1 === o2;
  }

  addConnecteurToCollectionIfMissing<Type extends Pick<IConnecteur, 'id'>>(
    connecteurCollection: Type[],
    ...connecteursToCheck: (Type | null | undefined)[]
  ): Type[] {
    const connecteurs: Type[] = connecteursToCheck.filter(isPresent);
    if (connecteurs.length > 0) {
      const connecteurCollectionIdentifiers = connecteurCollection.map(connecteurItem => this.getConnecteurIdentifier(connecteurItem)!);
      const connecteursToAdd = connecteurs.filter(connecteurItem => {
        const connecteurIdentifier = this.getConnecteurIdentifier(connecteurItem);
        if (connecteurCollectionIdentifiers.includes(connecteurIdentifier)) {
          return false;
        }
        connecteurCollectionIdentifiers.push(connecteurIdentifier);
        return true;
      });
      return [...connecteursToAdd, ...connecteurCollection];
    }
    return connecteurCollection;
  }
}
