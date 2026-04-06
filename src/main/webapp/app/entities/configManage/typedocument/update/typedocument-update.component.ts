import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { TypedocumentFormService, TypedocumentFormGroup } from './typedocument-form.service';
import { ITypedocument } from '../typedocument.model';
import { TypedocumentService } from '../service/typedocument.service';
import { UsualStatus } from 'app/entities/enumerations/usual-status.model';
import { CorrespService } from '../../../correspManage/corresp/service/corresp.service';
import { IDepartement } from '../../../orgacare/departement/departement.model';
// import { DepartementTreeFeignDTO } from '../../../correspManage/corresp/update/DepartementTreeFeignDTO';
// import { IOrga } from '../../../correspManage/corresp/orga';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DepartementTreeFeignDTO } from '../../../correspManage/corresp/update/DepartementTreeFeignDTO';
// import { DxTreeViewComponent } from 'devextreme-angular';

@Component({
  selector: 'jhi-typedocument-update',
  templateUrl: './typedocument-update.component.html',
})
export class TypedocumentUpdateComponent implements OnInit {
  isSaving = false;
  // @ViewChild('treeView', { static: false }) treeView!: DxTreeViewComponent;
  // @ViewChild('treeView1', { static: false }) treeView1!: DxTreeViewComponent;
  typedocument: ITypedocument | null = null;
  usualStatusValues = Object.keys(UsualStatus);
  validationErrors: { [key: string]: string } = {};
  // orgaList: IOrga[] = [];
  // selectedOrga!: IOrga;
  // selectedOrga1!: IOrga;
  selectedDepartementNom = '';
  selectedDepartementNom1 = '';
  // Tree state pour Destinataire Par Défaut
  orgaList: any[] = [];
  selectedOrgaCode: string | null = null;
  taskTree: DepartementTreeFeignDTO[] = [];
  taskTreeFiltered: DepartementTreeFeignDTO[] = [];
  loadingTree = false;
  treeSearchQuery = '';
  selectedDeptDD: DepartementTreeFeignDTO | null = null;

  // Tree state pour Destinataire En Copie
  ccTree: DepartementTreeFeignDTO[] = [];
  ccTreeFiltered: DepartementTreeFeignDTO[] = [];
  ccLoadingTree = false;
  ccTreeSearchQuery = '';
  selectedDeptDCC: DepartementTreeFeignDTO | null = null;

  private levelPalette: string[] = ['#1e90ff', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
  expandedNodes: Set<number> = new Set();
  ccExpandedNodes: Set<number> = new Set();
  isEditMode: boolean = false;
  // departements: DepartementTreeFeignDTO[] = [];
  // departementsCC: DepartementTreeFeignDTO[] = [];
  editForm: TypedocumentFormGroup = this.typedocumentFormService.createTypedocumentFormGroup();
  // selectedDepartement: DepartementTreeFeignDTO | null = null;
  // selectedDepartement1: DepartementTreeFeignDTO | null = null;
  constructor(
    protected typedocumentService: TypedocumentService,
    protected typedocumentFormService: TypedocumentFormService,
    protected correspService: CorrespService,
    private modalService: NgbModal,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // this.correspService.queryOrga().subscribe(res => {
    //   this.orgaList = res.body!;

    this.activatedRoute.data.subscribe(({ typedocument }) => {
      this.typedocument = typedocument;

      if (typedocument) {
        this.updateForm(typedocument);
        this.isEditMode = !!typedocument.id;

        // if (typedocument.defautdest) {
        //   this.correspService.getOrgaCodeByDeptCode({ deptCode: typedocument.defautdest }).subscribe(res => {
        //     this.selectedOrga = this.orgaList.find(or => or.orgaCode === res.body)!;
        //
        //     this.onOrgaChange(typedocument.defautdest);
        //   });
        // }
        // if (typedocument.defaultencopie) {
        //   this.correspService.getOrgaCodeByDeptCode({ deptCode: typedocument.defaultencopie }).subscribe(res => {
        //     this.selectedOrga1 = this.orgaList.find(or => or.orgaCode === res.body)!;
        //
        //     this.onOrgaChange1(typedocument.defaultencopie);
        //   });
        // }
      } else {
        this.isEditMode = false;
      }
    });
    // });
  }

  previousState(): void {
    window.history.back();
  }

  openAddTaskModal(content: any, departementCode?: string): void {
    this.selectedDeptDD = null;
    this.treeSearchQuery = '';
    this.expandedNodes.clear();
    this.prepareAndLoadOrgaThenTree();
    this.modalService.open(content, { size: 'xl', centered: true });
  }

  openAddTaskModal1(content: any, departementCode?: string): void {
    this.selectedDeptDCC = null;
    this.ccTreeSearchQuery = '';
    this.ccExpandedNodes.clear();
    this.prepareAndLoadOrgaThenCcTree();
    this.modalService.open(content, { size: 'xl', centered: true });
  }

  // onTreeReady(): void {
  //   if (this.selectedDepartement && this.treeView?.instance) {
  //     this.treeView.instance.selectItem(this.selectedDepartement.id);
  //   }
  // }
  //
  // onTreeReady1(): void {
  //   if (this.selectedDepartement1 && this.treeView1?.instance) {
  //     this.treeView1.instance.selectItem(this.selectedDepartement1.id);
  //   }
  // }

  // ── Tree loading ──────────────────────────────────────────────────────────

  private prepareAndLoadOrgaThenTree(): void {
    if (this.selectedOrgaCode) {
      this.loadTreeForModal(this.selectedOrgaCode);
      return;
    }
    this.correspService.queryOrga().subscribe({
      next: (res: any) => {
        this.orgaList = res.body || [];
        const first = this.orgaList?.[0];
        if (first) {
          this.selectedOrgaCode = first.code ?? first.orgaCode ?? first.id?.toString() ?? null;
        }
        if (this.selectedOrgaCode) {
          this.loadTreeForModal(this.selectedOrgaCode);
        } else {
          this.taskTree = [];
          this.taskTreeFiltered = [];
        }
      },
      error: () => {
        this.taskTree = [];
        this.taskTreeFiltered = [];
      },
    });
  }

  private prepareAndLoadOrgaThenCcTree(): void {
    if (this.selectedOrgaCode) {
      this.loadCcTreeForModal(this.selectedOrgaCode);
      return;
    }
    this.correspService.queryOrga().subscribe({
      next: (res: any) => {
        this.orgaList = res.body || [];
        const first = this.orgaList?.[0];
        if (first) {
          this.selectedOrgaCode = first.code ?? first.orgaCode ?? first.id?.toString() ?? null;
        }
        if (this.selectedOrgaCode) {
          this.loadCcTreeForModal(this.selectedOrgaCode);
        } else {
          this.ccTree = [];
          this.ccTreeFiltered = [];
        }
      },
      error: () => {
        this.ccTree = [];
        this.ccTreeFiltered = [];
      },
    });
  }

  loadTreeForModal(orgaCode: string): void {
    if (!orgaCode) {
      this.taskTree = [];
      this.taskTreeFiltered = [];
      return;
    }
    this.loadingTree = true;
    this.correspService.getDepartementTreeOnlyByOrganigramme(orgaCode).subscribe({
      next: (res: any) => {
        this.taskTree = res.body || [];
        this.taskTreeFiltered = this.taskTree;
        this.loadingTree = false;
      },
      error: () => {
        this.taskTree = [];
        this.taskTreeFiltered = [];
        this.loadingTree = false;
      },
    });
  }

  private loadCcTreeForModal(orgaCode: string): void {
    if (!orgaCode) {
      this.ccTree = [];
      this.ccTreeFiltered = [];
      return;
    }
    this.ccLoadingTree = true;
    this.correspService.getDepartementTreeOnlyByOrganigramme(orgaCode).subscribe({
      next: (res: any) => {
        this.ccTree = res.body || [];
        this.ccTreeFiltered = this.ccTree;
        this.ccLoadingTree = false;
      },
      error: () => {
        this.ccTree = [];
        this.ccTreeFiltered = [];
        this.ccLoadingTree = false;
      },
    });
  }

  onTreeSearchChange(): void {
    const q = (this.treeSearchQuery || '').trim().toLowerCase();
    if (!q) {
      this.taskTreeFiltered = this.taskTree;
      return;
    }
    this.taskTreeFiltered = this.filterTree(this.taskTree, q);
  }

  onCcTreeSearchChange(): void {
    const q = (this.ccTreeSearchQuery || '').trim().toLowerCase();
    if (!q) {
      this.ccTreeFiltered = this.ccTree;
      return;
    }
    this.ccTreeFiltered = this.filterTree(this.ccTree, q);
  }

  private filterTree(nodes: DepartementTreeFeignDTO[], q: string): DepartementTreeFeignDTO[] {
    const result: DepartementTreeFeignDTO[] = [];
    for (const n of nodes) {
      const match = (n.nom || '').toLowerCase().includes(q);
      const children = this.filterTree(n.children || [], q);
      if (match || children.length > 0) {
        result.push({ ...n, children });
      }
    }
    return result;
  }

  toggleNodeExpand(nodeId: number): void {
    this.expandedNodes.has(nodeId) ? this.expandedNodes.delete(nodeId) : this.expandedNodes.add(nodeId);
  }

  isNodeExpanded(nodeId: number): boolean {
    return this.expandedNodes.has(nodeId);
  }

  toggleCcNodeExpand(nodeId: number): void {
    this.ccExpandedNodes.has(nodeId) ? this.ccExpandedNodes.delete(nodeId) : this.ccExpandedNodes.add(nodeId);
  }

  isCcNodeExpanded(nodeId: number): boolean {
    return this.ccExpandedNodes.has(nodeId);
  }

  getLevelColor(level: number): string {
    return this.levelPalette[level % this.levelPalette.length];
  }

  selectDeptDD(node: DepartementTreeFeignDTO, modal: any): void {
    this.selectedDeptDD = node;
    this.editForm.get('labelDD')?.setValue(node.nom ?? '');
    this.editForm.get('defautdest')?.setValue(node.code ?? '');
    this.selectedDepartementNom = node.nom ?? '';
    modal.close();
  }

  selectDeptDCC(node: DepartementTreeFeignDTO, modal: any): void {
    this.selectedDeptDCC = node;
    this.editForm.get('labelDCC')?.setValue(node.nom ?? '');
    this.editForm.get('defaultencopie')?.setValue(node.code ?? '');
    this.selectedDepartementNom1 = node.nom ?? '';
    modal.close();
  }

  save(): void {
    this.isSaving = true;
    this.modalService.dismissAll();
    const typedocument = this.typedocumentFormService.getTypedocument(this.editForm);
    if (typedocument.id !== null) {
      this.subscribeToSaveResponse(this.typedocumentService.update(typedocument));
    } else {
      this.subscribeToSaveResponse(this.typedocumentService.create(typedocument));
    }
  }

  dismissAll(): void {
    this.modalService.dismissAll();
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ITypedocument>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  // ------------------------------------------------------------------------------------------
  // ------------------------------------------------------------------------------------------
  // ------------------------------------------------------------------------------------------
  // ------------------------------------------------------------------------------------------

  // onOrgaChange(defaultDeptCode?: string): void {
  //   if (!this.selectedOrga) return;
  //
  //   const req = { orgaCode: this.selectedOrga.orgaCode };
  //   this.correspService.queryOrgaDeps(req).subscribe({
  //     next: res => {
  //       this.departements = res.body ?? [];
  //
  //       this.expandAllDepartments(this.departements);
  //
  //       if (defaultDeptCode) {
  //         this.selectDepartmentByCodeInTree(defaultDeptCode, this.departements);
  //
  //         const dep = this.findDepartmentByCode(this.departements, defaultDeptCode);
  //         if (dep) {
  //           this.selectedDepartement = dep;
  //           this.editForm.get('defautdest')?.setValue(dep.code);
  //           this.selectedDepartementNom = dep.nom;
  //
  //           // Sélection dans le TreeView
  //           setTimeout(() => this.treeView?.instance.selectItem(dep.id));
  //         }
  //       }
  //     },
  //     error: err => console.error('Erreur lors du chargement des départements', err),
  //   });
  // }
  //
  // onOrgaChange1(defaultDeptCode?: string): void {
  //   if (!this.selectedOrga1) return;
  //
  //   const req = { orgaCode: this.selectedOrga1.orgaCode };
  //   this.correspService.queryOrgaDeps(req).subscribe({
  //     next: res => {
  //       // this.departements = res.body ?? [];
  //       // this.expandAllDepartments(this.departements);
  //
  //       //TODO : ARRAY DEPARTEMENTS CC
  //       this.departementsCC = res.body ?? [];
  //       this.expandAllDepartments(this.departementsCC);
  //
  //       if (defaultDeptCode) {
  //         this.selectDepartmentByCodeInTree(defaultDeptCode, this.departementsCC);
  //
  //         const dep = this.findDepartmentByCode(this.departementsCC, defaultDeptCode);
  //         if (dep) {
  //           this.selectedDepartement1 = dep;
  //           this.editForm.get('defaultencopie')?.setValue(dep.code);
  //           this.selectedDepartementNom1 = dep.nom;
  //
  //           setTimeout(() => this.treeView1?.instance.selectItem(dep.id));
  //         }
  //       }
  //     },
  //     error: err => console.error('Erreur lors du chargement des départements', err),
  //   });
  // }
  //
  // // private findDepartmentByCode(nodes: DepartementTreeFeignDTO[], code: string): DepartementTreeFeignDTO | null {
  // //   for (const node of nodes) {
  // //     if (node.code === code) return node;
  // //     if (node.children && node.children.length > 0) {
  // //       const child = this.findDepartmentByCode(node.children, code);
  // //       if (child) return child;
  // //     }
  // //   }
  // //   return null;
  // // }
  //
  // private findDepartmentByCode(nodes: DepartementTreeFeignDTO[], code: string): DepartementTreeFeignDTO | null {
  //   for (const node of nodes) {
  //     if (node.code === code) {
  //       node.selected = true;
  //       return node;
  //     }
  //     if (node.children && node.children.length > 0) {
  //       const child = this.findDepartmentByCode(node.children, code);
  //       if (child) return child;
  //     }
  //   }
  //   return null;
  // }
  //
  // private selectDepartmentByCodeInTree(code: string, tree: DepartementTreeFeignDTO[]): boolean {
  //   const loop = (nodes: DepartementTreeFeignDTO[]): boolean => {
  //     for (const node of nodes) {
  //       if (node.code === code) {
  //         node.selected = true; // mark directly in the array
  //         return true; // stop recursion
  //       }
  //       if (node.children?.length) {
  //         if (loop(node.children)) return true;
  //       }
  //     }
  //     return false;
  //   };
  //
  //   return loop(tree);
  // }
  //
  // // private selectDepartmentByCode(code: string): boolean {
  // //   const loop = (nodes: DepartementTreeFeignDTO[]): boolean => {
  // //     for (const node of nodes) {
  // //       if (node.code === code) {
  // //         node.selected = true; // mark directly in the array
  // //         return true; // stop recursion
  // //       }
  // //       if (node.children && node.children.length > 0) {
  // //         if (loop(node.children)) return true;
  // //       }
  // //     }
  // //     return false;
  // //   };
  // //
  // //   return loop(this.departements);
  // // }
  // //
  // // private selectDepartmentByCodeCC(code: string): boolean {
  // //   const loop = (nodes: DepartementTreeFeignDTO[]): boolean => {
  // //     for (const node of nodes) {
  // //       if (node.code === code) {
  // //         node.selected = true; // mark directly in the array
  // //         return true; // stop recursion
  // //       }
  // //       if (node.children && node.children.length > 0) {
  // //         if (loop(node.children)) return true;
  // //       }
  // //     }
  // //     return false;
  // //   };
  // //
  // //   return loop(this.departementsCC);
  // // }
  //
  // private expandAllDepartments(nodes: DepartementTreeFeignDTO[]): void {
  //   nodes.forEach(node => {
  //     (node as any).expanded = true; // DevExtreme reconnaît 'expanded'
  //     if (node.children && node.children.length > 0) {
  //       this.expandAllDepartments(node.children);
  //     }
  //   });
  // }
  //
  // selectDepDest(e: any, modal: any): void {
  //   this.selectedDepartement = e.itemData;
  //   this.selectedDepartementNom = e.itemData.nom;
  //   this.editForm.get('defautdest')?.setValue(e.itemData.code);
  //   this.editForm.get('labelDD')?.setValue(e.itemData.nom);
  //
  //   // modal.close();
  // }
  //
  // selectDepCopie(e: any, modalRef: any): void {
  //   this.selectedDepartement1 = e.itemData;
  //   this.selectedDepartementNom1 = e.itemData.nom;
  //   this.editForm.get('defaultencopie')?.setValue(e.itemData.code);
  //   this.editForm.get('labelDCC')?.setValue(e.itemData.nom);
  //   // modalRef.close();
  // }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(typedocument: ITypedocument): void {
    this.typedocument = typedocument;
    this.typedocumentFormService.resetForm(this.editForm, typedocument);
  }
}
