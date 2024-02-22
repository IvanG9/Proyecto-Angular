import {Injectable} from '@angular/core';
import {createClient} from '@supabase/supabase-js'
import {Observable, Subject, from, tap} from 'rxjs';
import {IUser} from '../interfaces/user';
import {environment} from '../../environments/environment';


const emptyUser: IUser = {id: '0', avatar_url: 'assets/logo.svg', full_name: 'none', username: 'none'}

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  supaClient: any = null;

  constructor() {
    this.supaClient = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  userSubject: Subject<IUser> = new Subject;
  favoritesSubject: Subject<{ id: number, uid: string, artwork_id: string }[]> = new Subject;

  async login(email: string, password: string): Promise<boolean> {
    let session = await this.supaClient.auth.getSession();
    let data, error;
    if (session.data.session) {
      data = session.data.session;
    } else {
      session = await this.supaClient.auth.signInWithPassword({
        email,
        password
      });
      data = session.data;
      error = session.error;
      if (error) {
        //   throw error;
        return false
      }
    }
    if (data.user != null) {
      this.getProfile(data.user.id);
      return true;
    }
    return false;
  }

  async register(email: string, password: string, username: string, fullName: string): Promise<boolean> {
    try {

      console.log(username);
      console.log(fullName);

      const {data, error} = await this.supaClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Error registering user:', error);
        return false;
      }

      if (data?.user == null) {
        console.log("Data null");
        return false;
      }

      const defaultAvatarUrl = 'default.png';

      console.error(data);

      const profileUpdate = await this.supaClient
        .from('profiles')
        .update(
          {
            username: username,
            full_name: fullName,
            avatar_url: defaultAvatarUrl,
          }).eq('id', data.user.id);

      if (profileUpdate.error) {
        console.error('Error updating profile:', profileUpdate.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error registering user:', error);
      return false;
    }
  }

  async updateUserInfo(username: string, fullName: string): Promise<boolean> {
    try {
      const session = await this.supaClient.auth.getSession();
      console.error(session);
      if (session?.data) {
        const userId = session.data.session.user.id;
        const profileUpdate = await this.supaClient
          .from('profiles')
          .update({
            id: userId,
            username: username,
            full_name: fullName,
          })
          .eq('id', userId);

        if (profileUpdate.error) {
          console.error('Error updating profile:', profileUpdate.error);
          return false;
        }
        return true;
      } else {
        console.error('No hay sesión de usuario.');
        return false;
      }
    } catch (error) {
      console.error('Error actualizando información del usuario:', error);
      return false;
    }
  }

  getProfile(userId: string): void {

    let profilePromise: Promise<{ data: IUser[] }> = this.supaClient
      .from('profiles')
      .select("*")
      // Filters
      .eq('id', userId);

    from(profilePromise).pipe(
      tap(data => console.log(data))
    ).subscribe(async (profile: { data: IUser[] }) => {
        this.userSubject.next(profile.data[0]);
        const avatarFile = profile.data[0].avatar_url.split('/').at(-1);
        if (avatarFile) {
          //const { data, error } = await this.supaClient.storage.from('avatars').download(avatarFile);
          //const url = URL.createObjectURL(data)
          //profile.data[0].avatar_url = url;
        }

        this.userSubject.next(profile.data[0]);
      }
    );

  }

  async isLogged() {
    let {data, error} = await this.supaClient.auth.getSession();
    if (data.session) {
      this.getProfile(data.session.user.id)
    }
  }

  async logout() {
    const {error} = await this.supaClient.auth.signOut();
    this.userSubject.next(emptyUser);
  }

  async getFavorites(userId: string): Promise<string[]> {
    try {
      const {data, error} = await this.supaClient
        .from('favorites')
        .select('artwork_id')
        .eq('uid', userId);

      if (error) {
        console.error('Error getting favorites:', error);
        return [];
      }

      return data?.map((favorite: { artwork_id: string }) => favorite.artwork_id) || [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async getFavorite(userId: string, artwork_id: number): Promise<string[]> {
    try {
      const {data, error} = await this.supaClient
        .from('favorites')
        .select('artwork_id')
        .eq('uid', userId)
        .eq('artwork_id', artwork_id);

      if (error) {
        console.error('Error getting favorites:', error);
        return [];
      }

      return data?.map((favorite: { artwork_id: string }) => favorite.artwork_id) || [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async setFavorite(artwork_id: string): Promise<void> {
    console.log('setfavorite', artwork_id);

    try {
      const {data, error} = await this.supaClient.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      const session = data?.session;

      if (session) {
        await this.supaClient.from('favorites').insert({uid: session.user.id, artwork_id});
        // Actualizar la lista de favoritos después de agregar uno nuevo
        await this.getFavorites(session.user.id);
      }
    } catch (error: any) {
      console.error('Error setting favorite:', error.message);
    }
  }

  async setAvatarAndUrl(uid: string, file: File): Promise<boolean> {
    try {
      // Subir la imagen a Supabase Storage
      const { data: fileData, error: fileError } = await this.supaClient.storage
        .from('avatars')
        .update(`avatar${uid}`, file);

      if (fileError) {
        console.error('Error uploading image to Supabase Storage:', fileError);
        return false;
      }

      const urlSup = 'https://pwjpltkzrxgerohomqgf.supabase.co/storage/v1/object/sign/avatars/';

      const { error: updateError } = await this.supaClient
        .from('profiles')
        .update({ avatar_url: `${urlSup}avatar${uid}` })
        .eq('id', uid);

      if (updateError) {
        console.error('Error updating user profile with avatar URL:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting avatar and URL:', error);
      return false;
    }
  }

  async deleteFavorite(artwork_id: string): Promise<void> {
    console.log('deleteFavorite', artwork_id);

    try {
      const {data, error} = await this.supaClient.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      const session = data?.session;

      if (session) {
        const {data: deletedFavorite, error: deleteError} = await this.supaClient
          .from('favorites')
          .delete()
          .eq('uid', session.user.id)
          .eq('artwork_id', artwork_id)
          .single();

        if (deleteError) {
          console.error('Error deleting favorite:', deleteError.message);
        }
      }
    } catch (error: any) {
      console.error('Error deleting favorite:', error.message);
    }
  }

  async getId() {
    const {data, error} = await this.supaClient.auth.getSession();
    if(data){
     return  data.session.user.id
    }
    return ""
  }
}


/*
npm install @supabase/supabase-js

*/
