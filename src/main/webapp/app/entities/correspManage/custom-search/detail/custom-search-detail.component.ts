import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ICustomSearch } from '../custom-search.model';

@Component({
  selector: 'jhi-custom-search-detail',
  templateUrl: './custom-search-detail.component.html',
})
export class CustomSearchDetailComponent implements OnInit {
  customSearch: ICustomSearch | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ customSearch }) => {
      this.customSearch = customSearch;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
