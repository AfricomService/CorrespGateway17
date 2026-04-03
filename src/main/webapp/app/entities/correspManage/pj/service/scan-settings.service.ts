import { Injectable } from '@angular/core';

export interface ScanSettings {
  scanFormat: 'jpg' | 'png' | 'pdf' | 'tiff';
  scanDpi: number;
  scanQuality: number;
  scanBitdepth: 'color' | 'gray' | 'bw';
  scanDuplex: boolean;
  scanExcludeBlank: boolean;
  scanBlankThreshold: number;
  scanCoverageThreshold: number;
  selectedDriver: string;
}

const COOKIE_KEY = 'pjcare_scan_settings';
const COOKIE_DAYS = 365;

const DEFAULTS: ScanSettings = {
  scanFormat: 'pdf',
  scanDpi: 150,
  scanQuality: 75,
  scanBitdepth: 'color',
  scanDuplex: false,
  scanExcludeBlank: false,
  scanBlankThreshold: 240,
  scanCoverageThreshold: 5,
  selectedDriver: '',
};

@Injectable({ providedIn: 'root' })
export class ScanSettingsService {
  load(): ScanSettings {
    try {
      const raw = this.getCookie(COOKIE_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(decodeURIComponent(raw));
      // Fusionner avec les defaults pour garantir les champs manquants
      return { ...DEFAULTS, ...parsed };
    } catch {
      return { ...DEFAULTS };
    }
  }

  hasSettings(): boolean {
    return !!this.getCookie(COOKIE_KEY);
  }

  save(settings: Partial<ScanSettings>): void {
    try {
      const current = this.load();
      const merged = { ...current, ...settings };
      const encoded = encodeURIComponent(JSON.stringify(merged));
      this.setCookie(COOKIE_KEY, encoded, COOKIE_DAYS);
    } catch {
      // Ignorer silencieusement les erreurs de sérialisation
    }
  }

  reset(): void {
    this.deleteCookie(COOKIE_KEY);
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? match[1] : null;
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    // SameSite=Strict pour éviter les requêtes cross-site
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
  }
}
