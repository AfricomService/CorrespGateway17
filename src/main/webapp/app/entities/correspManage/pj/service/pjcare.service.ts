// src/main/webapp/app/entities/correspManage/pj/service/pjcare.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface PjCareScannerList {
  status: number;
  driver: string;
  scanners: string[];
  error?: string;
  warning?: string;
}

export interface PjCareScanResult {
  status: number;
  driver: string;
  data: string;
  file: string;
  format: string;
  bitdepth: string;
  error?: string;
}

export interface PjCareHealth {
  status: number;
  service: string;
  naps2: 'found' | 'missing';
  naps2Path: string | null;
  twain: 'ready' | 'unavailable';
  platform: string;
  defaultDriver: string;
  drivers: PjCareDriverInfo[];
  timestamp: string;
}

export interface PjCareDriverInfo {
  key: string;
  label: string;
  description: string;
}

export interface PjCareDriverList {
  status: number;
  platform: string;
  drivers: PjCareDriverInfo[];
}

// 'tiff' ajouté pour correspondre aux formats supportés par le nouveau server.js
export type ScanFormat = 'jpg' | 'png' | 'pdf' | 'tiff';
export type ScanDriver = 'wia' | 'twain' | 'escl' | 'sane' | 'apple';
export type ScanBitdepth = 'color' | 'gray' | 'bw';

export interface ScanParams {
  source: string;
  driver?: ScanDriver;
  format?: ScanFormat;
  dpi?: number;
  jpegquality?: number;
  name?: string;
  bitdepth?: ScanBitdepth;
  duplex?: boolean;
  excludeBlank?: boolean;
  blankThreshold?: number;
  coverageThreshold?: number;
}

/** Une page individuelle dans le buffer multi-pages */
export interface ScannedPage {
  data: string; // base64 brut
  format: string; // format de la page
  preview: string | null; // data-URI ou null pour PDF
  pageNumber: number; // numéro 1-based
}

/** Corps de POST /api/MergePages */
export interface MergePagesRequest {
  pages: Array<{ data: string; format: string }>;
  outputFormat: ScanFormat;
  jpegquality?: number;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class PjCareService {
  private readonly BASE_URL = 'http://127.0.0.1:7777/api';

  constructor(private http: HttpClient) {}

  isAvailable(): Observable<boolean> {
    return this.http.get<PjCareHealth>(`${this.BASE_URL}/health`).pipe(
      map(res => res.status === 200),
      catchError(() => of(false))
    );
  }

  getHealth(): Observable<PjCareHealth | null> {
    return this.http.get<PjCareHealth>(`${this.BASE_URL}/health`).pipe(catchError(() => of(null)));
  }

  /**
   * Retourne la liste des drivers disponibles sur le poste (selon l'OS).
   * Appeler cette méthode au chargement du modal pour alimenter le <select> driver.
   */
  getDrivers(): Observable<PjCareDriverList> {
    return this.http
      .get<PjCareDriverList>(`${this.BASE_URL}/drivers`)
      .pipe(catchError(() => of({ status: 500, platform: '', drivers: [] })));
  }

  /**
   * Liste les scanners disponibles pour un driver donné.
   * Si driver n'est pas fourni, PjCare utilise le driver par défaut de l'OS.
   */
  getScanners(driver?: ScanDriver): Observable<PjCareScannerList> {
    const params: any = {};
    if (driver) {
      params.driver = driver;
    }

    return this.http
      .get<PjCareScannerList>(`${this.BASE_URL}/GetListScanner`, { params })
      .pipe(catchError(() => of({ status: 500, driver: driver ?? '', scanners: [], error: 'PjCare inaccessible' })));
  }

  /**
   * Lance un scan avec les paramètres fournis.
   * Le champ driver permet de choisir wia | twain | escl | sane | apple.
   */
  scan(params: ScanParams): Observable<PjCareScanResult> {
    const queryParams: any = {
      source: params.source,
      format: params.format ?? 'jpg',
      dpi: params.dpi ?? 150,
      jpegquality: params.jpegquality ?? 75,
    };

    if (params.driver) {
      queryParams.driver = params.driver;
    }

    if (params.name) {
      queryParams.name = params.name;
    }

    if (params.bitdepth) {
      queryParams.bitdepth = params.bitdepth;
    }

    if (params.duplex === true) {
      queryParams.duplex = 'true';
    }

    if (params.excludeBlank === true) {
      queryParams.excludeblank = 'true';
      queryParams.blankthreshold = params.blankThreshold ?? 70;
      queryParams.coveragethreshold = params.coverageThreshold ?? 25;
    }

    return this.http
      .get<PjCareScanResult>(`${this.BASE_URL}/Acquire`, {
        params: queryParams,
      })
      .pipe(
        catchError(err =>
          of({
            status: 500,
            driver: params.driver ?? '',
            data: '',
            file: '',
            format: params.format ?? 'jpg',
            bitdepth: params.bitdepth ?? 'color',
            error: err?.error?.error ?? 'Erreur lors de la numérisation',
          })
        )
      );
  }
  mergePages(request: MergePagesRequest): Observable<PjCareScanResult> {
    return this.http.post<PjCareScanResult>(`${this.BASE_URL}/MergePages`, request).pipe(
      catchError(err =>
        of({
          status: 500,
          driver: 'merge',
          data: '',
          file: '',
          format: request.outputFormat,
          bitdepth: 'color',
          error: err?.error?.error ?? 'Erreur lors de la fusion des pages',
        })
      )
    );
  }
}
