import { Component } from '@angular/core';
import { Content } from '../layout/content/content';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Content],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {

}
