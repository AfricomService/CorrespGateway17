import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: 'rules',
        data: { pageTitle: 'correspCareApp.rules.home.title' },
        loadChildren: () => import('./rules/rules.module').then(m => m.RulesModule),
      },
      {
        path: 'hist-consult',
        data: { pageTitle: 'correspCareApp.journauxHistConsult.home.title' },
        loadChildren: () => import('./journaux/hist-consult/hist-consult.module').then(m => m.JournauxHistConsultModule),
      },
      {
        path: 'message',
        data: { pageTitle: 'correspCareApp.kafkaServiceMessage.home.title' },
        loadChildren: () => import('./kafkaService/message/message.module').then(m => m.KafkaServiceMessageModule),
      },
      {
        path: 'corresp',
        data: { pageTitle: 'correspCareApp.correspManageCorresp.home.title' },
        loadChildren: () => import('./correspManage/corresp/corresp.module').then(m => m.CorrespManageCorrespModule),
      },
      {
        path: 'note',
        data: { pageTitle: 'correspCareApp.correspManageNote.home.title' },
        loadChildren: () => import('./correspManage/note/note.module').then(m => m.CorrespManageNoteModule),
      },
      {
        path: 'pj',
        data: { pageTitle: 'correspCareApp.correspManagePj.home.title' },
        loadChildren: () => import('./correspManage/pj/pj.module').then(m => m.CorrespManagePjModule),
      },
      {
        path: 'tasks',
        data: { pageTitle: 'correspCareApp.correspManageTasks.home.title' },
        loadChildren: () => import('./correspManage/tasks/tasks.module').then(m => m.CorrespManageTasksModule),
      },
      {
        path: 'bordereaux',
        data: { pageTitle: 'correspCareApp.correspManageBordereaux.home.title' },
        loadChildren: () => import('./correspManage/bordereaux/bordereaux.module').then(m => m.CorrespManageBordereauxModule),
      },
      {
        path: 'dossier',
        data: { pageTitle: 'correspCareApp.correspManageDossier.home.title' },
        loadChildren: () => import('./correspManage/dossier/dossier.module').then(m => m.CorrespManageDossierModule),
      },
      {
        path: 'hist-action',
        data: { pageTitle: 'correspCareApp.journauxHistAction.home.title' },
        loadChildren: () => import('./journaux/hist-action/hist-action.module').then(m => m.JournauxHistActionModule),
      },
      {
        path: 'contact-company',
        data: { pageTitle: 'correspCareApp.configManageContactCompany.home.title' },
        loadChildren: () => import('./configManage/contact-company/contact-company.module').then(m => m.ConfigManageContactCompanyModule),
      },
      {
        path: 'person-company',
        data: { pageTitle: 'correspCareApp.configManagePersonCompany.home.title' },
        loadChildren: () => import('./configManage/person-company/person-company.module').then(m => m.ConfigManagePersonCompanyModule),
      },
      {
        path: 'company',
        data: { pageTitle: 'correspCareApp.orgacareCompany.home.title' },
        loadChildren: () => import('./orgacare/company/company.module').then(m => m.OrgacareCompanyModule),
      },
      {
        path: 'orga-entity',
        data: { pageTitle: 'correspCareApp.orgacareOrgaEntity.home.title' },
        loadChildren: () => import('./orgacare/orga-entity/orga-entity.module').then(m => m.OrgacareOrgaEntityModule),
      },
      {
        path: 'employe',
        data: { pageTitle: 'correspCareApp.employe.home.title' },
        loadChildren: () => import('./employe/employe.module').then(m => m.EmployeModule),
      },
      {
        path: 'departement',
        data: { pageTitle: 'correspCareApp.orgacareDepartement.home.title' },
        loadChildren: () => import('./orgacare/departement/departement.module').then(m => m.OrgacareDepartementModule),
      },
      {
        path: 'parent-classdef',
        data: { pageTitle: 'correspCareApp.configManageParentClassdef.home.title' },
        loadChildren: () => import('./configManage/parent-classdef/parent-classdef.module').then(m => m.ConfigManageParentClassdefModule),
      },
      {
        path: 'typedocument',
        data: { pageTitle: 'correspCareApp.configManageTypedocument.home.title' },
        loadChildren: () => import('./configManage/typedocument/typedocument.module').then(m => m.ConfigManageTypedocumentModule),
      },
      {
        path: 'model-notif',
        data: { pageTitle: 'correspCareApp.configManageModelNotif.home.title' },
        loadChildren: () => import('./configManage/model-notif/model-notif.module').then(m => m.ConfigManageModelNotifModule),
      },
      {
        path: 'notif',
        data: { pageTitle: 'correspCareApp.connectionManageNotif.home.title' },
        loadChildren: () => import('./connectionManage/notif/notif.module').then(m => m.ConnectionManageNotifModule),
      },
      {
        path: 'numsequentielle',
        data: { pageTitle: 'correspCareApp.configManageNumsequentielle.home.title' },
        loadChildren: () => import('./configManage/numsequentielle/numsequentielle.module').then(m => m.ConfigManageNumsequentielleModule),
      },
      {
        path: 'connecteur',
        data: { pageTitle: 'correspCareApp.connectionManageConnecteur.home.title' },
        loadChildren: () => import('./connectionManage/connecteur/connecteur.module').then(m => m.ConnectionManageConnecteurModule),
      },
      {
        path: 'configexport',
        data: { pageTitle: 'correspCareApp.configManageConfigexport.home.title' },
        loadChildren: () => import('./configManage/configexport/configexport.module').then(m => m.ConfigManageConfigexportModule),
      },
      {
        path: 'myreport',
        data: { pageTitle: 'correspCareApp.configManageMyreport.home.title' },
        loadChildren: () => import('./configManage/myreport/myreport.module').then(m => m.ConfigManageMyreportModule),
      },
      /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
    ]),
  ],
})
export class EntityRoutingModule {}
