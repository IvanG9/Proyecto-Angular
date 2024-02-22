import {Component, Input, OnInit} from '@angular/core';
import {IArtwork} from '../../interfaces/i-artwork';
import {ArtworkComponent} from '../artwork/artwork.component';
import {ArtworkRowComponent} from '../artwork-row/artwork-row.component';
import {ApiServiceService} from '../../services/api-service.service';
import {ArtworkFilterPipe} from '../../pipes/artwork-filter.pipe';
import {FilterService} from '../../services/filter.service';
import {debounceTime, filter} from 'rxjs';
import {UsersService} from '../../services/users.service';
import {Pagination} from '../../interfaces/Pagination'
import {PaginationComponent} from "../pagination/pagination.component";
import {Router} from "@angular/router";
import {PaginationService} from "../../services/pagination-service.service";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-artwork-list',
  standalone: true,
  imports: [ArtworkComponent,
    ArtworkRowComponent,
    ArtworkFilterPipe,
    CommonModule,
    PaginationComponent
  ],
  templateUrl: './artwork-list.component.html',
  styleUrl: './artwork-list.component.css'
})
export class ArtworkListComponent implements OnInit {
  pages!: Pagination;

  constructor(
    private artService: ApiServiceService,
    private filterService: FilterService,
    private usersService: UsersService,
    private router: Router,
    private paginationService: PaginationService
  ) {
    this.pages = paginationService.getPages();
  }

  @Input() page?: string;

  async ngOnInit(): Promise<void> {
    if (this.onlyFavorites === 'favorites') {
      this.artService
        .getArtworksFromIDs(['3752', '11294', '6010'])
        .subscribe((artworkList: IArtwork[]) => (this.quadres = artworkList));
    } else {
      this.loadArtworks(
        this.paginationService.getPages().current_page,
        this.paginationService.getPages().limit
      );
      this.filterService.searchFilter
        .pipe(debounceTime(500))
        .subscribe((filter) => {
          this.filter = filter;
          this.artService.filterArtWorks(this.filter);
        });
    }
  }

  loadArtworks(page: number, limit: number): void {

    this.artService
      .getArtworks(page, limit)
      .subscribe(async (artworkList: IArtwork[]) => {
        const usersService = new UsersService();
        console.log('artworkList');

          artworkList.map(async (quadre) => {
            const isFav = await usersService
              .getFavorite(await usersService.getId(), quadre.id)
              .then((result) => result.length > 0);
            console.log(await usersService.getId(),quadre.id);
            quadre.like = isFav;
          });

          this.quadres = artworkList;
          console.log(artworkList);

        this.paginationService.updateCurrentPage(page);
        // Actualizar la URL con los parámetros de consulta
        await this.router.navigate([], {
          queryParams: {page, limit},
        });
      });
  }

  toggleLike($event: boolean, artwork: IArtwork) {
    console.log($event, artwork);
    artwork.like = !artwork.like;
    if (artwork.like) {
      this.usersService.setFavorite(artwork.id + '');
    } else {
      this.usersService.deleteFavorite(artwork.id + '');
    }
  }

  quadres: IArtwork[] = [];
  filter: string = '';
  @Input() onlyFavorites: string = '';

}
