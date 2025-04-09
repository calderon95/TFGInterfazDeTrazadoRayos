export class Caracterizacion {
	constructor(name = "" , incidencia = [] ,DCF = [], DCF_q = []) {

		this.name = name;
		this.incidencia = incidencia;
		this.DCF = DCF;
		this.DCF_q = DCF_q;
	}
	
	getName() {
		return this.name;
	}

	setName(name) {
		this.name = name;
	}

	getIncidencia() {
		return this.incidencia;
	}
	
	setIncidencia(incidencia) {
		this.incidencia = incidencia;
	}
	
	getDCF() {
		return this.DCF;
	}

	setDCF(DCF) {
		this.DCF = DCF;
	}

	getDCF_q() {
		return this.DCF_q;
	}

	setDCF_q(DCF_q) {
		this.DCF_q = DCF_q;
	}
	
	
}