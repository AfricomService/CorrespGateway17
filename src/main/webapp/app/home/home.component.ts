// src/main/webapp/app/home/home.component.ts
// Modernized HomeComponent — tâches & dossiers (styles moved to home.component.scss)
// Ajout : enregistrement programmatique des traductions locales (FR/EN) pour éviter les "translation-not-found".

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ITasks } from '../entities/correspManage/tasks/tasks.model';
import { IDossier } from '../entities/correspManage/dossier/dossier.model';
import { DxDataGridComponent } from 'devextreme-angular';
import { HttpResponse } from '@angular/common/http';
import { DossierService } from '../entities/correspManage/dossier/service/dossier.service';
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
  dossiers?: IDossier[];
  authSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  selection = {
    deferred: false,
    mode: 'single',
  };

  searchPanel = {
    visible: true,
  };

  loadPanel = {
    enabled: true,
  };

  filterRow = {
    visible: true,
    showOperationChooser: false,
  };

  // NOTE: export natif désactivé pour supprimer les boutons intégrés de la grille
  export = {
    enabled: false,
  };

  sorting = {
    mode: 'none',
  };

  // ViewChilds pour chaque grille (références template #tasksGrid et #dossiersGrid)
  @ViewChild('tasksGrid', { static: false }) tasksGrid?: DxDataGridComponent;
  @ViewChild('dossiersGrid', { static: false }) dossiersGrid?: DxDataGridComponent;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private tasksService: TasksService,
    private dossierService: DossierService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // --- Merge local translations to prevent translation-not-found ---
    // We merge so we don't overwrite any already loaded translations.
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
        panelsTitle: 'Tâches et dossiers',
        tasksTitle: 'Tâches en cours',
        dossiersTitle: 'Dossiers',
        searchTasksLabel: 'Rechercher tâches',
        searchTasks: 'Rechercher une tâche',
        searchDossiersLabel: 'Rechercher dossiers',
        searchDossiers: 'Rechercher un dossier',
        search: 'Rechercher',
        clearSearch: 'Effacer la recherche',
        exportExcel: 'Excel',
        exportCsv: 'CSV',
        objet: 'Objet',
        creation: 'Création',
        debut: 'Début',
        limite: 'Limite',
        cloture: 'Clôture',
        responsable: 'Responsable',
        etat: 'État',
        nom: 'Nom',
        publique: 'Publique',
      },
    };

    const en = {
      home: {
        title: 'Welcome, {{firstName}}',
        subtitle: 'Manage your mail and tasks with ease',
        newMail: '✨ New Mail',
        arrival: 'INCOMING',
        arrivalSub: 'Register an incoming mail',
        outgoing: 'OUTGOING',
        outgoingSub: 'Create an outgoing mail',
        internal: 'INTERNAL',
        internalSub: 'Internal communication',
        panelsTitle: 'Tasks & folders',
        tasksTitle: 'Active Tasks',
        dossiersTitle: 'Folders',
        searchTasksLabel: 'Search tasks',
        searchTasks: 'Search a task',
        searchDossiersLabel: 'Search folders',
        searchDossiers: 'Search a folder',
        search: 'Search',
        clearSearch: 'Clear search',
        exportExcel: 'Excel',
        exportCsv: 'CSV',
        objet: 'Object',
        creation: 'Creation',
        debut: 'Start',
        limite: 'Deadline',
        cloture: 'Close',
        responsable: 'Responsible',
        etat: 'Status',
        nom: 'Name',
        publique: 'Public',
      },
    };

    // Merge translations (true => merge)
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

    this.tasksService
      .getAllTasksByEtat({ etat: 'IN_PROGRESS' })
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: HttpResponse<ITasks[]>) => (this.tasks = res.body || []));

    this.dossierService
      .query()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: HttpResponse<IDossier[]>) => (this.dossiers = res.body || []));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // ----------------------
  // Getters utilitaires
  // ----------------------
  // compteurs dynamiques affichés dans l'UI
  get tasksCount(): number {
    return this.tasks ? this.tasks.length : 0;
  }

  get dossiersCount(): number {
    return this.dossiers ? this.dossiers.length : 0;
  }

  // refresh : rafraîchit les deux grilles si présentes
  refresh(): any {
    try {
      this.tasksGrid?.instance?.refresh();
      this.dossiersGrid?.instance?.refresh();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('refresh() : impossible de rafraîchir les instances des grilles', err);
    }
  }

  onRowDblClick(e: any): void {
    console.log(e); // eslint-disable-line no-console
    if (e && e.data && e.data.id != null) {
      this.router.navigate([`/tasks/${e.data.id}/view`]);
    }
  }

  onRowDblClickDossier(e: any): void {
    console.log(e); // eslint-disable-line no-console
    if (e && e.data && e.data.id != null) {
      this.router.navigate([`/dossier/${e.data.id}/view`]);
    }
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  /**
   * onRowPrepared : applique/retire des classes de statut plutôt que d'injecter du style inline.
   * Les classes (status-actif, status-desactivated, status-delated) sont stylées dans le SCSS.
   */
  onRowPrepared(e: any): void {
    if (!e || e.rowType !== 'data' || !e.rowElement) {
      return;
    }

    // retire classes de statut et ticket pré-existantes
    e.rowElement.classList.remove('ticket', 'status-actif', 'status-desactivated', 'status-delated');

    // ajoute la classe ticket pour appliquer le style ticket
    e.rowElement.classList.add('ticket');

    // récupérer l'état depuis différents champs possibles
    const rawEtat = (e.data && (e.data.etat || e.data.status)) || '';
    const etat = String(rawEtat).trim().toLowerCase();

    if (etat === 'desactivated' || etat === 'desactivé' || etat === 'desactive') {
      e.rowElement.classList.add('status-desactivated');
      e.rowElement.classList.remove('dx-row-alt');
    } else if (etat === 'actif' || etat === 'active') {
      e.rowElement.classList.add('status-actif');
      e.rowElement.classList.remove('dx-row-alt');
    } else if (etat === 'delated' || etat === 'deleted' || etat === 'supprimé') {
      e.rowElement.classList.add('status-delated');
      e.rowElement.classList.remove('dx-row-alt');
    }
  }

  onTypeClicked(type: string): void {
    this.router.navigate(['/corresp/new'], { queryParams: { type } });
  }

  // ----------------------
  // Recherche (sécurisées côté TS)
  // ----------------------
  onTasksSearchInput(value: string): void {
    try {
      this.tasksGrid?.instance.searchByText(value || '');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('searchByText non disponible sur tasksGrid.instance', err);
    }
  }
  onTasksSearchClick(value: string): void {
    try {
      this.tasksGrid?.instance.searchByText(value || '');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('searchByText non disponible sur tasksGrid.instance', err);
    }
  }
  clearTasksSearch(input: HTMLInputElement): void {
    if (input) {
      input.value = '';
    }
    try {
      this.tasksGrid?.instance.searchByText('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('searchByText non disponible sur tasksGrid.instance', err);
    }
  }

  onDossiersSearchInput(value: string): void {
    try {
      this.dossiersGrid?.instance.searchByText(value || '');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('searchByText non disponible sur dossiersGrid.instance', err);
    }
  }
  onDossiersSearchClick(value: string): void {
    try {
      this.dossiersGrid?.instance.searchByText(value || '');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('searchByText non disponible sur dossiersGrid.instance', err);
    }
  }
  clearDossiersSearch(input: HTMLInputElement): void {
    if (input) {
      input.value = '';
    }
    try {
      this.dossiersGrid?.instance.searchByText('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('searchByText non disponible sur dossiersGrid.instance', err);
    }
  }

  /* ============================
     Export helpers (custom)
     ============================ */

  exportTasksToExcel(): void {
    const inst: any = this.tasksGrid?.instance;
    try {
      if (inst && typeof inst.exportToExcel === 'function') {
        inst.exportToExcel();
        return;
      }
      this.exportTasksToCsv();
      console.warn('exportToExcel() non disponible. Fallback CSV exécuté.');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Erreur lors de l'export des tâches vers Excel :", err);
    }
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
    this.downloadBlob(csvContent, 'tasks_export', 'text/csv;charset=utf-8;');
  }

  exportDossiersToExcel(): void {
    const inst: any = this.dossiersGrid?.instance;
    try {
      if (inst && typeof inst.exportToExcel === 'function') {
        inst.exportToExcel();
        return;
      }
      this.exportDossiersToCsv();
      console.warn('exportToExcel() non disponible sur dossiersGrid.instance. Fallback CSV exécuté.');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erreur exportDossiersToExcel :', err);
    }
  }

  exportDossiersToCsv(): void {
    if (!this.dossiers || this.dossiers.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('Aucun dossier à exporter.');
      return;
    }
    const rows = this.dossiers;
    const headers = this.guessHeadersFromArray(rows);
    const csvContent = this.buildCsvFromRows(rows, headers);
    this.downloadBlob(csvContent, 'dossiers_export', 'text/csv;charset=utf-8;');
  }

  // ---------- helpers ----------
  private guessHeadersFromArray(arr: any[]): string[] {
    if (!arr || arr.length === 0) {
      return [];
    }
    return Object.keys(arr[0]);
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

  private downloadBlob(content: string, baseName = 'export', mimeType = 'text/csv;charset=utf-8;'): void {
    const blob = new Blob([content], { type: mimeType });
    const fileName = `${baseName}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
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
}
