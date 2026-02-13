// src/main/webapp/app/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Title } from '@angular/platform-browser';

import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { ITasks } from '../entities/correspManage/tasks/tasks.model';
import { HttpResponse } from '@angular/common/http';
import { TasksService } from '../entities/correspManage/tasks/service/tasks.service';
import { CorrespService } from '../entities/correspManage/corresp/service/corresp.service';
import { IDepartement } from '../entities/orgacare/departement/departement.model';

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
  private correspInfoByTaskId: Record<number, { subject?: string | null; reference?: string | null }> = {};
  private deptNameByCode: Map<string, string> = new Map<string, string>();

  // map taskId -> liste de noms (deptName ou personneName ou matricule/code)
  private taskResponsablesMap: Record<number, string[]> = {};

  // recherche simple côté client
  searchTerm = '';

  // pagination
  pageSize = 4; // <-- nombre d'éléments par page
  currentPage = 1;

  // petits réglages visuels/restants
  loadPanel = { enabled: true };
  sorting = { mode: 'none' };

  constructor(
    private accountService: AccountService,
    private router: Router,
    private tasksService: TasksService,
    private correspService: CorrespService,
    private translate: TranslateService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    // On attend l'authenticationState puis on charge les tâches avec l'id utilisateur
    this.authSubscription = this.accountService
      .getAuthenticationState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(account => {
        this.account = account;

        const name = account && account.firstName ? account.firstName : '';
        this.translate.get('home.title', { firstName: name }).subscribe(translatedTitle => {
          if (translatedTitle) {
            this.titleService.setTitle(translatedTitle);
          }
        });

        // <-- important : on charge les tâches une fois que l'account est connu
        this.loadTasks();
      });

    // NOTE: on ne lance plus loadTasks() ici (on l'appelle après que account soit défini)
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.authSubscription) {
      try {
        this.authSubscription.unsubscribe();
      } catch {
        // noop
      }
    }
  }

  // --------- Data ----------
  loadTasks(): void {
    // Récupère l'id de l'utilisateur connecté (adapter si le modèle Account a un autre nom de propriété)
    const userId = this.account && (this.account as any).id != null ? (this.account as any).id : null;

    if (userId != null) {
      // Utilise l'API getTasksByUserAcl(userId)
      this.tasksService
        .getTasksByUserAcl(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: HttpResponse<ITasks[]>) => {
          this.processTasksResponse(res);
        });
    } else {
      // Fallback : si on n'a pas d'account.id, on garde l'ancien comportement (optionnel)
      this.tasksService
        .getAllTasksByEtat({ etat: 'IN_PROGRESS' })
        .pipe(takeUntil(this.destroy$))
        .subscribe((res: HttpResponse<ITasks[]>) => {
          this.processTasksResponse(res);
        });
    }
  }

  private processTasksResponse(res: HttpResponse<ITasks[]>): void {
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
          (copy as any)[f] = undefined;
        }
      });
      return copy as ITasks;
    });

    // charge infos supplémentaires (corresp) et résout les noms de départements/personnes
    this.loadCorrespInfoForTasks();
    // resolveDeptNamesForTasks s'occupera aussi d'appeler buildResponsablesForTasks
    this.resolveDeptNamesForTasks();

    // ensure currentPage still valid after load
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  refresh(): void {
    this.loadTasks();
  }

  get tasksCount(): number {
    return this.tasks ? this.tasks.length : 0;
  }

  // --- Filtering (ancien displayedTasks) : retourne la liste complète filtrée (non paginée)
  get displayedTasks(): ITasks[] {
    if (!this.tasks) {
      return [];
    }
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) {
      return this.tasks;
    }
    return this.tasks.filter(t => {
      const subj = (this.getTaskSubject(t) || '').toString().toLowerCase();
      const ref = (this.getTaskReference(t) || '').toString().toLowerCase();
      const resp = (this.getResponsibleDisplay(t) || '').toString().toLowerCase();
      const status = String((t as any).status || '').toLowerCase();
      return subj.includes(q) || ref.includes(q) || resp.includes(q) || status.includes(q);
    });
  }

  // --- Pagination helpers
  get totalTasks(): number {
    return this.displayedTasks.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalTasks / this.pageSize));
  }

  get paginatedTasks(): ITasks[] {
    const all = this.displayedTasks || [];
    const start = (this.currentPage - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get startItem(): number {
    if (this.totalTasks === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalTasks);
  }

  setPage(page: number): void {
    if (!page || page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    this.currentPage = page;
  }

  nextPage(): void {
    this.setPage(this.currentPage + 1);
  }
  prevPage(): void {
    this.setPage(this.currentPage - 1);
  }

  // --------- Navigation / interactions ----------
  onTypeClicked(type: string): void {
    this.router.navigate(['/corresp/new'], { queryParams: { type } });
  }

  openTask(task: ITasks): void {
    if (!task || (task as any).id == null) return;
    const taskId = (task as any).id;
    this.correspService
      .getCorrespsByTask(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: HttpResponse<any[]>) => {
        const items = res.body || [];
        const first = items && items.length ? items[0] : null;
        const correspId = first && (first as any).id;
        if (correspId != null) {
          this.router.navigate([`/corresp/${correspId}/view`]);
        } else {
          this.router.navigate([`/tasks/${taskId}/view`]);
        }
      });
  }

  // handlers recherche — reset page à 1 lors d'une recherche
  onTasksSearchInput(value: string): void {
    this.searchTerm = value || '';
    this.currentPage = 1;
  }
  onTasksSearchClick(value: string): void {
    this.searchTerm = value || '';
    this.currentPage = 1;
  }
  clearTasksSearch(input: HTMLInputElement): void {
    if (input) {
      input.value = '';
    }
    this.searchTerm = '';
    this.currentPage = 1;
  }

  // --------- Export helpers ----------
  exportTasksToExcel(): void {
    if (!this.tasks || this.tasks.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('Aucune tâche à exporter.');
      return;
    }

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
          // fallback: CSV
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

  formatToDate(value: any): Date | null {
    if (value == null) {
      return null;
    }
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

  private loadCorrespInfoForTasks(): void {
    const tasks = this.tasks || [];
    if (!tasks.length) {
      return;
    }
    const calls = tasks
      .map(t => (t && (t as any).id != null ? (t as any).id : null))
      .filter((id): id is number => id != null)
      .map(id => this.correspService.getCorrespsByTask(id));

    if (!calls.length) {
      return;
    }
    forkJoin(calls)
      .pipe(takeUntil(this.destroy$))
      .subscribe((responses: HttpResponse<any[]>[]) => {
        responses.forEach((res, idx) => {
          const task = tasks[idx];
          const taskId = (task as any)?.id;
          const items = res?.body || [];
          const first = items && items.length ? items[0] : null;
          const subject = first ? (first as any).subject ?? null : null;
          const reference = first ? (first as any).reference ?? null : null;
          if (typeof taskId === 'number') {
            this.correspInfoByTaskId[taskId] = { subject, reference };
          }
        });
      });
  }

  getTaskSubject(t: ITasks): string {
    const id = (t as any)?.id;
    const info = typeof id === 'number' ? this.correspInfoByTaskId[id] : undefined;
    return (info && info.subject) || '';
  }

  getTaskReference(t: ITasks): string {
    const id = (t as any)?.id;
    const info = typeof id === 'number' ? this.correspInfoByTaskId[id] : undefined;
    return (info && info.reference) || '';
  }

  getResponsibleDisplay(t: ITasks): string {
    const id = (t as any)?.id;
    if (typeof id === 'number') {
      const arr = this.taskResponsablesMap[id];
      if (arr && arr.length) {
        return arr.join(', ');
      }
    }

    // fallback (ancien comportement)
    const code = ((t as any).responsible || '').toString();
    if (!code) return '';
    return this.deptNameByCode.get(code) || code;
  }

  private resolveDeptNamesForTasks(): void {
    const tasks = this.tasks || [];

    // 1) collecter tous les codes de departements à résoudre (depuis responsible OU responsables[].codeDept)
    const codesFromResponsible = tasks.map(t => ((t as any).responsible || '').toString()).filter(c => !!c);

    const codesFromResponsables = ([] as string[]).concat(
      ...tasks.map(t => {
        const rs = (t as any).responsables;
        if (!rs || !Array.isArray(rs)) return [];
        return rs.map((r: any) => (r && r.codeDept ? (r.codeDept || '').toString() : '')).filter((c: string) => !!c);
      })
    );

    const codes = Array.from(new Set([...codesFromResponsible, ...codesFromResponsables])).filter(c => !!c);

    // 2) garder seulement les codes manquants dans le cache deptNameByCode
    const missing = codes.filter(c => !this.deptNameByCode.has(c));
    if (!missing.length) {
      // pas d'appel réseau nécessaire — on peut construire directement les listes de responsables
      this.buildResponsablesForTasks();
      return;
    }

    // créer les appels HTTP (forkJoin)
    const calls = missing.map(code => this.correspService.queryOrgaDepsByCode({ code }));
    forkJoin(calls)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses: HttpResponse<IDepartement>[]) => {
          responses.forEach((res, idx) => {
            const dep = res.body as unknown as IDepartement | undefined;
            const code = missing[idx];
            const name =
              (dep && ((dep as any).nom || (dep as any).name || (dep as any).libelle || (dep as any).description || (dep as any).code)) ||
              code;
            this.deptNameByCode.set(code, name || code);
          });
        },
        error: err => {
          // si erreur réseau, on log et on continue — on affichera les codes/matricules bruts
          // eslint-disable-next-line no-console
          console.warn('Erreur lors de la résolution des noms de départements', err);
        },
        complete: () => {
          // une fois les resolvings faits (ou non), construire les responsables affichables
          this.buildResponsablesForTasks();
        },
      });
  }

  private buildResponsablesForTasks(): void {
    this.taskResponsablesMap = {};
    const tasks = this.tasks || [];

    tasks.forEach(task => {
      const taskId = (task as any)?.id;
      if (typeof taskId !== 'number') return;

      const displays: string[] = [];

      const responsables = (task as any).responsables;
      if (Array.isArray(responsables) && responsables.length > 0) {
        // priorité : personneName -> deptName -> resolved codeDept name -> matricule -> raw code
        responsables.forEach((r: any) => {
          if (!r) return;
          const pName = r.personneName;
          const dName = r.deptName;
          const codeDept = r.codeDept;
          const matricule = r.matriculePers;

          if (pName && pName.toString().trim()) {
            displays.push(pName.toString().trim());
          } else if (dName && dName.toString().trim()) {
            displays.push(dName.toString().trim());
          } else if (codeDept && codeDept.toString().trim()) {
            const code = codeDept.toString().trim();
            const resolved = this.deptNameByCode.get(code);
            displays.push((resolved && resolved.toString()) || code);
          } else if (matricule && matricule.toString().trim()) {
            displays.push(matricule.toString().trim());
          }
        });
      } else {
        // fallback: utilser le champ 'responsible' (ancien comportement)
        const code = ((task as any).responsible || '').toString();
        if (code) {
          const name = this.deptNameByCode.get(code);
          displays.push((name && name.toString()) || code);
        }
      }

      // dédoublonner tout en gardant l'ordre
      const uniq = Array.from(new Set(displays.map(d => (d == null ? '' : d.toString()).trim()))).filter(s => !!s);
      this.taskResponsablesMap[taskId] = uniq;
    });
  }
}
