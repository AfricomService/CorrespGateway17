import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';

export interface MySids {
  login: string;
  principalSid: string;
  departmentSids: string[];
  effectiveSids: string[];
  tokenAuthorities: string[];
  status: 'OK' | 'PARTIAL' | 'KO';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AclDiagnosticService {
  private resourceUrl = this.applicationConfigService.getEndpointFor('api/acl-diagnostic/me/sids', 'correspmanage');

  constructor(private http: HttpClient, private applicationConfigService: ApplicationConfigService) {}

  getMySids(): Observable<MySids> {
    return this.http.get<MySids>(this.resourceUrl);
  }
}
