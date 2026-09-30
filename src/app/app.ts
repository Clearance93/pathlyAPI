import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { IdleService } from './services/idle.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styles: []
})
export class App {
  // Instantiated for the whole app: signs the learner out after 30 minutes of inactivity and
  // clears all cached data (important on shared devices).
  private idle = inject(IdleService);
}
