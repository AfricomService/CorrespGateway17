import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IConnecteur } from '../connecteur.model';

@Component({
  selector: 'jhi-connecteur-detail',
  templateUrl: './connecteur-detail.component.html',
})
export class ConnecteurDetailComponent implements OnInit {
  connecteur: IConnecteur | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ connecteur }) => {
      this.connecteur = connecteur;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
