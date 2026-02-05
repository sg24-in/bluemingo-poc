import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { BomListComponent } from './bom-list/bom-list.component';
import { BomTreeComponent } from './bom-tree/bom-tree.component';
import { BomNodeFormComponent } from './bom-node-form/bom-node-form.component';

const routes: Routes = [
  { path: '', component: BomListComponent },
  { path: ':productSku/tree', component: BomTreeComponent },
  { path: ':productSku/node/new', component: BomNodeFormComponent },
  { path: ':productSku/node/:bomId/edit', component: BomNodeFormComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BomRoutingModule { }
