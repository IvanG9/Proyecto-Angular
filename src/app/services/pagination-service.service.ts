import { Injectable } from '@angular/core';
import { Pagination } from '../interfaces/Pagination';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {

  private pages: Pagination = {
    total: 123849,
    limit: 4,
    first_page: 1,
    current_page: 1,
    total_pages: 20000,

  };

  getPages(): Pagination {

    return this.pages;

  }

  updateCurrentPage(page: number): void {

    this.pages.current_page = page;

  }
}
