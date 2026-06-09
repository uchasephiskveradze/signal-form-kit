import { Component } from '@angular/core';
import { ShowcaseComponent } from './showcase/showcase.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShowcaseComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
