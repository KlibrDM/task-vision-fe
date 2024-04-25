import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'absolute'
})
export class AbsPipe implements PipeTransform {
  transform(value: number): number {
    return Math.abs(value);
  }
}
