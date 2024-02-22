import { Injectable } from '@angular/core';
import { IArtwork } from '../interfaces/i-artwork';
import {HttpClient, HttpClientModule, HttpParams} from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, from, map, mergeMap, toArray } from 'rxjs';

const url = `https://api.artic.edu/api/v1/artworks`;

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {


  artworksSubject: Subject<IArtwork[]> = new Subject();

  constructor(private http: HttpClient) { }

  public getArtworks(page: number, limit: number): Observable<IArtwork[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<{ data: IArtwork[] }>(url, { params })
      .pipe(map((response) => response.data));
  }

  public filterArtWorks(filter:string): void{
    this.http.get<{ data: IArtwork[] }>(`${url}/search?q=${filter}&fields=id,description,title,image_id`).pipe(
      map(response => response.data)
    ).subscribe((artworks) => {
        this.artworksSubject.next(artworks);
    }
    );
  }

  public getArtworksFromIDs(artworkList: string[]): Observable<IArtwork[]>{

    from(artworkList).pipe(
      mergeMap(artwork_id =>{
        return  this.http.get<{ data: IArtwork[] }>(`${url}/${artwork_id}`).pipe(
          map(response => response.data)
        )
      }),
      toArray()
    ).subscribe(artworks => this.artworksSubject.next(artworks.flat()))

    return this.artworksSubject;
  }


}
