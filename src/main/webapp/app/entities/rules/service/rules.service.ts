import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IRules, NewRules } from '../rules.model';

export type PartialUpdateRules = Partial<IRules> & Pick<IRules, 'id'>;

export type EntityResponseType = HttpResponse<IRules>;
export type EntityArrayResponseType = HttpResponse<IRules[]>;

@Injectable({ providedIn: 'root' })
export class RulesService {
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/rules');

  constructor(protected http: HttpClient, protected applicationConfigService: ApplicationConfigService) {}

  create(rules: NewRules): Observable<EntityResponseType> {
    return this.http.post<IRules>(this.resourceUrl, rules, { observe: 'response' });
  }

  update(rules: IRules): Observable<EntityResponseType> {
    return this.http.put<IRules>(`${this.resourceUrl}/${this.getRulesIdentifier(rules)}`, rules, { observe: 'response' });
  }

  partialUpdate(rules: PartialUpdateRules): Observable<EntityResponseType> {
    return this.http.patch<IRules>(`${this.resourceUrl}/${this.getRulesIdentifier(rules)}`, rules, { observe: 'response' });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<IRules>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IRules[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getRulesIdentifier(rules: Pick<IRules, 'id'>): number {
    return rules.id;
  }

  compareRules(o1: Pick<IRules, 'id'> | null, o2: Pick<IRules, 'id'> | null): boolean {
    return o1 && o2 ? this.getRulesIdentifier(o1) === this.getRulesIdentifier(o2) : o1 === o2;
  }

  addRulesToCollectionIfMissing<Type extends Pick<IRules, 'id'>>(
    rulesCollection: Type[],
    ...rulesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const rules: Type[] = rulesToCheck.filter(isPresent);
    if (rules.length > 0) {
      const rulesCollectionIdentifiers = rulesCollection.map(rulesItem => this.getRulesIdentifier(rulesItem)!);
      const rulesToAdd = rules.filter(rulesItem => {
        const rulesIdentifier = this.getRulesIdentifier(rulesItem);
        if (rulesCollectionIdentifiers.includes(rulesIdentifier)) {
          return false;
        }
        rulesCollectionIdentifiers.push(rulesIdentifier);
        return true;
      });
      return [...rulesToAdd, ...rulesCollection];
    }
    return rulesCollection;
  }
}
