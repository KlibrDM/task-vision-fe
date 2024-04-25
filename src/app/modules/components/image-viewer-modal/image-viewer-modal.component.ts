import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IUploadedDoc } from 'src/app/models/uploadedDocs';
import { closeOutline, cloudDownloadOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-image-viewer-modal',
  templateUrl: './image-viewer-modal.component.html',
  styleUrls: ['./image-viewer-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule
  ]
})
export class ImageViewerModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Input() isOpen = false;
  @Input() image?: IUploadedDoc & { blobUrl?: string };

  isImageFullSize = false;

  constructor() {
    addIcons({ closeOutline, cloudDownloadOutline });
  }

  toggleImageFullSize() {
    this.isImageFullSize = !this.isImageFullSize;
  }

  close() {
    this.closeModal.emit();
  }

  download() {
    if (!this.image || !this.image.blobUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = this.image.blobUrl;
    link.download = this.image.name;
    link.click();
  }
}
