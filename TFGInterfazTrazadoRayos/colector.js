export class Colector {
  constructor(name = "", posColectorX = [], posColectorY = []) {
    
	this.name = name;
    this.posColectorX = posColectorX;	
	this.posColectorY = posColectorY;	
	

  }

  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
  }
  
  getPosColectorX() {
    return this.posColectorX;
  }

  setPosColectorX(posColectorX) {
    this.posColectorX = posColectorX;
  }
  
   getPosColectorY() {
    return this.posColectorY;
  }

  setPosColectorY(posColectorY) {
    this.posColectorY = posColectorY;
  }
  
  
  
}
