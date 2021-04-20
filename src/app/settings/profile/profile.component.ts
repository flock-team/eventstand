import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { User } from 'src/app/interfaces/user';
import { AuthService } from 'src/app/services/auth.service';
import { ConnectedAccountService } from 'src/app/services/connected-account.service';
import { PaymentService } from 'src/app/services/payment.service';
import { ProductService } from 'src/app/services/product.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  readonly nameMaxLength = 20;
  readonly descriptionMaxLength = 200;
  user: User;
  oldImageFile: string;
  newImageFile: string;
  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(this.nameMaxLength)]],
    email: ['', [Validators.email]],
    description: ['', [Validators.maxLength(this.descriptionMaxLength)]],
    ticketPrice: [
      '',
      [Validators.pattern(/\d+/), Validators.min(100), Validators.max(1000000)],
    ],
  });

  user$: Observable<User> = this.authService.user$;
  activeProducts = [];
  isProcessing: boolean;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    public connectedAccountService: ConnectedAccountService,
    private paymentService: PaymentService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      this.user = user;
      this.oldImageFile = user?.avatarURL;
      this.form.patchValue({
        ...user,
      });
    });

    console.log(this.newImageFile);
  }

  onCroppedImage(image: string): void {
    this.newImageFile = image;
    console.log(this.newImageFile);
  }

  async updateUser(): Promise<void> {
    this.isProcessing = true;
    if (this.form.controls.ticketPrice.dirty) {
      this.getActiveProducts();
      console.log(this.activeProducts);

      await this.paymentService
        .createStripeProductAndPrice(this.form.controls.ticketPrice.value)
        .then(() => this.deleteProducts())
        .catch((error) => {
          this.snackBar.open('チケット料金の設定に失敗しました');
          throw new Error(error.message);
        });
    }

    const formData = {
      ...this.form.value,
    };
    if (this.newImageFile !== undefined) {
      const value: User = {
        ...formData,
        uid: this.user.uid,
      };
      await this.userService
        .updateAvatar(this.user.uid, this.newImageFile)
        .then(() => {
          this.userService
            .updateUser(value)
            .then(() => (this.isProcessing = false))
            .then(() => this.snackBar.open('ユーザー情報を更新しました'));
        });
    } else {
      await this.userService
        .updateUser(formData)
        .then(() => (this.isProcessing = false))
        .then(() => this.snackBar.open('ユーザー情報を更新しました'));
    }
  }

  getActiveProducts(): void {
    this.productService
      .getActiveProducts(this.authService.uid)
      .pipe(take(1))
      .toPromise()
      .then((products) => {
        products.forEach((product) => this.activeProducts.push(product));
      });
  }

  deleteProducts(): void {
    for (const product of this.activeProducts) {
      this.paymentService.deleteStripePrice(product);
    }
  }
}
