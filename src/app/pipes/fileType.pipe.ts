import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'fileType'
})
export class FileTypePipe implements PipeTransform {
  transform(value: string): string {
    switch (value) {
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return "PPTX";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "DOCX";
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return "XLSX";
      case "application/msword":
        return "DOC";
      case "application/vnd.ms-excel":
        return "XLS";
      case "application/vnd.ms-powerpoint":
        return "PPT";
      case "application/vnd.oasis.opendocument.text":
        return "ODT";
      case "application/vnd.oasis.opendocument.spreadsheet":
        return "ODS";
      case "application/vnd.oasis.opendocument.presentation":
        return "ODP";
      case "application/pdf":
        return "PDF";
      case "text/plain":
        return "TXT";
      case "application/zip":
        return "ZIP";
      case "application/x-rar-compressed":
        return "RAR";
      case "application/x-zip-compressed":
        return "ZIP";
      case "application/x-7z-compressed":
        return "7Z";
      case "application/gzip":
        return "GZ";
      case "application/x-tar":
        return "TAR";
      case "application/x-bzip2":
        return "BZ2";
      case "application/x-xz":
        return "XZ";
      case "application/x-apple-diskimage":
        return "DMG";
      case "application/octet-stream":
        return "BIN";
      case "application/x-msdownload":
        return "EXE";
      case "application/x-msi":
        return "MSI";
      case "image/jpeg":
        return "JPG";
      case "image/png":
        return "PNG";
      case "image/gif":
        return "GIF";
      case "image/svg+xml":
        return "SVG";
      case "image/bmp":
        return "BMP";
      case "image/tiff":
        return "TIFF";
      case "image/x-icon":
        return "ICO";
      case "image/webp":
        return "WEBP";
      case "image/avif":
        return "AVIF";
      case "video/mp4":
        return "MP4";
      case "video/mpeg":
        return "MPEG";
      case "video/ogg":
        return "OGV";
      case "video/quicktime":
        return "MOV";
      case "video/x-msvideo":
        return "AVI";
      case "video/x-flv":
        return "FLV";
      case "video/x-matroska":
        return "MKV";
      case "video/webm":
        return "WEBM";
      case "video/x-ms-wmv":
        return "WMV";
      case "audio/mpeg":
        return "MP3";
      case "audio/ogg":
        return "OGG";
      case "audio/wav":
        return "WAV";
      case "audio/webm":
        return "WEBM";
      case "audio/aac":
        return "AAC";
      case "audio/flac":
        return "FLAC";
      case "audio/midi":
        return "MIDI";
      case "audio/x-matroska":
        return "MKA";
      case "audio/x-ms-wav":
        return "WAV";
      case "audio/x-ms-wma":
        return "WMA";
      case "folder":
        return "FOLDER";
      default:
        return "FILE";
    }
  }
}
