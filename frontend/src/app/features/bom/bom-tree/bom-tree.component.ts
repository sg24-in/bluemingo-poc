import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ChartService, CHART_FONT } from '../../../core/services/chart.service';
import { BomTreeFullResponse, BomTreeNode, MoveBomNodeRequest, Product } from '../../../shared/models';

@Component({
  selector: 'app-bom-tree',
  templateUrl: './bom-tree.component.html',
  styleUrls: ['./bom-tree.component.css']
})
export class BomTreeComponent implements OnInit, OnDestroy {
  @ViewChild('bomFlowChart') bomFlowChartRef!: ElementRef<HTMLDivElement>;

  productSku: string = '';
  bomTree: BomTreeFullResponse | null = null;
  expandedNodes: Set<number> = new Set();
  selectedNode: BomTreeNode | null = null;
  loading = true;
  error: string | null = null;
  deleteConfirmId: number | null = null;

  // Move node modal
  showMoveModal = false;
  moveNodeId: number | null = null;
  moveTargetParentId: number | null = null;
  movingNode = false;
  moveError: string | null = null;
  allFlatNodes: { bomId: number; materialId: string; materialName: string; sequenceLevel: number }[] = [];

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
    private apiService: ApiService,
    private chartService: ChartService
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
        setTimeout(() => this.buildBomFlowChart(), 50);
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
        this.deleteConfirmId = null;
        this.error = err.error?.message || 'Failed to delete node. It may have children.';
        console.error('Error deleting node:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/manage/bom']);
  }

  getIndentLevel(level: number): string {
    const maxIndent = 240; // Cap at ~10 levels
    return `${Math.min((level - 1) * 24, maxIndent)}px`;
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

  // =====================================================
  // Move/Reparent Node
  // =====================================================

  openMoveModal(bomId: number): void {
    this.moveNodeId = bomId;
    this.moveTargetParentId = null;
    this.moveError = null;
    this.movingNode = false;

    // Build flat list of all nodes, excluding the node being moved and its descendants
    if (this.bomTree) {
      const descendantIds = this.getDescendantIds(bomId, this.bomTree.tree);
      descendantIds.add(bomId);

      this.allFlatNodes = [];
      this.flattenNodesForMove(this.bomTree.tree, descendantIds);
    }

    this.showMoveModal = true;
  }

  closeMoveModal(): void {
    this.showMoveModal = false;
    this.moveNodeId = null;
    this.moveError = null;
  }

  performMove(): void {
    if (!this.moveNodeId) return;

    this.movingNode = true;
    this.moveError = null;

    const request: MoveBomNodeRequest = {
      newParentBomId: this.moveTargetParentId || undefined
    };

    this.apiService.moveBomNode(this.moveNodeId, request).subscribe({
      next: () => {
        this.movingNode = false;
        this.showMoveModal = false;
        this.moveNodeId = null;
        this.loadBomTree();
      },
      error: (err) => {
        this.movingNode = false;
        this.moveError = err.error?.message || 'Failed to move node';
        console.error('Error moving node:', err);
      }
    });
  }

  private getDescendantIds(bomId: number, nodes: BomTreeNode[]): Set<number> {
    const ids = new Set<number>();
    const findAndCollect = (nodeList: BomTreeNode[]): boolean => {
      for (const node of nodeList) {
        if (node.bomId === bomId) {
          this.collectChildIds(node, ids);
          return true;
        }
        if (node.children?.length && findAndCollect(node.children)) {
          return true;
        }
      }
      return false;
    };
    findAndCollect(nodes);
    return ids;
  }

  private collectChildIds(node: BomTreeNode, ids: Set<number>): void {
    if (node.children) {
      for (const child of node.children) {
        ids.add(child.bomId);
        this.collectChildIds(child, ids);
      }
    }
  }

  private flattenNodesForMove(nodes: BomTreeNode[], excludeIds: Set<number>): void {
    for (const node of nodes) {
      if (!excludeIds.has(node.bomId)) {
        this.allFlatNodes.push({
          bomId: node.bomId,
          materialId: node.materialId,
          materialName: node.materialName,
          sequenceLevel: node.sequenceLevel
        });
      }
      if (node.children?.length) {
        this.flattenNodesForMove(node.children, excludeIds);
      }
    }
  }

  ngOnDestroy(): void {
    this.chartService.disposeAll();
  }

  private buildBomFlowChart(): void {
    if (!this.bomFlowChartRef || !this.bomTree || this.bomTree.tree.length === 0) return;

    const sankeyNodes: any[] = [];
    const sankeyLinks: any[] = [];
    const nodeNames = new Set<string>();

    // Colors by level
    const levelColors: Record<number, string> = {
      1: '#1976d2',
      2: '#7b1fa2',
      3: '#388e3c',
      4: '#f57c00',
      5: '#00838f'
    };
    const lossColor = '#ef5350';

    // Add product node (final destination)
    const productName = `${this.productSku} (Product)`;
    sankeyNodes.push({
      name: productName,
      itemStyle: { color: '#0d47a1', borderColor: '#0d47a1' }
    });
    nodeNames.add(productName);

    // Flatten tree: collect all nodes with their parent info
    const flatNodes: { node: BomTreeNode; parentName: string }[] = [];

    const collectNodes = (treeNodes: BomTreeNode[], parentName: string) => {
      treeNodes.forEach(node => {
        const nodeName = `${node.materialId} (${node.materialName})`;
        flatNodes.push({ node, parentName });
        if (node.children?.length) {
          collectNodes(node.children, nodeName);
        }
      });
    };
    collectNodes(this.bomTree.tree, productName);

    // Build Sankey nodes and links (flow: raw materials → assemblies → product)
    flatNodes.forEach(({ node, parentName }) => {
      const nodeName = `${node.materialId} (${node.materialName})`;
      const level = node.sequenceLevel || 1;
      const color = levelColors[level] || '#607d8b';
      const qty = node.quantityRequired;
      const yieldRatio = node.yieldLossRatio || 1;
      const effectiveQty = qty * yieldRatio;  // what actually reaches parent
      const lossQty = qty - effectiveQty;     // what is lost

      // Add material node if not already added
      if (!nodeNames.has(nodeName)) {
        sankeyNodes.push({
          name: nodeName,
          itemStyle: { color: color, borderColor: color }
        });
        nodeNames.add(nodeName);
      }

      // Main flow link: material → parent (effective quantity)
      sankeyLinks.push({
        source: nodeName,
        target: parentName,
        value: Math.max(effectiveQty, 0.1),
        lineStyle: { color: color, opacity: 0.4 }
      });

      // Loss link: material → loss node (if yield < 1)
      if (yieldRatio < 1 && lossQty > 0.001) {
        const lossNodeName = `Loss: ${node.materialId}`;
        if (!nodeNames.has(lossNodeName)) {
          sankeyNodes.push({
            name: lossNodeName,
            itemStyle: { color: lossColor, borderColor: lossColor }
          });
          nodeNames.add(lossNodeName);
        }
        sankeyLinks.push({
          source: nodeName,
          target: lossNodeName,
          value: Math.max(lossQty, 0.1),
          lineStyle: { color: lossColor, opacity: 0.3 }
        });
      }
    });

    const chart = this.chartService.initChart(this.bomFlowChartRef.nativeElement, 'bom-flow');
    this.chartService.setOption('bom-flow', {
      tooltip: {
        trigger: 'item',
        textStyle: { fontSize: CHART_FONT.tooltip },
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            return `<b>${params.name}</b>`;
          }
          if (params.dataType === 'edge') {
            const src = params.data.source;
            const tgt = params.data.target;
            const val = params.data.value;
            const isLoss = tgt.startsWith('Loss:');
            if (isLoss) {
              return `<b>${src}</b> → Yield Loss<br/>Loss: ${val.toFixed(2)}`;
            }
            return `<b>${src}</b> → <b>${tgt}</b><br/>Qty: ${val.toFixed(2)}`;
          }
          return '';
        }
      },
      series: [{
        type: 'sankey',
        layout: 'none',
        data: sankeyNodes,
        links: sankeyLinks,
        orient: 'horizontal',
        nodeAlign: 'justify',
        layoutIterations: 32,
        nodeWidth: 20,
        nodeGap: 14,
        label: {
          show: true,
          fontSize: CHART_FONT.label,
          color: '#333',
          formatter: (params: any) => {
            // Shorten label for loss nodes
            if (params.name.startsWith('Loss:')) {
              return params.name.replace('Loss: ', '⚠ ');
            }
            // Show material ID only (before the parenthesis)
            const match = params.name.match(/^([^(]+)/);
            return match ? match[1].trim() : params.name;
          }
        },
        emphasis: {
          focus: 'adjacency'
        },
        lineStyle: {
          curveness: 0.5,
          color: 'source'
        }
      }]
    });
  }
}
