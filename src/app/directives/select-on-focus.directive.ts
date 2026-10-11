import { Directive, HostListener } from '@angular/core';

/**
 * Selecciona todo el contenido del input al enfocarlo, para que tipear reemplace
 * el valor existente (ej. el "0" por defecto de los campos numéricos) en vez de anteponerse.
 */
@Directive({
  selector: 'input[selectOnFocus]',
  standalone: true
})
export class SelectOnFocusDirective {
  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }
}
