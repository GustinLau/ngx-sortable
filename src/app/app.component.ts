import {AfterContentInit, Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterContentInit {

  itemStringsLeft = [
    'Windstorm',
    'Bombasto',
    'Magneta',
    'Tornado'
  ];

  itemStringsRight = ['Mr. O', 'Tomato'];

  ngAfterContentInit(): void {
    setTimeout(() => {
      this.itemStringsRight.push('New item');
    }, 2000);
  }

}
