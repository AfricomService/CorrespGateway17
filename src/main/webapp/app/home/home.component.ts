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

@Component({
  selector: 'jhi-home',
  templateUrl: './home.component.html',
  styleUrls: ['home.component.scss'],
})
export class HomeComponent implements OnInit {
  account: Account | null = null;
  tasks?: ITasks[];
  dossiers?: IDossier[];
  authSubscription?: Subscription;
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

  export = {
    enabled: true,
  };

  sorting = {
    mode: 'none',
  };

  @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private tasksService: TasksService,
    private dossierService: DossierService
  ) {}

  ngOnInit(): void {
    this.authSubscription = this.accountService.getAuthenticationState().subscribe(account => (this.account = account));
    this.tasksService.getAllTasksByEtat({ etat: 'IN_PROGRESS' }).subscribe((res: HttpResponse<ITasks[]>) => (this.tasks = res.body || []));
    this.dossierService.query().subscribe((res: HttpResponse<IDossier[]>) => (this.dossiers = res.body || []));
  }

  refresh(): any {
    this.dataGrid.instance.refresh();
  }
  onRowDblClick(e: any): void {
    // console.log("ROW DOUBLE CLICKED -----------------------------"); // eslint-disable-line no-console
    console.log(e); // eslint-disable-line no-console
    console.log('TWO'); // eslint-disable-line no-console
    this.router.navigate([`/tasks/${e.data.id}/view`]);
  }
  onRowDblClickDossier(e: any): void {
    // console.log("ROW DOUBLE CLICKED -----------------------------"); // eslint-disable-line no-console
    console.log(e); // eslint-disable-line no-console
    console.log('TWO'); // eslint-disable-line no-console
    this.router.navigate([`/dossier/${e.data.id}/view`]);
  }
  login(): void {
    this.router.navigate(['/login']);
  }

  onRowPrepared(e: any): void {
    if (e.rowType === 'data') {
      if (e.data.etat === 'Desactivated') {
        e.rowElement.style.backgroundColor = 'rgba(255, 143, 163, 1)';
        e.rowElement.className = e.rowElement.className.replace('dx-row-alt', '');
      } else if (e.data.etat === 'Actif') {
        e.rowElement.style.backgroundColor = 'rgba(167, 201, 87, 1)';
        e.rowElement.className = e.rowElement.className.replace('dx-row-alt', '');
      } else if (e.data.etat === 'Delated') {
        e.rowElement.style.backgroundColor = 'rgba(242, 232, 207, 1)';
        e.rowElement.className = e.rowElement.className.replace('dx-row-alt', '');
      }
    }
  }
  onTypeClicked(type: string): void {
    this.router.navigate(['/corresp/new'], { queryParams: { type } });
  }
}
