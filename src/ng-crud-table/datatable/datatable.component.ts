import {
  Component, OnInit, ViewChild, Input, Output, ViewEncapsulation, EventEmitter,
  ChangeDetectionStrategy, DoCheck, KeyValueDiffers, KeyValueDiffer, ChangeDetectorRef
} from '@angular/core';
import {DataTable, Filter, SortMeta} from '../types';


@Component({
  selector: 'app-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['../styles/index.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatatableComponent implements OnInit, DoCheck {

  @Input() public table: DataTable;
  @Input() public itemsPerPage: number = 10;
  @Input() public totalItems: number = 0;
  @Input() public currentPage: number = 1;
  @Input() public loading: boolean = false;
  @Input() public selectedRowIndex: number;
  @Input() public trackByProp: string;
  @Output() filterChanged: EventEmitter<Filter> = new EventEmitter();
  @Output() pageChanged: EventEmitter<any> = new EventEmitter();
  @Output() sortChanged: EventEmitter<any> = new EventEmitter();
  @Output() editComplete: EventEmitter<any> = new EventEmitter();
  @Output() selectedRowIndexChanged: EventEmitter<number> = new EventEmitter();

  @Input()
  set rows(val: any) {
    if (this.table.settings.clientSide) {
      this.table.filters = <Filter>{};
      this.table.sortMeta = <SortMeta>{};
      this.rowsCopy = (val) ? val.slice(0) : [];
      this._rows = this.getItems();
    } else {
      this._rows = val;
    }
  }

  get rows(): any {
    return this._rows;
  }

  @ViewChild('selectFilter') selectFilter: any;

  public offsetX: number = 0;
  public rowsCopy: any;

  private rowDiffer: KeyValueDiffer<{}, {}>;
  private _rows: any[];

  constructor(private differs: KeyValueDiffers, private cd: ChangeDetectorRef) {
    this.rowDiffer = this.differs.find({}).create();
  }

  ngOnInit() {
  }

  ngDoCheck(): void {
    if (this.rowDiffer.diff(this.rows)) {
      this.cd.markForCheck();
    }
  }

  onPageChanged(event: any): void {
    if (this.table.settings.clientSide) {
      this.currentPage = event;
      this._rows = this.getItems();
    }
    this.pageChanged.emit(event);
    this.selectRow(0);
  }

  onEditComplete(event) {
    this.editComplete.emit(event);
  }

  onFilter(event) {
    if (this.table.settings.clientSide) {
      this.currentPage = 1;
      this._rows = this.getItems();
    }
    this.filterChanged.emit(this.table.filters);
    this.selectRow(0);
  }

  onSort(event) {
    if (this.table.settings.clientSide) {
      this._rows = this.getItems();
    }
    this.sortChanged.emit(this.table.sortMeta);
    this.selectRow(0);
  }

  selectRow(rowIndex: number) {
    if (this.rows && this.rows.length) {
      this.selectedRowIndex = rowIndex;
    } else {
      this.selectedRowIndex = undefined;
    }
    this.selectedRowIndexChanged.emit(this.selectedRowIndex);
  }

  onSelectRow(rowIndex: number) {
    this.selectRow(rowIndex);
  }

  showColumnMenu(event) {
    this.selectFilter.show(200, event.top, event.left, event.column);
  }

  onBodyScroll(event: MouseEvent): void {
    this.offsetX = event.offsetX;
    this.selectFilter.hide();
  }

  filter(data: any[], filters: Filter) {
    let filteredData: any[] = data;
    for (const key in filters) {
      if (filters[key]['value']) {
        filteredData = filteredData.filter((item: any) => {
          if (key in item) {
            return item[key].toString().match(filters[key]['value']);
          } else {
            return false;
          }
        });
      }
    }
    return filteredData;
  }

  sort(data: any, sortField ?: string, sortOrder ?: number) {
    return data.sort((previous: any, current: any) => {
      if (previous[sortField] > current[sortField]) {
        return sortOrder === -1 ? -1 : 1;
      } else if (previous[sortField] < current[sortField]) {
        return sortOrder === 1 ? -1 : 1;
      }
      return 0;
    });
  }

  pager(data: any, page: any): any[] {
    const start = (page - 1) * this.itemsPerPage;
    const end = this.itemsPerPage > -1 ? (start + this.itemsPerPage) : data.length;
    return data.slice(start, end);
  }

  getItems() {
    let data = this.filter(this.rowsCopy, this.table.filters);
    this.totalItems = data.length;
    data = this.sort(data, this.table.sortMeta.field, this.table.sortMeta.order);
    data = this.pager(data, this.currentPage);
    return data;
  }

}
