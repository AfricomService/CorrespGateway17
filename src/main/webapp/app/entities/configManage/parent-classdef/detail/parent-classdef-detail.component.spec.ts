import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ParentClassdefDetailComponent } from './parent-classdef-detail.component';

describe('ParentClassdef Management Detail Component', () => {
  let comp: ParentClassdefDetailComponent;
  let fixture: ComponentFixture<ParentClassdefDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ParentClassdefDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { data: of({ parentClassdef: { id: 123 } }) },
        },
      ],
    })
      .overrideTemplate(ParentClassdefDetailComponent, '')
      .compileComponents();
    fixture = TestBed.createComponent(ParentClassdefDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('Should load parentClassdef on init', () => {
      // WHEN
      comp.ngOnInit();

      // THEN
      expect(comp.parentClassdef).toEqual(expect.objectContaining({ id: 123 }));
    });
  });
});
