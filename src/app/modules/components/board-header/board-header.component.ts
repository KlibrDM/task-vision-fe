import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-board-header',
  templateUrl: './board-header.component.html',
  styleUrls: ['./board-header.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class BoardHeaderComponent {
  @Input() parent?: string;
  @Input() projectName?: string;
  @Output() onlyMineClick = new EventEmitter();
  @Output() filtersClick = new EventEmitter();
  @Output() createItemClick = new EventEmitter();

  showOnlyMineState = false;

  constructor() { }

  onOnlyMineClicked() {
    this.onlyMineClick.emit(!this.showOnlyMineState);
  }

  onFiltersClicked() {
    this.filtersClick.emit();
  }

  onCreateItemClicked() {
    this.createItemClick.emit();
  }
}
