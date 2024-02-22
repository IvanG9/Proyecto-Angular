import {CommonModule} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {UsersService} from '../../services/users.service';
import {IUser} from '../../interfaces/user';
import {map} from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {

  constructor(private formBuilder: FormBuilder, private userService: UsersService) {
    this.crearFormulario();
  }

  formulario!: FormGroup;
  uid: string = '';

  ngOnInit(): void {
    this.userService.isLogged();
    this.userService.userSubject
      .pipe(map((p: IUser) => {
        this.uid = p.id
        return {
          id: p.id,
          username: p.username,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          website: p.website
        }
      }))
      .subscribe(profile => this.formulario.setValue(profile))
  }

  crearFormulario() {
    this.formulario = this.formBuilder.group({
      id: [''],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.pattern('.*[a-zA-Z].*'),
        ],
      ],
      full_name: [''],
      avatar_url: [''],
      website: ['', websiteValidator('http.*')],
    });
  }

  get usernameNoValid() {
    return (
      this.formulario.get('username')!.invalid &&
      this.formulario.get('username')!.touched
    );
  }

  async updateAvatarURL() {
    const avatarInput: HTMLInputElement | null = document.getElementById('avatar') as HTMLInputElement;

    if (avatarInput && avatarInput.files) {
      const avatarFile = avatarInput.files[0];

      if (avatarFile) {
        try {
          const success = await this.userService.setAvatarAndUrl(this.uid, avatarFile);
          if (success) {
            console.log('Avatar URL updated successfully.');
          } else {
            console.error('Error updating avatar URL.');
          }
        } catch (error) {
          console.error('Error updating avatar URL:', error);
        }
      } else {
        console.error('No file provided for avatar update.');
      }
    } else {
      console.error('Avatar input element not found.');
    }
  }

  updateUserInfo() {
    if (this.formulario.valid) {
      const username = this.formulario.get('username')?.value;
      const fullName = this.formulario.get('full_name')?.value;

      this.userService.updateUserInfo(username, fullName)
        .then((success) => {
          if (success !== undefined && success !== null) {
            if (success) {
              console.log('Información del usuario actualizada con éxito.');
            } else {
              console.error('Error al actualizar la información del usuario.');
            }
          } else {
            console.error('La función de actualización del usuario no devolvió un valor booleano.');
          }
        })
        .catch((error) => {
          console.error('Error al actualizar la información del usuario:', error);
        });
    }
  }

}

function websiteValidator(pattern: string): ValidatorFn {
  return (c: AbstractControl): { [key: string]: any } | null => {
    if (c.value) {
      let regexp = new RegExp(pattern);

      return regexp.test(c.value) ? null : {website: c.value};
    }
    return null;
  };
}
