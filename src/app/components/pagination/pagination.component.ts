import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {PaginationService} from "../../services/pagination-service.service";
import {Pagination} from "../../interfaces/Pagination";

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css'],
})
export class PaginationComponent {

  @Input() pages!: Pagination;
  @Output() pageChanged: EventEmitter<number> = new EventEmitter<number>();

  manualPageInput: number = 1;
  manualPageError: boolean = false;

  constructor(private paginationService: PaginationService) {
    this.pages = this.paginationService.getPages();
  }

  goToPage(page: number): void {

    this.pageChanged.emit(page);
    this.paginationService.updateCurrentPage(page);

  }

  goToManualPage(): boolean {

    const selectedPage = this.manualPageInput;
    if (selectedPage >= 1 && selectedPage <= this.pages.total_pages) {
      this.goToPage(selectedPage);
      return true;
    }
    return false;
  }

}
