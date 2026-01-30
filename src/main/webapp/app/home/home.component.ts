// src/main/webapp/app/home/home.component.ts
// Modernized HomeComponent — tâches affichées en cartes (dossiers supprimés)
// Corrigé : conversion dates + utilisation de status / dueDate
// Ajout : export Excel (.xlsx) via import dynamique de sheetjs (xlsx)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ITasks } from '../entities/correspManage/tasks/tasks.model';
import { HttpResponse } from '@angular/common/http';
import { TasksService } from '../entities/correspManage/tasks/service/tasks.service';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrls: ['home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  account: Account | null = null;
  tasks?: ITasks[];
  authSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  // recherche simple côté client
  searchTerm = '';

  // petits réglages visuels/restants
  loadPanel = { enabled: true };
  sorting = { mode: 'none' };

  constructor(
    private accountService: AccountService,
    private router: Router,
    private tasksService: TasksService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // --- Merge local translations to prevent translation-not-found ---
    const fr = {
      home: {
        title: 'Bienvenue, {{firstName}}',
        subtitle: 'Gérez vos courriers et tâches en toute simplicité',
        newMail: '✨ Nouveau Courrier',
        arrival: 'ARRIVÉE',
        arrivalSub: 'Enregistrer un courrier entrant',
        outgoing: 'SORTANT',
        outgoingSub: 'Créer un courrier sortant',
        internal: 'INTERNE',
        internalSub: 'Communication interne',
        panelsTitle: 'Tâches',
        tasksTitle: 'Tâches en cours',
        searchTasksLabel: 'Rechercher tâches',
        searchTasks: 'Rechercher une tâche',
        search: 'Rechercher',
        clearSearch: 'Effacer la recherche',
        exportExcel: 'Excel',
        exportCsv: 'CSV',
        objet: 'Objet',
        creation: 'Création',
        limite: 'Limite',
        responsable: 'Responsable',
        etat: 'État',
      },
    };

    const en = {
      home: {
        title: 'Welcome, {{firstName}}',
        subtitle: 'Manage your mail and tasks with ease',
        panelsTitle: 'Tasks',
        tasksTitle: 'Active Tasks',
        searchTasksLabel: 'Search tasks',
        searchTasks: 'Search a task',
        search: 'Search',
        clearSearch: 'Clear search',
        exportExcel: 'Excel',
        exportCsv: 'CSV',
        objet: 'Object',
        creation: 'Creation',
        limite: 'Deadline',
        responsable: 'Responsible',
        etat: 'Status',
      },
    };

    try {
      this.translate.setTranslation('fr', fr, true);
      this.translate.setTranslation('en', en, true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Erreur lors de l'enregistrement local des traductions home.*", err);
    }
    // ---------------------------------------------------------------

    this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => (this.account = account));

    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // --------- Data ----------
  loadTasks(): void {
    this.tasksService
      .getAllTasksByEtat({ etat: 'IN_PROGRESS' })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: HttpResponse<ITasks[]>) => {
        const raw = res.body || [];
        // convertit les champs de date (Dayjs, string, Date, ...) en Date natif ou undefined
        this.tasks = raw.map(t => {
          const copy: any = { ...t };
          const dateFields = ['creationDate', 'startDate', 'dueDate', 'closeDate', 'updatedDate'];
          dateFields.forEach(f => {
            const v = (copy as any)[f];
            if (v == null) {
              (copy as any)[f] = undefined;
              return;
            }
            // si c'est un objet qui a toDate (ex: dayjs)
            if (typeof (v as any).toDate === 'function') {
              try {
                (copy as any)[f] = (v as any).toDate();
              } catch {
                (copy as any)[f] = undefined;
              }
            } else if (typeof v === 'string' || typeof v === 'number') {
              const d = new Date(v);
              (copy as any)[f] = isNaN(d.getTime()) ? undefined : d;
            } else if (v instanceof Date) {
              (copy as any)[f] = v;
            } else {
              // fallback: undefined to être safe pour pipe date
              (copy as any)[f] = undefined;
            }
          });
          return copy as ITasks;
        });
      });
  }

  refresh(): void {
    this.loadTasks();
  }

  get tasksCount(): number {
    return this.tasks ? this.tasks.length : 0;
  }

  // recherche simple côté client : filtre object / responsible / status
  get displayedTasks(): ITasks[] {
    if (!this.tasks) {
      return [];
    }
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) {
      return this.tasks;
    }
    return this.tasks.filter(t => {
      const obj = ((t as any).object || '').toString().toLowerCase();
      const resp = ((t as any).responsible || '').toString().toLowerCase();
      const status = String((t as any).status || '').toLowerCase();
      return obj.includes(q) || resp.includes(q) || status.includes(q);
    });
  }

  // --------- Navigation / interactions ----------
  onTypeClicked(type: string): void {
    this.router.navigate(['/corresp/new'], { queryParams: { type } });
  }

  openTask(task: ITasks): void {
    if (task && (task as any).id != null) {
      this.router.navigate([`/tasks/${(task as any).id}/view`]);
    }
  }

  // handlers recherche
  onTasksSearchInput(value: string): void {
    this.searchTerm = value || '';
  }
  onTasksSearchClick(value: string): void {
    this.searchTerm = value || '';
  }
  clearTasksSearch(input: HTMLInputElement): void {
    if (input) {
      input.value = '';
    }
    this.searchTerm = '';
  }

  // --------- Export helpers ----------
  // Export Excel (.xlsx) — utilise import dynamique de 'xlsx' (sheetjs)
  exportTasksToExcel(): void {
    if (!this.tasks || this.tasks.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('Aucune tâche à exporter.');
      return;
    }

    // Prépare les données: transforme dates en ISO et objets en JSON pour éviter erreurs
    const headers = this.guessHeadersFromArray(this.tasks);
    const rows = this.tasks.map(r => {
      const out: any = {};
      headers.forEach(h => {
        const v = (r as any)[h];
        if (v == null) {
          out[h] = '';
        } else if (v instanceof Date) {
          out[h] = v.toISOString();
        } else if (typeof v === 'object') {
          try {
            out[h] = JSON.stringify(v);
          } catch {
            out[h] = String(v);
          }
        } else {
          out[h] = v;
        }
      });
      return out;
    });

    // import dynamique pour éviter erreur de build si la lib n'est pas installée
    import('xlsx')
      .then(XLSX => {
        try {
          const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const fileName = `tasks_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xlsx`;
          this.downloadBlobFromFile(blob, fileName);
        } catch (err) {
          // fallback: si erreur sheetjs, on force CSV fallback
          // eslint-disable-next-line no-console
          console.warn('Erreur lors de la génération XLSX, fallback CSV', err);
          this.exportTasksToCsv();
        }
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.warn(
          "Impossible d'importer la librairie xlsx. Exécutez `npm install xlsx` pour activer l'export Excel. Fallback CSV.",
          err
        );
        this.exportTasksToCsv();
      });
  }

  exportTasksToCsv(): void {
    if (!this.tasks || this.tasks.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('Aucune tâche à exporter.');
      return;
    }
    const rows = this.tasks;
    const headers = this.guessHeadersFromArray(rows);
    const csvContent = this.buildCsvFromRows(rows, headers);
    const fileName = `tasks_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    this.downloadBlob(csvContent, fileName, 'text/csv;charset=utf-8;');
  }

  // ---------- helpers ----------
  private guessHeadersFromArray(arr: any[]): string[] {
    if (!arr || arr.length === 0) {
      return [];
    }
    // on veut une liste stable d'en-têtes :
    const keys = new Set<string>();
    arr.forEach(item => {
      Object.keys(item || {}).forEach(k => keys.add(k));
    });
    return Array.from(keys);
  }

  private buildCsvFromRows(rows: any[], headers: string[]): string {
    const escapeCell = (v: any) => {
      if (v === null || v === undefined) return '';
      if (v instanceof Date) return v.toISOString();
      const s = typeof v === 'object' ? JSON.stringify(v) : `${v}`;
      if (s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
      if (s.includes(',') || s.includes('\n') || s.includes('\r')) return `"${s}"`;
      return s;
    };

    const lines: string[] = [];
    lines.push(headers.join(','));
    for (const r of rows) {
      const cells = headers.map(h => escapeCell((r as any)[h]));
      lines.push(cells.join(','));
    }
    return lines.join('\r\n');
  }

  private downloadBlob(content: string | Blob, fileName = 'export.csv', mimeType = 'text/csv;charset=utf-8;'): void {
    let blob: Blob;
    if (typeof content === 'string') {
      blob = new Blob([content], { type: mimeType });
    } else {
      blob = content;
    }

    if ((navigator as any).msSaveBlob) {
      (navigator as any).msSaveBlob(blob, fileName);
    } else {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  private downloadBlobFromFile(blob: Blob, fileName: string): void {
    if ((navigator as any).msSaveBlob) {
      (navigator as any).msSaveBlob(blob, fileName);
    } else {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // util pour classes status en CSS
  getStatusClass(raw: any): string {
    const s = String(raw || '')
      .toString()
      .trim()
      .toLowerCase();
    if (s === 'desactivated' || s === 'desactivé' || s === 'desactive' || s === 'disabled') {
      return 'status-desactivated';
    } else if (s === 'actif' || s === 'active') {
      return 'status-actif';
    } else if (s === 'delated' || s === 'deleted' || s === 'supprimé') {
      return 'status-delated';
    }
    return '';
  }

  /**
   * Convertit value (Dayjs | string | Date | number | null | undefined)
   * en Date | null — utilisable en toute sécurité par le date pipe.
   */
  formatToDate(value: any): Date | null {
    if (value == null) {
      return null;
    }
    // dayjs-like
    if (typeof (value as any).toDate === 'function') {
      try {
        return (value as any).toDate();
      } catch {
        return null;
      }
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }
}
