import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { IUploadedDoc } from 'src/app/models/uploadedDocs';
import { closeOutline, cloudDownloadOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-video-viewer-modal',
  templateUrl: './video-viewer-modal.component.html',
  styleUrls: ['./video-viewer-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
  ]
})
export class VideoViewerModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  @Input() isOpen = false;
  @Input() video?: IUploadedDoc & { blobUrl?: string };

  constructor() {
    addIcons({ closeOutline, cloudDownloadOutline });
  }

  close() {
    this.closeModal.emit();
  }

  download() {
    if (!this.video || !this.video.blobUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = this.video.blobUrl;
    link.download = this.video.name;
    link.click();
  }
}
