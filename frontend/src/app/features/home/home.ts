import { Component } from '@angular/core';
import { Content } from '../home/components/content/content';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Content],
  templateUrl: './home.html',
})
export class Home {

}
