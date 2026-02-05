import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { BomTreeFullResponse, BomTreeNode, Product } from '../../../shared/models';

@Component({
  selector: 'app-bom-tree',
  templateUrl: './bom-tree.component.html',
  styleUrls: ['./bom-tree.component.css']
})
export class BomTreeComponent implements OnInit {
  productSku: string = '';
  bomTree: BomTreeFullResponse | null = null;
  expandedNodes: Set<number> = new Set();
  selectedNode: BomTreeNode | null = null;
  loading = true;
  error: string | null = null;
  deleteConfirmId: number | null = null;

  // Edit BOM Settings modal
  showEditSettingsModal = false;
  editProductSku: string = '';
  editBomVersion: string = '';
  editBomStatus: string = '';
  savingSettings = false;
  settingsError: string | null = null;
  statusOptions = ['ACTIVE', 'INACTIVE', 'DRAFT', 'OBSOLETE'];
  products: Product[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productSku = params['productSku'];
      this.loadBomTree();
    });
  }

  loadBomTree(): void {
    this.loading = true;
    this.error = null;

    this.apiService.getBomTree(this.productSku).subscribe({
      next: (tree) => {
        this.bomTree = tree;
        this.loading = false;
        // Expand root nodes by default
        tree.tree.forEach(node => this.expandedNodes.add(node.bomId));
      },
      error: (err) => {
        this.error = 'Failed to load BOM tree';
        this.loading = false;
        console.error('Error loading BOM tree:', err);
      }
    });
  }

  toggleNode(bomId: number): void {
    if (this.expandedNodes.has(bomId)) {
      this.expandedNodes.delete(bomId);
    } else {
      this.expandedNodes.add(bomId);
    }
  }

  isExpanded(bomId: number): boolean {
    return this.expandedNodes.has(bomId);
  }

  selectNode(node: BomTreeNode): void {
    this.selectedNode = this.selectedNode?.bomId === node.bomId ? null : node;
  }

  isSelected(node: BomTreeNode): boolean {
    return this.selectedNode?.bomId === node.bomId;
  }

  expandAll(): void {
    if (!this.bomTree) return;
    this.collectAllNodeIds(this.bomTree.tree).forEach(id => this.expandedNodes.add(id));
  }

  collapseAll(): void {
    this.expandedNodes.clear();
  }

  private collectAllNodeIds(nodes: BomTreeNode[]): number[] {
    const ids: number[] = [];
    const collect = (nodeList: BomTreeNode[]) => {
      nodeList.forEach(node => {
        ids.push(node.bomId);
        if (node.children?.length) {
          collect(node.children);
        }
      });
    };
    collect(nodes);
    return ids;
  }

  addRootNode(): void {
    this.router.navigate(['/manage/bom', this.productSku, 'node', 'new']);
  }

  addChildNode(parentId: number): void {
    this.router.navigate(['/manage/bom', this.productSku, 'node', 'new'], {
      queryParams: { parentId }
    });
  }

  editNode(bomId: number): void {
    this.router.navigate(['/manage/bom', this.productSku, 'node', bomId, 'edit']);
  }

  confirmDelete(bomId: number): void {
    this.deleteConfirmId = bomId;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteNode(bomId: number, cascade: boolean = false): void {
    const deleteObs = cascade
      ? this.apiService.deleteBomNodeCascade(bomId)
      : this.apiService.deleteBomNode(bomId);

    deleteObs.subscribe({
      next: () => {
        this.deleteConfirmId = null;
        this.loadBomTree();
      },
      error: (err) => {
        console.error('Error deleting node:', err);
        alert(err.error?.message || 'Failed to delete node. It may have children.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/manage/bom']);
  }

  getIndentLevel(level: number): string {
    return `${(level - 1) * 24}px`;
  }

  // =====================================================
  // Edit BOM Settings
  // =====================================================

  openEditSettingsModal(): void {
    if (this.bomTree) {
      this.editProductSku = this.bomTree.productSku;
      this.editBomVersion = this.bomTree.bomVersion;
      // Get status from first node if available
      this.editBomStatus = this.bomTree.tree.length > 0 ? this.bomTree.tree[0].status : 'ACTIVE';
      this.settingsError = null;
      this.loadProducts();
      this.showEditSettingsModal = true;
    }
  }

  closeEditSettingsModal(): void {
    this.showEditSettingsModal = false;
    this.settingsError = null;
  }

  loadProducts(): void {
    this.apiService.getActiveProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (err) => {
        console.error('Error loading products:', err);
      }
    });
  }

  saveSettings(): void {
    if (!this.editBomVersion.trim()) {
      this.settingsError = 'BOM Version is required';
      return;
    }

    if (!this.editProductSku.trim()) {
      this.settingsError = 'Product is required';
      return;
    }

    this.savingSettings = true;
    this.settingsError = null;

    const request: any = {
      bomVersion: this.editBomVersion,
      status: this.editBomStatus
    };

    // Only include newProductSku if it changed
    if (this.editProductSku !== this.productSku) {
      request.newProductSku = this.editProductSku;
    }

    this.apiService.updateBomSettings(this.productSku, request).subscribe({
      next: (response) => {
        this.savingSettings = false;
        this.showEditSettingsModal = false;
        // If product changed, navigate to the new product's tree
        if (response.productSku !== this.productSku) {
          this.router.navigate(['/manage/bom', response.productSku, 'tree']);
        } else {
          this.loadBomTree(); // Reload tree to show updated values
        }
      },
      error: (err) => {
        this.savingSettings = false;
        this.settingsError = err.error?.message || 'Failed to update BOM settings';
      }
    });
  }
}
