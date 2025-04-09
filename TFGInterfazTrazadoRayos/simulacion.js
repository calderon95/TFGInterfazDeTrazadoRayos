export class Simulacion {
  
  constructor(name = "" , reactor = [] , posColector = [], nColec = 0 , posRayos = [], nRayos = 0 ,startingIndex = [] ,xAverageMeters = 0, yAverageMeters = 0, pxPerMeter = 0) {
		
		this.name = name;
		this.reactor = reactor;
		this.posColector = posColector;
		this.nColec = nColec;
		this.posRayos = posRayos;
		this.nRayos = nRayos;
		this.startingIndex = startingIndex;
		this.xAverageMeters = xAverageMeters;
		this.yAverageMeters = yAverageMeters	
		this.pxPerMeter  = pxPerMeter;

	}


	getName() {
	return this.name;
	}

	setName(name) {
	this.name = name;
	}

	getReactor() {
	return this.reactor;
	}

	setReactor(reactor) {
	this.reactor = reactor;
	}

	getPosColector() {
	return this.posColector;
	}

	setPosColector(posColector) {
	this.posColector = posColector;
	}
	
	getNColec() {
	return this.nColec;
	}

	setNColec(nColec) {
	this.nColec = nColec;
	}

	getPosRayos() {
	return this.posRayos;
	}

	setPosRayos(posRayos) {
	this.posRayos = posRayos;
	}

	getNRayos() {
	return this.nRayos;
	}

	setNRayos(nRayos) {
	this.nRayos = nRayos;
	}
	
	getStartingIndex() {
	return this.startingIndex;
	}

	setStartingIndex(startingIndex) {
	this.startingIndex = startingIndex;
	}

	getXAverageMeters() {
	return this.xAverageMeters;
	}

	setXAverageMeters(xAverageMeters) {
	this.xAverageMeters = xAverageMeters;
	}

	getYAverageMeters() {
	return this.yAverageMeters;
	}


	setYAverageMeters(yAverageMeters) {
	this.yAverageMeters = yAverageMeters;
	}

	getPxPerMeter() {
	return this.pxPerMeter;
	}

	setPxPerMeter(pxPerMeter) {
	this.pxPerMeter = pxPerMeter;
	}
  

}
