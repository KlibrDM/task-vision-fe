import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { LogsListComponent } from '../logs-list/logs-list.component';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    TranslateModule,
    LogsListComponent,
  ]
})
export class PaginationComponent implements OnChanges {
  @Input() count: number = 0;
  @Input() limit: number = 10;
  @Input() offset: number = 0;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();
  pages = 1;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['count'] && changes['count'].currentValue) {
      this.pages = Math.ceil(this.count / this.limit);
    }
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.pageChange.emit(page);
  }

  // TODO: Limit not implemented
  onLimitChange(limit: number) {
    this.limit = limit;
    this.limitChange.emit(limit);
  }
}
