
import { Simulacion }  from './simulacion.js';
import { Colector }  from './colector.js';
import { Caracterizacion }  from './caracterizacion.js';

"use strict";




var vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// all shaders have a main function
void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace, 0, 1);
}
`;

var fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  // Just set the output to a constant 
  outColor = u_color;
}
`;


// Funcion para generar el shader de WebGL
function createShader(gl, type, source) {
	
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  //console.log(gl.getShaderInfoLog(shader));  
  
  gl.deleteShader(shader);
  return undefined;
}


// Función para generar el programa de WebGL
function createProgram(gl, vertexShader, fragmentShader) {
	
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  //console.log(gl.getProgramInfoLog(program));  
  gl.deleteProgram(program);
  return undefined;
}



// Función para calcular el radio
function radian (degree) {
   var rad = degree * (Math.PI / 180);
   return rad;
}

// Función para obtener la conversión de metros a pixel e insertarlo en un array 
function getPositionArrayPx(positions, px, pxPerMeter, AverageMeters){
	
    var positionsPx = [];
	
    for(var i=0; i < positions.length; i+=1){
		positionsPx[i] = Math.round((px/2) + (pxPerMeter*(positions[i] - AverageMeters)));
    }
	
	
    return positionsPx;
}

// Función para obtener la conversión de metros a pixel 
function getPositionVarPx(value, px, pxPerMeter, AverageMeters){
	
	return Math.round((px/2) + (pxPerMeter*(value - AverageMeters)));

 
}

// Funcion para recoger el máximo valor de un array
function getMaxOfArray(numArray) {
	
  return Math.max.apply(null, numArray);
  
}

// Funcion para recoger el mínimo valor de un array
function getMinOfArray(numArray) {
	
  return Math.min.apply(null, numArray);
  
}

// Funcion para crear un array que contenga las posiciones (X,Y) 
function createPositionBuffer(positionX , positionY){
    var positionBuffer = [];
	
    for(let i=0; i<=positionX.length-1;i+=1){ 
        positionBuffer.push(positionX[i]);
        positionBuffer.push(positionY[i]);
    }  
    
    return positionBuffer;
	
}

//Función para pasar el nombre del colector seleccionado
function elegirColector(){
	
		var select = document.getElementById('opciones');
		var opcionSeleccionada = select.options[select.selectedIndex];		
		
		return opcionSeleccionada.text;
		
}

//Función para pasar el nombre de la simulación seleccionada
function elegirSimulacion(){
	
		var selectSim = document.getElementById('opcionesSim');
		var opcionSeleccionada = selectSim.options[selectSim.selectedIndex];		
		
		return opcionSeleccionada.text;
		
}

//Función para pasar el nombre del gráfico seleccionado

function elegirGrafico(id) {
    let opcionSeleccionada;
    
    if (id === 'comprobarGrafico') {
        var selectGraf = document.getElementById('opcionesGraf');
        opcionSeleccionada = selectGraf.options[selectGraf.selectedIndex];
    } else if (id === 'comprobarGrafico2') {
        var selectGraf2 = document.getElementById('opcionesGraf2');
        opcionSeleccionada = selectGraf2.options[selectGraf2.selectedIndex];  
    }

    return opcionSeleccionada.text; // Retorna el texto si hay una opción seleccionada
}


/* Función que crea y configura un VAO (Vertex Array Object) y establece cómo interpretar los datos del buffer de arrays para el atributo de posición del vértice
	
*/

function attributeSetFloats(gl, prog, positionAttributeLocation, rsize, arr) {
	
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); // Crea un buffer de tipo ARRAY_BUFFER para almacenar coordenadas de vértices.
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr),gl.STATIC_DRAW); // Llena el buffer
	gl.bindVertexArray(gl.createVertexArray());		// Crea y vincula un VAO
	gl.enableVertexAttribArray(positionAttributeLocation); // Habilita el atributo de posición del vértice en el índice, esto hace que los datos de posición de los vértices se utilizarán durante el proceso de renderizado.			
	gl.vertexAttribPointer(positionAttributeLocation, rsize, gl.FLOAT, false, 0, 0); // Especifica cómo se deben interpretar los datos en el buffer
	
}


// Función que genera las posiciones del reactor según el radio seleccionado
function creaReactor(gl,simulacion){
	
	let core = [];  
	
	let radius = document.getElementById('radius').value; 
	let radiusMin = document.getElementById('radius').min; 
	let radiusMax = document.getElementById('radius').max;
	
	//Por debajo del mínimo se queda en el mínimo valor y por encima del máximo se queda en máximo 
	radius = Math.min(Math.max(radius, radiusMin), radiusMax)
	  
	//Se obtienen los datos del cuadro de texto de la posición x e y del reactor
	let posCoreX = document.getElementById('coreX').value;
	let posCoreY = document.getElementById('coreY').value;

	//Se calculan los diferentes puntos x e y del reactor y se insertan en el array core que contendrá cada punto del reactor  
	for(let i=0; i<=360;i+=0.1){             
		  
		core.push( getPositionVarPx(parseFloat(posCoreX) + parseFloat(radius) * Math.cos(radian(i)), gl.canvas.width, simulacion.getPxPerMeter(), simulacion.getXAverageMeters()));
		core.push( getPositionVarPx(parseFloat(posCoreY) + parseFloat(radius) * Math.sin(radian(i)), gl.canvas.height, simulacion.getPxPerMeter(), simulacion.getYAverageMeters()));
		   	
	}  
	
	return core;
	
}


// Función que pinta el reactor en el canvas, se le pasa tanto el contexto gl, el programa con sus shaders, las posiciones del reactor, el color con el que se pintará y la simulacion 
function drawReactor(gl,program,positionAttributeLocation,colorLocation,simulacion){ 
  
 
  gl.useProgram(program);
  attributeSetFloats(gl,program, positionAttributeLocation,2,simulacion.getReactor()); 
  gl.uniform4f(colorLocation, 0, 0, 0, 1);
  
  // draw
  gl.drawArrays(gl.LINE_STRIP, 0, simulacion.getReactor().length/2);  /* primitiveType ,offset ,count */
    
}



/* Funcion que dibuja el colector del programa, para ello primero se establece el programa activo y se establecen la interpretación los datos, 
	se dice de que color se quiere y finalmente pinta las coordenadas dadas */

function drawColector(gl,program,positionAttributeLocation,colorLocation,simulacion){ 

	for(let i=0; i< simulacion.getNColec(); i+=1){
		
		gl.useProgram(program);
		attributeSetFloats(gl,program, positionAttributeLocation,2,simulacion.getPosColector()[i]);
		gl.uniform4f(colorLocation, 0, 0, 0, 1);

		// draw
		gl.drawArrays(gl.LINE_STRIP, 0, simulacion.getPosColector()[i].length/2); /* primitiveType ,offset ,count */

	}

	

}



/* Funcion que dibuja los rayos del programa, para ello primero se establece el programa activo y se establecen la interpretación los datos, 
	se dice de que color se quiere y finalmente pinta las coordenadas dadas */


function drawRays(gl,program,positionAttributeLocation,colorLocation,simulacion){ //maxCanvasLength default 0.045

	let rayoActual = [];
	let pos = 0;
	
	for(let i=0; i < simulacion.getNRayos();i+=1){     
		
		do{	
			// Revisa si es el último rayo y pinta las posiciones restantes
			if(i == simulacion.getNRayos()-1){	
				let posicionesRestantes = simulacion.getPosRayos().length - pos;
				
				for(let j=0; j < posicionesRestantes/2; j+=1){
					rayoActual.push(simulacion.getPosRayos()[pos]);	
					rayoActual.push(simulacion.getPosRayos()[pos+1]);
					pos+=2;
				}
			}else{
				rayoActual.push(simulacion.getPosRayos()[pos]);	
				rayoActual.push(simulacion.getPosRayos()[pos+1]);	
				pos+=2;	
			}		
		}while(pos < simulacion.getStartingIndex()[i+1]*2);

		gl.useProgram(program);
		attributeSetFloats(gl,program, positionAttributeLocation,2,rayoActual);
		gl.uniform4f(colorLocation, 1, 0.85, 0, 1);

		// draw
		gl.drawArrays(gl.LINE_STRIP, 0, rayoActual.length/2);  // primitiveType ,offset ,count 
		
		//Vacia el array de su contenido
		rayoActual.splice(0, rayoActual.length);
	}


}


/* Funcion que utilizando un formulario AJAX envia datos a un PHP y recibe de este datos para finalmente devolverlos.
   Al ser asincrona la función se crea una promesa para llevar un orden en la función, su funcionalidad es similar a un semáforo o mutex.
   En los datos enviados al PHP se encuentra un identificador para que el php mediante un switch case pueda generar los datos del caso deseado
 */
function envioDatosCPP(opcion) {
	
	// Se crea una promesa para utilizarlo como semáforo y asi poder controlar el flujo de los datos y que no pase hasta que esten todos
    return new Promise(function(resolve, reject) {
		
		let posReacX, posReacY, radReac, absReac, colectoresL, colectoresR, puntoColectores, nPuntosC, reflecticidad, incidencia, nrayos, alfaMin, alfaMax, deltaAlfa;
		let lat, lon, alt;
		if(opcion === 2){
			
			lat = document.getElementById('muestraLatitud').innerText;
			lon = document.getElementById('muestraLongitud').innerText;
			alt = document.getElementById('muestraAltitud').innerText;
			
		}else{
			
			// Se recogen los datos de los cuadros de texto del html
			posReacX = document.getElementById('coreX').value;
			posReacY = document.getElementById('coreY').value;
			radReac = document.getElementById('radius').value;
			absReac = document.getElementById('absorcion').value;
			colectoresL = [];
			colectoresR = [];
			
			puntoColectores = [];
			nPuntosC = 0;
			
			
			reflecticidad = document.getElementById('reflecticidad').value;
			incidencia = document.getElementById('incidencia').value;
			nrayos = document.getElementById('nrayos').value;
			
			if (nrayos < 20){
				nrayos = 20;
			}

			alfaMin = document.getElementById('alfaMin').value;
			alfaMax = document.getElementById('alfaMax').value;
			deltaAlfa = document.getElementById('deltaAlfa').value;
		}
		let envio = "";
		
		// Dependiendo de la opción elegida se envian diferentes datos al PHP, si es 0 es generar una simulación mientras que si es 1 se busca la caracterización de los datos
		switch(opcion){
			
			case 0:
				envio += incidencia + " ";
				envio += nrayos + " ";
				envio += radReac + " ";
				envio += posReacX + " ";
				envio += posReacY + " ";		
				envio += absReac + " ";
				envio += colectoresSeleccionados.length + " ";
		
				for (let i=0; i < colectoresSeleccionados.length;i+=1){

					let c = colectorArray.find(colector => colector.name === colectoresSeleccionados[i]);				
					envio += reflectividadColectores[i] + " "; 
					
					// Si el colector tiene menos de 6 puntos se pintan todos, sino se pintan de 5 en 5. Esto ocurre por limitación en el envio de los datos al ser la cantidad de datos a enviar tan grande que falla.
					if(c.getPosColectorY().length < 6){
						
						envio += c.getPosColectorY().length + " ";
						
						for(let j=0; j < c.getPosColectorY().length; j+=1){

						envio += c.getPosColectorX()[j] + " ";
						envio += c.getPosColectorY()[j] + " ";
					}
						
					}else{
						
						envio += c.getPosColectorY().length / 5 + " ";
						
						for(let j=0; j < c.getPosColectorY().length; j+=5){

						envio += c.getPosColectorX()[j] + " ";
						envio += c.getPosColectorY()[j] + " ";
					}
						
					}
								
				}		


				// Se genera el ajax donde enviaremos los datos recogidos y esperaremos a la respuesta	
			$.ajax({
				type: "POST",
				url: "conexionCPP.php",
				data: { opcion : opcion,  envio : envio },
				dataType: "json",
				success: function(response) {
					
					// Si se ha obtenido respuesta significa que tenemos los datos por lo que resolvemos la promesa para liberar el semáforo
					resolve(response)
								
				},
				error: function(error) {
					console.error(error);
					// Manejar errores
					
					// Rechazar la promesa con el error
					reject(error);
				}
			});
			break;
			
			case 1:
					
				envio += alfaMin + " ";
				envio += alfaMax + " ";
				envio += deltaAlfa + " ";
				envio += nrayos + " ";
				envio += radReac + " ";
				envio += posReacX + " ";
				envio += posReacY + " ";		
				envio += absReac + " ";
				envio += colectoresSeleccionados.length + " ";
				
				for (let i=0; i < colectoresSeleccionados.length;i+=1){

					let c = colectorArray.find(colector => colector.name === colectoresSeleccionados[i]);				
					envio += reflectividadColectores[i]  + " "; 
					
					// Si el colector tiene menos de 6 puntos se pintan todos, sino se pintan de 5 en 5. Esto ocurre por limitación en el envio de los datos al ser la cantidad de datos a enviar tan grande que falla.
					if(c.getPosColectorY().length < 6){
						
						envio += c.getPosColectorY().length + " ";
						
						for(let j=0; j < c.getPosColectorY().length; j+=1){

						envio += c.getPosColectorX()[j] + " ";
						envio += c.getPosColectorY()[j] + " ";
					}
						
					}else{
						
						envio += c.getPosColectorY().length / 5 + " ";
						
						for(let j=0; j < c.getPosColectorY().length; j+=5){

						envio += c.getPosColectorX()[j] + " ";
						envio += c.getPosColectorY()[j] + " ";
					}
						
					}	
				}
				
					
					// Se genera el ajax donde enviaremos los datos recogidos y esperaremos a la respuesta	
			$.ajax({
				type: "POST",
				url: "conexionCPP.php",
				data: { opcion : opcion,  envio : envio },
				dataType: "json",
				success: function(response) {
					
					// Si se ha obtenido respuesta significa que tenemos los datos por lo que resolvemos la promesa para liberar el semáforo
					resolve(response)
								
				},
				error: function(error) {
					console.error(error);
					// Manejar errores
					
					// Rechazar la promesa con el error
					reject(error);
				}
			});
				
			break;	

			case 2:
				envio += lat + " ";
				envio += lon + " ";
				envio += alt + " ";
				
					
				let opcionGraf = elegirGrafico('comprobarGrafico2');

				//console.log("Grafico seleccionado : " + opcionGraf);

				let graficoSeleccionado = graficoArray.find(caracterizacion => caracterizacion.getName() === opcionGraf); 
				let dcf = graficoSeleccionado.getDCF();
				
				//console.log("Envio Calculadora: " + dcf.length);
			
				envio += dcf.length-1 + " ";
				
				for (let i=1; i < dcf.length; i+=1){
					envio += dcf[i] + " ";
				}
				
				let flujo = graficoSeleccionado.getDCF_q();
				
				for (let i=1; i < flujo.length; i+=1){
					envio += flujo[i] + " ";
				}
				
				
				//console.log("Envio Calculadora: " + envio);
				
			
					// Se genera el ajax donde enviaremos los datos recogidos y esperaremos a la respuesta	
			$.ajax({
				type: "POST",
				url: "conexionCPP.php",
				data: { opcion : opcion,  envio : envio},
				dataType: "json",
				success: function(response) {
					
					// Si se ha obtenido respuesta significa que tenemos los datos por lo que resolvemos la promesa para liberar el semáforo
					resolve(response)
								
				},
				error: function(error) {
					console.log(error);
					console.error(error);
					// Manejar errores
					
					// Rechazar la promesa con el error
					reject(error);
				}
			});
				
			break;
		}
		
				

		
			
		
	});
	
	
}


document.addEventListener('DOMContentLoaded', function () {
    
    let btnRead = document.getElementById('agregarColector');
	btnRead.addEventListener("click", agregarColector);
    
});


// Función para insertar un colector mediante un archivo de texto o csv. 
function agregarColector() {
	
	var fileInput = document.getElementById('fileInput');	

	
	if (fileInput.files.length > 0) {
		
		// Lee el archivo pasado y crea un FileReader para ir leyendo su contenido
		var file = fileInput.files[0];
		
		
		// Obtén la extensión del archivo o el tipo MIME
		var fileName = file.name;
		var fileExtension = fileName.split('.').pop().toLowerCase();
    
		// Comprueba que el archivo sea un .txt o .csv
		if (fileExtension !== 'txt' && fileExtension !== 'csv') {
			alert("Por favor, selecciona un archivo con formato .txt o .csv.");
        return;  // Salir de la función si el archivo no es válido
		}	
		
		
		var reader = new FileReader();

		reader.onload = function (e) {
			
			// Obtiene el contenido y divide entre ";" , "\r\n" y "\n" que serian los saltos de linea tanto en linux como en windows
			let contenido = e.target.result;
			let elementos = contenido.split(/[;\r?\n]+/);
			
			
			
			// Reemplaza las "," por "." 
			elementos = elementos.map(function (elemento) {
				return elemento.replace(/,/g, '.');
			});
			
			
			
			/*elementos = elementos.map(function (elemento) {
				return elemento.replace(/\n\r/, '');
			});*/

			
			// Se crean arrays para insertar las posiciones X e Y del colector
			let arrayX = [];
			let arrayY = [];

			for (let i = 0; i < elementos.length - 1; i++) {
			   
				
				switch(i % 2){
					case 0:
						arrayX.push(parseFloat(elementos[i]));
					break;
					case 1:
						arrayY.push(parseFloat(elementos[i]));
					break;
					default:
					break;
				}
			}
			
			// Se recoge el valor del nombre que se ha escrito en el cuadro de texto txtColectorName
			var colectorName = document.getElementById("txtColectorName");
			
			if (colectorName.value === "") {
				alert("Por favor, inserte un nombre al colector.");
			return;  
			}	

			// Se inserta el nuevo colector a las opciones disponibles 
			var select = document.getElementById('opciones');
			var opcionNueva = document.createElement('option');
			opcionNueva.text = colectorName.value;
			opcionNueva.value = colectorName.value;
			select.add(opcionNueva);
			select.selectedIndex = select.options.length - 1;
			
			
			// Se genera un nuevo colector y se añade al array de colectores
			var colectorNew = new Colector(colectorName.value,arrayX,arrayY);
			colectorArray.push(colectorNew);
			
			colectorName.value = "";
			
		};

		
		reader.readAsText(file);
	} else {
		alert("Por favor, selecciona un archivo.");
	}
       
};

document.addEventListener('DOMContentLoaded', function () {
    
    let btnRead = document.getElementById('seleccionarColector');
	btnRead.addEventListener("click", seleccionarColector);
    
});


//Funcion para seleccionar el colector entre las opciones disponibles, permite recoger multiples colectores con sus respectivas reflectividades
function seleccionarColector() {
	
	let colectorSeleccionado = elegirColector();	
	colectoresSeleccionados.push(colectorSeleccionado);
	reflectividadColectores.push(document.getElementById('reflecticidad').value);
	
	
	// La variable infoColectorSelec recoge los nombres de los colectores seleccionados para insertarlos en la etiqueta muestraColectores y asi poder obserbar los colectores que se han seleccionado
	let infoColectorSelec = "";
	
	for(let i = 0; i < colectoresSeleccionados.length; i += 1){
			
		if(i == colectoresSeleccionados.length - 1){
			infoColectorSelec = infoColectorSelec.concat(colectoresSeleccionados[i] + ".");
		}else{
			infoColectorSelec = infoColectorSelec.concat(colectoresSeleccionados[i] + ", ");
		}
	}

	
	document.getElementById("muestraColectores").innerText = infoColectorSelec;

}


document.addEventListener('DOMContentLoaded', function () {
    
    let btnRead = document.getElementById('eliminarColector');
	btnRead.addEventListener("click", eliminarColector);
    
});


// Funcion que limpia los arrays de los colectores seleccionados y sus reflectividades
function eliminarColector() {
	
	colectoresSeleccionados.splice(0, colectoresSeleccionados.length);
	reflectividadColectores.splice(0, reflectividadColectores.length);  
	
	document.getElementById("muestraColectores").innerText = "";

}


function dibujaSimulacion(gl,program,positionAttributeLocation,colorLocation,simulacion) {
	
	 // Pinta rayos
	  
	drawRays(gl,program,positionAttributeLocation,colorLocation,simulacion);
	  
	  // Pinta reactor

	drawReactor(gl,program,positionAttributeLocation,colorLocation,simulacion);

	  // Pinta colector
	  
	drawColector(gl,program,positionAttributeLocation,colorLocation,simulacion);
	
}
	
 

document.addEventListener("DOMContentLoaded", function() {
    var iniciarSimBtn = document.getElementById("iniciarSimBtn");
    iniciarSimBtn.addEventListener("click", function(event) {
			// Evitar que la página se recargue automáticamente
			event.preventDefault();
			
			// Llamar a la función enviarDatos
			iniciarSimulacion();
		});
}); 

document.getElementById("absorcion").addEventListener("change", function () {
            const minValue = parseFloat(this.min);
			const maxValue = parseFloat(this.max);
            const currentValue = parseFloat(this.value);

            // Si el valor actual es menor que el mínimo, ajusta al mínimo. En cambio si es mayor que el máximo, ajusta al máximo.
            if (currentValue < minValue) {
                this.value = minValue;
            }else if (currentValue > maxValue){
				this.value = maxValue;
			}
        });


document.getElementById("reflecticidad").addEventListener("change", function () {
            const minValue = parseFloat(this.min);
			const maxValue = parseFloat(this.max);
            const currentValue = parseFloat(this.value);

            // Si el valor actual es menor que el mínimo, ajusta al mínimo. En cambio si es mayor que el máximo, ajusta al máximo.
            if (currentValue < minValue) {
                this.value = minValue;
            }else if (currentValue > maxValue){
				this.value = maxValue;
			}
        });


document.getElementById("incidencia").addEventListener("change", function () {
            const minValue = parseFloat(this.min);
			const maxValue = parseFloat(this.max);
            const currentValue = parseFloat(this.value);

            // Si el valor actual es menor que el mínimo, ajusta al mínimo. En cambio si es mayor que el máximo, ajusta al máximo.
            if (currentValue < minValue) {
                this.value = minValue;
            }else if (currentValue > maxValue){
				this.value = maxValue;
			}
        });



document.getElementById("nrayos").addEventListener("change", function () {
            const minValue = parseFloat(this.min);
            const currentValue = parseFloat(this.value);

            // Si el valor actual es menor que el mínimo, ajustarlo al mínimo
            if (currentValue < minValue) {
                this.value = minValue;
            }
        });

document.addEventListener("DOMContentLoaded", function() {
    var iniciarCalBtn = document.getElementById("calcular");
    iniciarCalBtn.addEventListener("click", function(event) {
			// Evitar que la página se recargue automáticamente
			event.preventDefault();
			
			// Llamar a la función enviarDatos
			calculadora();
		});
}); 

// Generar una nueva simulación
async function iniciarSimulacion() {
	
	if(!colectoresSeleccionados.length > 0){
		alert("Por favor, selecciona al menos un colector.");
		return;
	}
	
	
	// Obtener un contexto WebGL2 
	let canvas = document.querySelector("#glcanvas");
	let gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}

	// Compilar los shaders y enlazarlos en un programa 
	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
	let program = createProgram(gl, vertexShader, fragmentShader);
	   
	// Decir que use el programa creado (el par de shaders)  
	gl.useProgram(program);  
	  
	// Busca dónde deben ir los datos del vértice.
	let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	  
	// Busca las ubicaciones de los uniformes
	let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	  
	// Busca las localización de los colores
	let colorLocation = gl.getUniformLocation(program, "u_color");
	  
	// Pasa la resolución del canvas para que podamos convertir desde píxeles a espacio de clip en el sombreador
	gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height); 
	  
  
	// Crear la simulación
	let simulacion = new Simulacion("Simulacion " + (simulacionArray.length+1));
	
	// Utilizacion de PHP
	let respuestaCPP = await envioDatosCPP(0);
	
	// Recogida de datos PHP
	let nRayos = respuestaCPP.nRayos;
	let startingIndex = respuestaCPP.startingIndex;
	let rayosCPPX = respuestaCPP.rayosX;
	let rayosCPPY = respuestaCPP.rayosY;
	
	// Se añaden nRayos y indice de inicio de rayos a la simulacion
	simulacion.setNRayos(nRayos); 
	simulacion.setStartingIndex(startingIndex); 
	
	//  Se calcula la distancia media de metros a pixel para posicionarlos en el canvas
	let widthMeters = getMaxOfArray(rayosCPPX) - getMinOfArray(rayosCPPX); // xMax - xMin | rayos[0] = X axis
	let heightMeters = getMaxOfArray(rayosCPPY) - getMinOfArray(rayosCPPY); //yMax - yMin | rayos[1] = Y axis
	  
	let widthPx = gl.canvas.width+0.0;
	let heightPx = gl.canvas.height+0.0;
		
	let proportionMeters = widthMeters / heightMeters; 
	let proportionPx = widthPx / heightPx;
	  
	var pxPerMeter = 0;
	  
	if(proportionPx >= proportionMeters){ 
		  //Limitamos por altura
		pxPerMeter = heightPx / heightMeters;
	}else{
		  //Limitamos por anchura
		pxPerMeter = widthPx / widthMeters;	  
	}
	  
	let xAverageMeters = (getMaxOfArray(rayosCPPX) + getMinOfArray(rayosCPPX))/2;
	let yAverageMeters = (getMaxOfArray(rayosCPPY) + getMinOfArray(rayosCPPY))/2;
	
	// Se añade las medias y el pixel por metro a la simulacion actual
	simulacion.setXAverageMeters(xAverageMeters);
	simulacion.setYAverageMeters(yAverageMeters);
	simulacion.setPxPerMeter(pxPerMeter);
	
	// Se generan las posiciones de los colectores seleccionados
	let posColector = [];
	
	for (let i=0; i < colectoresSeleccionados.length;i+=1){
		
		let c = colectorArray.find(colector => colector.name === colectoresSeleccionados[i]); 	
	
		posColector.push( createPositionBuffer( getPositionArrayPx(c.getPosColectorX(), widthPx, pxPerMeter, xAverageMeters), getPositionArrayPx(c.getPosColectorY(), heightPx, pxPerMeter, yAverageMeters) ) );	
	}
	

	// Se añade a la simulación las posiciones de los colectores y el número de colectores seleccionados	
	simulacion.setPosColector(posColector);
	simulacion.setNColec(colectoresSeleccionados.length);

	
	// Se genera y añade el reactor a la simulación	
	simulacion.setReactor(creaReactor(gl,simulacion));
	  
	// Se añade a la simulación las posiciones de los rayos	 	  	  
	let posPxRayosX = getPositionArrayPx(rayosCPPX, widthPx, pxPerMeter, xAverageMeters);
	let posPxRayosY = getPositionArrayPx(rayosCPPY, heightPx, pxPerMeter, yAverageMeters);	  
	let posRayos = createPositionBuffer(posPxRayosX,posPxRayosY);	  
	simulacion.setPosRayos(posRayos); 
	
	// Se añade a la lista de simulaciones la simulación creada y a las opciones para elegir la simulación a comprobar	
	simulacionArray.push(simulacion);
		
	let selectSim = document.getElementById('opcionesSim');
	let opcionSimNueva = document.createElement('option');	
	opcionSimNueva.text = simulacion.getName();
	opcionSimNueva.value = simulacion.getName();	
	selectSim.add(opcionSimNueva);
	selectSim.selectedIndex = selectSim.options.length - 1;
	
	 
	// Se dibuja la simulación generada

	dibujaSimulacion(gl,program,positionAttributeLocation,colorLocation,simulacion)
	
}





document.addEventListener("DOMContentLoaded", function() {
    var comprobarSim = document.getElementById("comprobarSimulacion");
    comprobarSim.addEventListener("click", function(event) {
		
			// Evitar que la página se recargue automáticamente
			event.preventDefault();
			
			// Llamar a la función enviarDatos
			comprobarSimulacion();
		});
});

function comprobarSimulacion() {
	
	// Obtener un contexto WebGL2 
	let canvas = document.querySelector("#glcanvas");
	let gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}

	// Compilar los shaders y enlazarlos en un programa 
	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
	let program = createProgram(gl, vertexShader, fragmentShader);
	   
	// Decir que use el programa creado (el par de shaders)  
	gl.useProgram(program);  
	  
	// Busca dónde deben ir los datos del vértice.
	let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	  
	// Busca las ubicaciones de los uniformes
	let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	  
	// Busca las localización de los colores
	let colorLocation = gl.getUniformLocation(program, "u_color");
	  
	// Pasa la resolución del canvas para que podamos convertir desde píxeles a espacio de clip en el sombreador
	gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height); 
	
	
	// Recoge la opcion seleccionada y la busca dentro del array de simulaciones
	let opcionSim = elegirSimulacion();	
	let simulacionSeleccionada = simulacionArray.find(simulacion => simulacion.name === opcionSim);  
	
	//console.log("Simulacion seleccionada : " + simulacionSeleccionada.getNRayos());
	
	dibujaSimulacion(gl,program,positionAttributeLocation,colorLocation,simulacionSeleccionada);


}

var simulacionArray = []; // Variable que almacena las diferentes simulaciones creadas para recogerlas
var colectoresSeleccionados = []; // Variable que almacena los colectores que se van a usar para simular o caracterizar
var colectorArray = []; // Variable que almacena todos los colectores creados
var graf; // Variable para almacenar la instancia del grafico 
var reflectividadColectores = []; // Variable que almacena las reflectividades de los colectores que se van a usar para simular o caracterizar
var graficoArray = []; // Variable para almacenar los datos de los graficos 
var datosActuales = []; // Variable para almacenar los datos del grafico que se utilizará para mapear y para generar un CSV

  

var posColectorX = [-0.0408407, -0.04083915, -0.04083451, -0.04082679, -0.04081601, -0.04080219, -0.04078536, -0.04076552, -0.04074269, -0.0407169, -0.04068817, -0.04065651, -0.04062195, -0.04058449, -0.04054417, -0.04050101, -0.04045502, -0.04040622, -0.04035464, -0.0403003, -0.04024321, -0.0401834, -0.0401209, -0.04005571, -0.03998787, -0.0399174, -0.03984432, -0.03976864, -0.0396904, -0.03960962, -0.03952631, -0.03944051, -0.03935224, -0.03926151, -0.03916835, -0.0390728, -0.03897486, -0.03887456, -0.03877193, -0.038667, -0.03855978, -0.0384503, -0.03833859, -0.03822467, -0.03810856, -0.03799029, 
-0.03786989, -0.03774737, -0.03762277, -0.03749611, -0.03736742, -0.03723672, -0.03710403, -0.03696939, -0.03683281, -0.03669433, -0.03655397, -0.03641175, -0.03626771, -0.03612186, -0.03597424, -0.03582487, -0.03567377, -0.03552098, -0.03536652, -0.03521041, -0.03505269, -0.03489338, -0.0347325, -0.03457008, -0.03440615, -0.03424074, -0.03407387, -0.03390557, -0.03373586, -0.03356478, -0.03339234, -0.03321858, -0.03304353, -0.0328672, -0.03268963, -0.03251085, -0.03233087, -0.03214973, -0.03196746, -0.03178407, -0.03159961, -0.03141408, -0.03122753, -0.03103997, -0.03085144, -0.03066196, -0.03047156, -0.03028026, -0.03008809, -0.02989507, -0.02970124, -0.02950662, -0.02931124, -0.02911512, -0.02891828, -0.02872076, -0.02852258, -0.02832377, -0.02812435, -0.02792435, -0.02772379, -0.02752271, -0.02732112, -0.02711905, -0.02691652, -0.02671357, -0.02651022, -0.02630649, 
-0.0261024, -0.02589799, -0.02569328, -0.02548829, -0.02528305, -0.02507757, -0.0248719, -0.02466604, -0.02446003, -0.02425389, -0.02404765, -0.02384131, -0.02363492, -0.0234285, -0.02322206, -0.02301563, -0.02280924, -0.02260291, -0.02239665, -0.0221905, -0.02198447, -0.0217786, -0.02157289, 
-0.02136738, -0.02116208, -0.02095702, -0.02075221, -0.02054769, -0.02034347, -0.02013957, -0.01993602, -0.01973283, -0.01953002, -0.01932763, -0.01912566, -0.01892413, -0.01872307, -0.0185225, -0.01832244, -0.0181229, -0.01792391, -0.01772548, -0.01752763, -0.01733039, -0.01713377, -0.01693778, -0.01674245, -0.0165478, -0.01635384, -0.01616059, -0.01596807, -0.01577629, -0.01558527, -0.01539504, -0.01520559, -0.01501696, -0.01482916, -0.0146422, -0.01445609, -0.01427087, -0.01408653, -0.01390309, -0.01372058, -0.013539, -0.01335836, -0.01317869, -0.013, -0.0128223, -0.0126456, -0.01246991, -0.01229526, -0.01212165, -0.01194909, -0.0117776, -0.01160719, -0.01143787, -0.01126966, -0.01110255, -0.01093658, -0.01077174, -0.01060804, -0.01044551, -0.01028414, -0.01012395, -0.00996495, -0.00980714, -0.00965054, -0.00949515, -0.00934099, -0.00918806, -0.00903637, -0.00888593, -0.00873675, -0.00858883, -0.00844218, -0.00829681, -0.00815272, -0.00800993, -0.00786843, -0.00772824, -0.00758936, -0.00745179, -0.00731555, -0.00718063, -0.00704704, -0.00691478, -0.00678387, -0.0066543, -0.00652608, -0.00639921, -0.00627369, -0.00614954, -0.00602674, -0.00590531, -0.00578524, -0.00566654, -0.00554921, -0.00543326, -0.00531867, -0.00520547, -0.00509363, -0.00498318, -0.0048741, -0.00476639, -0.00466007, -0.00455512, 
-0.00445155, -0.00434935, -0.00424853, -0.00414908, -0.004051, -0.0039543, -0.00385896, -0.00376499, -0.00367239, -0.00358114, -0.00349126, -0.00340273, -0.00331555, -0.00322973, -0.00314524, -0.00306211, -0.0029803, -0.00289984, -0.0028207, -0.00274288, -0.00266638, -0.0025912, -0.00251733, -0.00244475, -0.00237348, -0.00230349, -0.00223479, -0.00216737, -0.00210122, -0.00203633, -0.0019727, -0.00191032, -0.00184919, -0.00178928, -0.00173061, -0.00167315, -0.0016169, -0.00156186, -0.001508, -0.00145533, -0.00140384, -0.00135351, -0.00130434, -0.00125632, -0.00120943, -0.00116367, 
-0.00111902, -0.00107549, -0.00103304, -0.00099169, -0.0009514, -0.00091218, -0.00087402, -0.00083689, -0.00080079, -0.00076571, -0.00073164, -0.00069856, -0.00066646, -0.00063533, -0.00060515, -0.00057592, -0.00054762, -0.00052024, -0.00049377, -0.00046818, -0.00044348, -0.00041964, -0.00039665, -0.0003745, -0.00035317, -0.00033265, -0.00031293, -0.00029399, -0.00027582, -0.0002584, -0.00024172, -0.00022576, -0.00021051, -0.00019595, -0.00018207, -0.00016886, -0.00015629, -0.00014436, -0.00013304, -0.00012232, -0.00011219, -0.00010264, -9.3632e-05, -8.5166e-05, -7.7223e-05, -6.9787e-05, -6.2841e-05, -5.6369e-05, -5.0355e-05, -4.4783e-05, -3.9636e-05, -3.4898e-05, -3.0551e-05, -2.658e-05, -2.2968e-05, -1.9698e-05, -1.6754e-05, -1.4117e-05, -1.1773e-05, -9.7e-06, -7.89e-06, -6.32e-06, -4.97e-06, -3.83e-06, -2.88e-06, -2.1e-06, -1.47e-06, -9.87e-07, -6.22e-07, -3.6e-07, -1.84e-07, -7.78e-08, -2.3e-08, -2.88e-09, 0.0, 2.88e-09, 2.3e-08, 7.78e-08, 1.84e-07, 3.6e-07, 6.22e-07, 9.87e-07, 1.47e-06, 2.1e-06, 2.88e-06, 3.83e-06, 4.97e-06, 6.32e-06, 7.89e-06, 9.7e-06, 1.1773e-05, 1.4117e-05, 1.6754e-05, 1.9698e-05, 2.2968e-05, 2.658e-05, 3.0551e-05, 3.4898e-05, 3.9636e-05, 4.4783e-05, 5.0355e-05, 5.6369e-05, 6.2841e-05, 6.9787e-05, 7.7223e-05, 8.5166e-05, 9.3632e-05, 0.00010264, 0.00011219, 0.00012232, 0.00013304, 0.00014436, 0.00015629, 0.00016886, 0.00018207, 0.00019595, 0.00021051, 0.00022576, 0.00024172, 0.0002584, 0.00027582, 0.00029399, 0.00031293, 0.00033265, 0.00035317, 0.0003745, 0.00039665, 0.00041964, 0.00044348, 0.00046818, 0.00049377, 0.00052024, 0.00054762, 0.00057592, 0.00060515, 0.00063533, 0.00066646, 0.00069856, 0.00073164, 0.00076571, 0.00080079, 0.00083689, 0.00087402, 0.00091218, 0.0009514, 0.00099169, 0.00103304, 0.00107549, 0.00111902, 0.00116367, 0.00120943, 0.00125632, 0.00130434, 0.00135351, 0.00140384, 0.00145533, 0.001508, 0.00156186, 0.0016169, 0.00167315, 0.00173061, 0.00178928, 0.00184919, 0.00191032, 0.0019727, 0.00203633, 0.00210122, 0.00216737, 0.00223479, 0.00230349, 0.00237348, 0.00244475, 0.00251733, 0.0025912, 0.00266638, 0.00274288, 0.0028207, 0.00289984, 0.0029803, 0.00306211, 0.00314524, 0.00322973, 0.00331555, 0.00340273, 0.00349126, 0.00358114, 0.00367239, 0.00376499, 0.00385896, 0.0039543, 0.004051, 0.00414908, 0.00424853, 0.00434935, 0.00445155, 0.00455512, 0.00466007, 0.00476639, 0.0048741, 0.00498318, 0.00509363, 0.00520547, 0.00531867, 0.00543326, 0.00554921, 0.00566654, 0.00578524, 0.00590531, 0.00602674, 0.00614954, 0.00627369, 0.00639921, 0.00652608, 0.0066543, 0.00678387, 0.00691478, 0.00704704, 0.00718063, 0.00731555, 0.00745179, 0.00758936, 0.00772824, 0.00786843, 0.00800993, 0.00815272, 0.00829681, 0.00844218, 0.00858883, 0.00873675, 0.00888593, 0.00903637, 0.00918806, 0.00934099, 0.00949515, 0.00965054, 0.00980714, 0.00996495, 0.01012395, 0.01028414, 0.01044551, 0.01060804, 0.01077174, 0.01093658, 0.01110255, 0.01126966, 0.01143787, 0.01160719, 0.0117776, 0.01194909, 0.01212165, 0.01229526, 0.01246991, 0.0126456, 0.0128223, 0.013, 0.01317869, 0.01335836, 0.013539, 0.01372058, 0.01390309, 0.01408653, 0.01427087, 0.01445609, 0.0146422, 0.01482916, 0.01501696, 0.01520559, 0.01539504, 0.01558527, 0.01577629, 0.01596807, 0.01616059, 0.01635384, 0.0165478, 0.01674245, 0.01693778, 0.01713377, 0.01733039, 0.01752763, 0.01772548, 0.01792391, 0.0181229, 0.01832244, 0.0185225, 0.01872307, 0.01892413, 0.01912566, 0.01932763, 0.01953002, 0.01973283, 0.01993602, 0.02013957, 0.02034347, 0.02054769, 0.02075221, 0.02095702, 0.02116208, 0.02136738, 0.02157289, 0.0217786, 0.02198447, 0.0221905, 0.02239665, 0.02260291, 0.02280924, 0.02301563, 0.02322206, 0.0234285, 0.02363492, 0.02384131, 0.02404765, 0.02425389, 0.02446003, 0.02466604, 0.0248719, 0.02507757, 0.02528305, 0.02548829, 0.02569328, 0.02589799, 0.0261024, 0.02630649, 0.02651022, 0.02671357, 0.02691652, 0.02711905, 0.02732112, 0.02752271, 0.02772379, 0.02792435, 0.02812435, 0.02832377, 0.02852258, 0.02872076, 0.02891828, 0.02911512, 0.02931124, 0.02950662, 0.02970124, 0.02989507, 0.03008809, 0.03028026, 0.03047156, 0.03066196, 0.03085144, 0.03103997, 0.03122753, 0.03141408, 0.03159961, 0.03178407, 0.03196746, 0.03214973, 0.03233087, 0.03251085, 0.03268963, 0.0328672, 0.03304353, 0.03321858, 0.03339234, 0.03356478, 0.03373586, 0.03390557, 0.03407387, 0.03424074, 0.03440615, 0.03457008, 0.0347325, 0.03489338, 0.03505269, 0.03521041, 0.03536652, 
0.03552098, 0.03567377, 0.03582487, 0.03597424, 0.03612186, 0.03626771, 0.03641175, 0.03655397, 0.03669433, 0.03683281, 0.03696939, 0.03710403, 0.03723672, 0.03736742, 0.03749611, 0.03762277, 0.03774737, 0.03786989, 0.03799029, 0.03810856, 0.03822467, 0.03833859, 0.0384503, 0.03855978, 0.038667, 0.03877193, 0.03887456, 0.03897486, 0.0390728, 0.03916835, 0.03926151, 0.03935224, 0.03944051, 0.03952631, 0.03960962, 0.0396904, 0.03976864, 0.03984432, 0.0399174, 0.03998787, 0.04005571, 0.0401209, 0.0401834, 0.04024321, 0.0403003, 0.04035464, 0.04040622, 0.04045502, 0.04050101, 0.04054417, 0.04058449, 0.04062195, 0.04065651, 0.04068817, 0.0407169, 0.04074269, 0.04076552, 0.04078536, 0.04080219, 0.04081601, 0.04082679, 0.04083451, 0.04083915, 0.0408407
];

var posColectorY = [0.013, 0.0126441, 0.01228921, 0.01193537, 0.0115826, 0.01123092, 0.01088037, 0.01053097, 0.01018274, 0.00983571, 0.0094899, 0.00914535, 0.00880207, 0.00846009, 0.00811943, 0.00778012, 0.00744218, 0.00710563, 0.0067705, 0.00643681, 0.00610458, 0.00577384, 0.0054446, 0.0051169, 0.00479074, 0.00446616, 0.00414317, 0.00382179, 0.00350205, 0.00318396, 0.00286755, 0.00255283, 0.00223982, 0.00192855, 0.00161903, 0.00131127, 0.00100531, 0.00070115, 0.00039882, 9.833e-05, -0.0002003, -0.00049706, -0.00079192, -0.00108488, -0.00137591, -0.00166499, -0.00195213, -0.00223729, -0.00252047, -0.00280164, -0.0030808, -0.00335793, -0.00363302, -0.00390605, -0.00417701, -0.00444589, -0.00471268, -0.00497736, -0.00523992, -0.00550034, -0.00575863, -0.00601476, -0.00626873, -0.00652053, -0.00677014, -0.00701755, -0.00726276, -0.00750576, -0.00774653, -0.00798507, -0.00822138, -0.00845543, -0.00868723, -0.00891677, -0.00914403, -0.00936902, -0.00959172, -0.00981213, -0.01003025, -0.01024606, -0.01045957, -0.01067076, -0.01087963, -0.01108618, -0.0112904, -0.0114923, -0.01169185, -0.01188907, -0.01208395, -0.01227648, -0.01246667, -0.0126545, -0.01283999, -0.01302312, -0.01320389, -0.01338231, -0.01355838, -0.01373208, -0.01390343, -0.01407242, -0.01423906, -0.01440333, -0.01456525, -0.01472482, -0.01488203, -0.01503689, -0.0151894, -0.01533955, -0.01548737, -0.01563284, -0.01577597, -0.01591676, -0.01605522, -0.01619135, -0.01632516, -0.01645664, -0.0165858, -0.01671266, -0.0168372, -0.01695944, -0.01707939, -0.01719705, -0.01731242, -0.01742551, -0.01753634, -0.01764489, -0.01775119, -0.01785524, -0.01795704, -0.01805661, -0.01815395, -0.01824908, -0.01834199, -0.0184327, -0.01852121, -0.01860755, -0.0186917, -0.0187737, -0.01885353, -0.01893123, -0.01900678, -0.01908021, -0.01915153, -0.01922075, -0.01928787, -0.01935291, -0.01941589, -0.0194768, -0.01953567, -0.01959251, -0.01964732, -0.01970013, -0.01975094, -0.01979977, -0.01984662, -0.01989153, -0.01993448, -0.01997551, -0.02001462, -0.02005183, -0.02008715, -0.0201206, -0.02015219, -0.02018193, -0.02020985, -0.02023595, -0.02026025, -0.02028277, -0.02030352, -0.02032251, -0.02033977, -0.02035531, -0.02036914, -0.02038128, -0.02039174, -0.02040056, -0.02040773, -0.02041328, -0.02041722, -0.02041957, -0.02042035, -0.02041958, -0.02041727, -0.02041343, -0.0204081, -0.02040128, -0.02039299, -0.02038325, -0.02037208, -0.0203595, -0.02034552, -0.02033017, -0.02031346, -0.02029541, -0.02027603, -0.02025536, -0.0202334, -0.02021017, -0.0201857, -0.02016, -0.02013309, -0.02010499, -0.02007572, -0.02004531, -0.02001375, -0.01998109, -0.01994734, -0.01991251, -0.01987662, 
-0.0198397, -0.01980177, -0.01976284, -0.01972293, -0.01968207, -0.01964027, -0.01959756, -0.01955395, -0.01950946, -0.01946411, -0.01941793, -0.01937093, -0.01932313, -0.01927455, -0.01922521, -0.01917514, -0.01912434, -0.01907285, -0.01902068, -0.01896785, -0.01891438, -0.01886029, -0.01880561, -0.01875034, -0.01869451, -0.01863814, -0.01858126, -0.01852387, -0.018466, -0.01840766, -0.01834889, -0.0182897, -0.0182301, -0.01817012, -0.01810977, -0.01804908, -0.01798806, -0.01792674, -0.01786513, -0.01780326, -0.01774113, -0.01767878, -0.01761621, -0.01755346, -0.01749053, -0.01742744, -0.01736422, -0.01730089, -0.01723745, -0.01717394, -0.01711036, -0.01704674, -0.01698309, -0.01691944, -0.01685579, -0.01679218, -0.01672861, -0.01666511, -0.01660168, -0.01653836, -0.01647515, -0.01641207, -0.01634915, -0.01628639, -0.01622381, -0.01616144, -0.01609928, -0.01603736, -0.01597569, -0.01591428, -0.01585316, -0.01579233, -0.01573182, -0.01567164, -0.0156118, -0.01555233, -0.01549323, -0.01543452, -0.01537622, -0.01531833, -0.01526089, -0.01520389, -0.01514736, -0.0150913, -0.01503574, -0.01498068, -0.01492614, -0.01487214, -0.01481868, -0.01476579, -0.01471346, 
-0.01466172, -0.01461058, -0.01456005, -0.01451014, -0.01446087, -0.01441225, -0.01436428, -0.01431698, -0.01427037, -0.01422445, -0.01417923, -0.01413472, -0.01409095, -0.0140479, -0.01400561, -0.01396407, -0.01392329, -0.01388329, -0.01384408, -0.01380566, -0.01376804, -0.01373124, -0.01369525, -0.0136601, -0.01362578, -0.01359231, -0.01355969, -0.01352793, -0.01349704, -0.01346703, -0.0134379, -0.01340966, -0.01338231, -0.01335586, -0.01333033, -0.01330571, -0.013282, -0.01325923, -0.01323738, -0.01321647, -0.0131965, -0.01317747, -0.01315939, -0.01314227, -0.0131261, -0.0131109, -0.01309666, -0.01308339, -0.01307109, -0.01305976, -0.01304941, -0.01304003, -0.01303164, -0.01302423, -0.01301781, -0.01301237, -0.01300792, -0.01300445, -0.01300198, -0.01300049, -0.013, -0.01300049, -0.01300198, -0.01300445, -0.01300792, -0.01301237, -0.01301781, -0.01302423, -0.01303164, -0.01304003, -0.01304941, -0.01305976, -0.01307109, -0.01308339, -0.01309666, -0.0131109, -0.0131261, -0.01314227, -0.01315939, -0.01317747, -0.0131965, -0.01321647, -0.01323738, -0.01325923, -0.013282, -0.01330571, -0.01333033, -0.01335586, -0.01338231, -0.01340966, -0.0134379, -0.01346703, -0.01349704, -0.01352793, -0.01355969, -0.01359231, -0.01362578, -0.0136601, -0.01369525, -0.01373124, -0.01376804, -0.01380566, -0.01384408, -0.01388329, -0.01392329, -0.01396407, -0.01400561, -0.0140479, -0.01409095, -0.01413472, -0.01417923, -0.01422445, -0.01427037, -0.01431698, -0.01436428, -0.01441225, -0.01446087, -0.01451014, -0.01456005, -0.01461058, -0.01466172, -0.01471346, -0.01476579, -0.01481868, -0.01487214, -0.01492614, 
-0.01498068, -0.01503574, -0.0150913, -0.01514736, -0.01520389, -0.01526089, -0.01531833, -0.01537622, -0.01543452, -0.01549323, -0.01555233, -0.0156118, -0.01567164, -0.01573182, -0.01579233, -0.01585316, -0.01591428, -0.01597569, -0.01603736, -0.01609928, -0.01616144, -0.01622381, -0.01628639, -0.01634915, -0.01641207, -0.01647515, -0.01653836, -0.01660168, -0.01666511, -0.01672861, -0.01679218, -0.01685579, -0.01691944, -0.01698309, -0.01704674, -0.01711036, -0.01717394, -0.01723745, -0.01730089, -0.01736422, -0.01742744, -0.01749053, -0.01755346, -0.01761621, -0.01767878, -0.01774113, -0.01780326, -0.01786513, -0.01792674, -0.01798806, -0.01804908, -0.01810977, -0.01817012, -0.0182301, -0.0182897, -0.01834889, -0.01840766, -0.018466, -0.01852387, -0.01858126, -0.01863814, -0.01869451, -0.01875034, -0.01880561, -0.01886029, -0.01891438, -0.01896785, -0.01902068, -0.01907285, -0.01912434, -0.01917514, -0.01922521, -0.01927455, -0.01932313, -0.01937093, -0.01941793, -0.01946411, -0.01950946, -0.01955395, -0.01959756, -0.01964027, -0.01968207, -0.01972293, -0.01976284, -0.01980177, -0.0198397, -0.01987662, -0.01991251, -0.01994734, -0.01998109, -0.02001375, 
-0.02004531, -0.02007572, -0.02010499, -0.02013309, -0.02016, -0.0201857, -0.02021017, -0.0202334, -0.02025536, -0.02027603, -0.02029541, -0.02031346, -0.02033017, -0.02034552, -0.0203595, -0.02037208, -0.02038325, -0.02039299, -0.02040128, -0.0204081, -0.02041343, -0.02041727, -0.02041958, -0.02042035, -0.02041957, -0.02041722, -0.02041328, -0.02040773, -0.02040056, -0.02039174, -0.02038128, -0.02036914, -0.02035531, -0.02033977, -0.02032251, -0.02030352, -0.02028277, -0.02026025, -0.02023595, -0.02020985, -0.02018193, -0.02015219, -0.0201206, -0.02008715, -0.02005183, -0.02001462, -0.01997551, -0.01993448, -0.01989153, -0.01984662, -0.01979977, -0.01975094, -0.01970013, -0.01964732, -0.01959251, -0.01953567, -0.0194768, -0.01941589, -0.01935291, -0.01928787, -0.01922075, -0.01915153, -0.01908021, -0.01900678, -0.01893123, -0.01885353, -0.0187737, -0.0186917, -0.01860755, -0.01852121, -0.0184327, -0.01834199, -0.01824908, -0.01815395, -0.01805661, -0.01795704, -0.01785524, -0.01775119, -0.01764489, -0.01753634, -0.01742551, -0.01731242, -0.01719705, -0.01707939, -0.01695944, -0.0168372, -0.01671266, -0.0165858, -0.01645664, -0.01632516, -0.01619135, -0.01605522, -0.01591676, -0.01577597, -0.01563284, -0.01548737, -0.01533955, -0.0151894, -0.01503689, -0.01488203, -0.01472482, -0.01456525, -0.01440333, -0.01423906, -0.01407242, -0.01390343, -0.01373208, -0.01355838, -0.01338231, -0.01320389, -0.01302312, -0.01283999, -0.0126545, -0.01246667, -0.01227648, -0.01208395, -0.01188907, -0.01169185, -0.0114923, -0.0112904, -0.01108618, -0.01087963, -0.01067076, -0.01045957, -0.01024606, -0.01003025, -0.00981213, -0.00959172, -0.00936902, -0.00914403, -0.00891677, -0.00868723, -0.00845543, -0.00822138, -0.00798507, -0.00774653, -0.00750576, -0.00726276, -0.00701755, -0.00677014, -0.00652053, -0.00626873, -0.00601476, -0.00575863, -0.00550034, -0.00523992, -0.00497736, -0.00471268, -0.00444589, -0.00417701, -0.00390605, -0.00363302, -0.00335793, -0.0030808, -0.00280164, -0.00252047, -0.00223729, -0.00195213, -0.00166499, -0.00137591, -0.00108488, -0.00079192, -0.00049706, -0.0002003, 9.833e-05, 0.00039882, 0.00070115, 0.00100531, 0.00131127, 0.00161903, 0.00192855, 0.00223982, 0.00255283, 0.00286755, 0.00318396, 0.00350205, 0.00382179, 0.00414317, 0.00446616, 0.00479074, 0.0051169, 0.0054446, 0.00577384, 0.00610458, 0.00643681, 0.0067705, 0.00710563, 0.00744218, 0.00778012, 0.00811943, 0.00846009, 0.00880207, 0.00914535, 0.0094899, 0.00983571, 0.01018274, 0.01053097, 0.01088037, 0.01123092, 0.0115826, 0.01193537, 0.01228921, 0.0126441, 0.013
];

var incidenciaPred = ['Incidencia',0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89];
var DCFPred = ['DCF',2.795902,2.809045,2.802412,2.816475,2.783998,2.798259,2.781079,2.775563,2.79003,2.787151,2.774038,2.786231,2.773073,2.77791,2.762173,2.740201,2.735315,2.706105,2.718187,2.711817,2.681505,2.655303,2.640731,2.632533,2.622334,2.607533,2.580151,2.563197,2.541192,2.505613,2.513894,2.485144,2.455785,2.432949,2.43167,2.399421,2.38686,2.351175,2.315705,2.273698,2.254476,2.204192,2.175341,2.136785,2.084136,2.048952,2.028236,1.965766,1.947149,1.880892,1.856522,1.817818,1.806211,1.748804,1.74693,1.728391,1.713191,1.697072,1.671235,1.641888,1.604153,1.574281,1.534322,1.489239,1.442696,1.382892,1.335439,1.2823,1.227533,1.154312,1.10533,1.037788,0.97638,0.922794,0.863872,0.804016,0.731994,0.66913,0.60593,0.544849,0.489754,0.425163,0.370559,0.31088,0.260859,0.214354,0.164839,0.122205,0.083322,0.049279];
var DCF_qPred = ['DFC_q',0.893027,0.881868,0.875444,0.873817,0.858354,0.862454,0.849156,0.852729,0.842127,0.833813,0.836655,0.826278,0.825354,0.822888,0.811677,0.817032,0.803186,0.799302,0.805021,0.792331,0.79396,0.786265,0.78172,0.774025,0.76957,0.77488,0.76318,0.759085,0.755535,0.752295,0.752745,0.7396,0.73555,0.72795,0.72795,0.7284,0.7158,0.71585,0.7073,0.6992,0.70375,0.6862,0.6871,0.6831,0.67455,0.6755,0.6625,0.6499,0.65985,0.6378,0.6473,0.6302,0.6352,0.6231,0.61955,0.615,0.602,0.5975,0.5925,0.5785,0.573,0.5595,0.5545,0.5495,0.5355,0.525,0.5065,0.5015,0.492,0.4685,0.473,0.4495,0.4395,0.43,0.4115,0.406,0.378,0.3635,0.349,0.326,0.3205,0.283,0.2685,0.2445,0.2165,0.2065,0.16,0.1405,0.107,0.065];


// Inicio predeterminado de la interfaz gráfica
async function iniciacionAplicacion() {
	
	// Obtener un contexto WebGL2 
	let canvas = document.querySelector("#glcanvas");
	let gl = canvas.getContext("webgl2");
	if (!gl) {
		return;
	}

	// Compilar los shaders y enlazarlos en un programa 
	let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
	let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
	let program = createProgram(gl, vertexShader, fragmentShader);
	   
	// Decir que use el programa creado (el par de shaders)  
	gl.useProgram(program);  
	  
	// Busca dónde deben ir los datos del vértice.
	let positionAttributeLocation = gl.getAttribLocation(program, "a_position");
	  
	// Busca las ubicaciones de los uniformes
	let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
	  
	// Busca las localización de los colores
	let colorLocation = gl.getUniformLocation(program, "u_color");
	  
	// Pasa la resolución del canvas para que podamos convertir desde píxeles a espacio de clip en el sombreador
	gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height); 
	  
	// Crear la simulación
  
	let simulacion = new Simulacion("Simulacion " + (simulacionArray.length+1));
	
  
	// Añadir una nueva opcion de colectores
	var colectorPred = new Colector("Predeterminado",posColectorX,posColectorY); 
	colectorArray.push(colectorPred);
   
	let select = document.getElementById('opciones');
	let opcionNueva = document.createElement('option');
	opcionNueva.text = colectorArray[0].getName();
	opcionNueva.value = colectorArray[0].getName();
	select.add(opcionNueva);
     
	colectoresSeleccionados.push("Predeterminado");
	reflectividadColectores.push(document.getElementById('reflecticidad').value);
  
	// Utilizacion de PHP 
	let respuestaCPP = await envioDatosCPP(0);

	// Recogida de datos PHP	  
	let nRayos = respuestaCPP.nRayos;
	let startingIndex = respuestaCPP.startingIndex;
	let rayosCPPX = respuestaCPP.rayosX;
	let rayosCPPY = respuestaCPP.rayosY;


	// Se añaden nRayos y indice de inicio de rayos a la simulacion
	simulacion.setNRayos(nRayos); 
	simulacion.setStartingIndex(startingIndex); 	  

	// Se calcula la distancia media de metros a pixel para posicionarlos en el canvas	
	let widthMeters = getMaxOfArray(rayosCPPX) - getMinOfArray(rayosCPPX); // xMax - xMin | rayosX = eje X 
	let heightMeters = getMaxOfArray(rayosCPPY) - getMinOfArray(rayosCPPY); //yMax - yMin | rayosY = eje Y 
	  
	let widthPx = gl.canvas.width+0.0;
	let heightPx = gl.canvas.height+0.0;
		
	let proportionMeters = widthMeters / heightMeters; 
	let proportionPx = widthPx / heightPx;
	  
	let pxPerMeter = 0;
	  	  
	if(proportionPx >= proportionMeters){ 	
		  //Limitamos por altura
		pxPerMeter = heightPx / heightMeters;
		
	}else{		
		  //Limitamos por anchura
		pxPerMeter = widthPx / widthMeters;	  
	}
	  
	let xAverageMeters = (getMaxOfArray(rayosCPPX) + getMinOfArray(rayosCPPX))/2;
	let yAverageMeters = (getMaxOfArray(rayosCPPY) + getMinOfArray(rayosCPPY))/2;
	  
	// Se añade las medias y el pixel por metro a la simulacion actual
	simulacion.setXAverageMeters(xAverageMeters);
	simulacion.setYAverageMeters(yAverageMeters);
	simulacion.setPxPerMeter(pxPerMeter);
		

	 // Se generan las posiciones de los colectores seleccionados
	let posColector = [];

	for (let i=0; i < colectoresSeleccionados.length;i+=1){
		
		let c = colectorArray.find(colector => colector.name === colectoresSeleccionados[i]); 	
		
		posColector.push( createPositionBuffer( getPositionArrayPx(c.getPosColectorX(), widthPx, pxPerMeter, xAverageMeters), getPositionArrayPx(c.getPosColectorY(), heightPx, pxPerMeter, yAverageMeters) ) );	

	}

	// Se añade a la simulación las posiciones de los colectores y el número de colectores seleccionados	  
	simulacion.setPosColector(posColector);
	simulacion.setNColec(colectoresSeleccionados.length);
	
	
	// Se genera y añade el reactor a la simulación
	simulacion.setReactor(creaReactor(gl,simulacion));
	  
	// Se añade a la simulación las posiciones de los rayos		
	let posPxRayosX = getPositionArrayPx(rayosCPPX, widthPx, pxPerMeter, xAverageMeters);
	let posPxRayosY = getPositionArrayPx(rayosCPPY, heightPx, pxPerMeter, yAverageMeters);  
	let posRayos = createPositionBuffer(posPxRayosX,posPxRayosY);  
	simulacion.setPosRayos(posRayos); 

	// Se añade a la lista de simulaciones la simulación creada y a las opciones para elegir la simulación a comprobar
	simulacionArray.push(simulacion);

	let selectSim = document.getElementById('opcionesSim');
	let opcionSimNueva = document.createElement('option');	
	opcionSimNueva.text = simulacion.getName();
	opcionSimNueva.value = simulacion.getName();	
	selectSim.add(opcionSimNueva);
	selectSim.selectedIndex = selectSim.options.length - 1;

	// Se dibuja la simulación generada
	dibujaSimulacion(gl,program,positionAttributeLocation,colorLocation,simulacion);
	  
	colectoresSeleccionados.splice(0, colectoresSeleccionados.length);  
	reflectividadColectores.splice(0, reflectividadColectores.length);  

	// Se crea la caracterización de la simulacion predeterminada	
	let caracterizacion = new Caracterizacion("Grafico " + (graficoArray.length+1));

	caracterizacion.setIncidencia(incidenciaPred);
	caracterizacion.setDCF(DCFPred);
	caracterizacion.setDCF_q(DCF_qPred);

	
	// Se inicializa el gráfico a dibujar con los datos por defecto y se inserta en las opciones de caracterizacion a comprobar  		
	google.charts.load('current',{packages:['corechart']});
	google.charts.setOnLoadCallback(inicializarCaracterizacion);


	let selectGraf = document.getElementById('opcionesGraf');
	let selectGraf2 = document.getElementById('opcionesGraf2');
	
	/*Pestaña Trazado*/
	let opcionGrafNuevo = document.createElement('option');	
	opcionGrafNuevo.text = caracterizacion.getName();
		
	//console.log("Opcion Carac Trazado: "+ opcionGrafNuevo.text);
	/*Pestaña Calculadora*/
	let opcionGrafNuevo2 = document.createElement('option');	
	opcionGrafNuevo2.text = caracterizacion.getName();
	//console.log("Opcion Carac Calc: "+ opcionGrafNuevo2.text);
	
	selectGraf.add(opcionGrafNuevo);
	selectGraf2.add(opcionGrafNuevo2);

	graficoArray.push(caracterizacion);
}


function inicializarCaracterizacion() {
    // Llama a la función que inicia el gráfico por defecto
    inicializarGraficoPorDefecto();
    
    // Añade y configura los listeners usados en la caracterizacion
    configurarListenersCaracterizacion();
}

function inicializarGraficoPorDefecto() {
	
	
	// Se crea un array para insertar los datos con los que se generarán el gráfico
	let d = [];
	
	for(let i=0; i < incidenciaPred.length ; i+=1){ 
		d.push([incidenciaPred[i],DCFPred[i],DCF_qPred[i]]);				
	}
	
    dibujaGraf(d,'comprobarGrafico');
}

//Función que genera los eventos de pinchar en los botones llamados iniciarCaracterizacion, comprobarGrafico y descargarGraf
function configurarListenersCaracterizacion() {
    
    document.getElementById('iniciarCaracterizacion').addEventListener('click', iniciarCaracterizacion);
    
    document.getElementById('comprobarGrafico').addEventListener('click', comprobarGrafico);
	
	document.getElementById('comprobarGrafico2').addEventListener('click', comprobarGrafico);
	
	document.getElementById('descargarGraf').addEventListener('click', descargarGraf);
}

// Función que pasandole unos datos genera un gráfico con estos.
function dibujaGraf(datos,id) {
	
	
	//console.log("Datos pasados de la grafica: ");
	//console.log(datos);
	
	datosActuales = datos;
	
	// Se preparan los datos
	let data = google.visualization.arrayToDataTable(datos);

	// Se preparan las opciones
	let options = {
	  title: 'Caracterización',
	  curveType: 'function',
	  hAxis: {title: 'Incidencia'},
	  vAxis: {title: 'Factor Concentración'},
	  legend: { position: 'bottom' }
	};


	if (id === 'comprobarGrafico') {
		graf = new google.visualization.LineChart(document.getElementById('myChart'));
		graf.draw(data, options);
	} else if (id === 'comprobarGrafico2') {
		graf = new google.visualization.LineChart(document.getElementById('myChart2'));
		graf.draw(data, options);
	}
	

	// Dibujar gráfico
	
	
	
/*document.querySelector('a[href="#nav-profile"]').addEventListener('shown.bs.tab', function () {
        
        let graf2 = new google.visualization.LineChart(document.getElementById('myChart2'));
        graf2.draw(data, options);
});*/

	 


}


// Funcion para descargar el gráfico
function descargarGraf() {
	if (graf && graf.getImageURI) {
		const imgURI = graf.getImageURI();
		const link = document.createElement('a');
		link.href = imgURI;
		link.download = 'graf.png';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		
		// Convierte los datos actuales a formato CSV
		let dataCSV = datosActuales.map(e => e.join(";")).join("\n");
	
		link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(dataCSV);
		link.download = 'datos_grafico.csv';

		// Añadir el enlace al DOM, hacer clic en él y luego eliminarlo
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		
		
	} else {
		alert('No se puede descargar el gráfico en este momento.');
	}
}






async function iniciarCaracterizacion() {
	//Revisa si se han seleccionado algun colector
	if(!colectoresSeleccionados.length > 0){
		alert("Por favor, selecciona al menos un colector.");
		return;
	}
	
	let respuestaCPP = await envioDatosCPP(1);
	
	let incidenciaCarac = respuestaCPP.incidencia;
	let DCF = respuestaCPP.DCF;
	let DCF_q = respuestaCPP.DCF_q;
	
	
	//console.log('Incidencia, '+ incidenciaCarac);
	//console.log('DCF, '+ DCF)
	//console.log('DFC_q, '+ DCF_q)

	
	let caracterizacion = new Caracterizacion("Grafico " + (graficoArray.length+1));
	
	let inc = caracterizacion.getIncidencia();
	let dcf = caracterizacion.getDCF();
	let dcf_q = caracterizacion.getDCF_q();
	
	inc.push('Incidencia');
	dcf.push('DCF');
	dcf_q.push('DFC_q');
	
	// Longitud de cualquiera de los 3 arrays
	for(let i=0; i < incidenciaCarac.length ; i+=1){ 
		inc.push(incidenciaCarac[i]);
		dcf.push(DCF[i]);
		dcf_q.push(DCF_q[i]);
		
	}
	
	caracterizacion.setIncidencia(inc);
	caracterizacion.setDCF(dcf);
	caracterizacion.setDCF_q(dcf_q);
	
	let d = [];
	
	// Longitud de cualquiera de los 3 arrays
	for(let i=0; i < inc.length ; i+=1){ 
		d.push([inc[i],dcf[i],dcf_q[i]]);				
	}
	

	let selectGraf = document.getElementById('opcionesGraf');
	let selectGraf2 = document.getElementById('opcionesGraf2');
	
	
	
	let opcionGrafNuevo = document.createElement('option');	
	opcionGrafNuevo.text = caracterizacion.getName();
	//console.log("Opcion Carac Trazado creado: "+ opcionGrafNuevo.text);
	
	let opcionGrafNuevo2 = document.createElement('option');	
	opcionGrafNuevo2.text = caracterizacion.getName();
	//console.log("Opcion Carac Calc creado: "+ opcionGrafNuevo2.text);
	
	selectGraf.add(opcionGrafNuevo);
	selectGraf.selectedIndex = selectGraf.options.length - 1; //Selecciona la ultima opcion creada
	
	selectGraf2.add(opcionGrafNuevo2);
	selectGraf2.selectedIndex = selectGraf2.options.length - 1; //Selecciona la ultima opcion creada
	
	
	dibujaGraf(d,'comprobarGrafico');
	
	graficoArray.push(caracterizacion);
	
	
	
	

}

document.addEventListener("DOMContentLoaded", function () {
    // Obtenemos los botones que manejan las pestañas
    const tabs = document.querySelectorAll('#nav-tab button');
    
    // Agregamos el evento 'shown.bs.tab' a cada botón
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            //console.log('Evento recibido: ', event);
            //console.log('ID de la pestaña seleccionada: ', event.target.id);
            
            // Comprobamos si la pestaña activa es la segunda
            if (event.target.id === 'nav-profile-tab') {
                //console.log("Pestaña 2 activa");
                comprobarGrafico({ target: { id: 'comprobarGrafico2' } });
            }
        });
    });
});


function comprobarGrafico(event) {
	// Recoge la opcion seleccionada y la busca dentro del array de simulaciones
	
	var botonId = event.target.id;
	//console.log("Boton presionado : " + botonId);
	
	let opcionGraf = elegirGrafico(botonId);
	
	//console.log("Grafico seleccionado : " + opcionGraf);
	 
	let graficoSeleccionado = graficoArray.find(caracterizacion => caracterizacion.getName() === opcionGraf); 
	
	let inc = graficoSeleccionado.getIncidencia();
	let dcf = graficoSeleccionado.getDCF();
	let dcf_q = graficoSeleccionado.getDCF_q();
	
	//console.log("Incidencia seleccionado : " + graficoSeleccionado.getIncidencia());
	//console.log("DCF seleccionado : " + graficoSeleccionado.getDCF());
	//console.log("DCF_q seleccionado : " + graficoSeleccionado.getDCF_q());
	
    let d = [];
	
	// Longitud de cualquiera de los 3 arrays
	for(let i=0; i < inc.length ; i+=1){ 
		d.push([inc[i],dcf[i],dcf_q[i]]);				
	}
	
	

	dibujaGraf(d,botonId);
}




async function calculadora() {
	//muestraLatitud
	//muestraLongitud	
	//muestraelevation
	

	let lat = document.getElementById('muestraLatitud').innerText;
	let lon = document.getElementById('muestraLongitud').innerText;
	
	if (lat === "" && lon === ""){
		alert("Seleccione un lugar en el mapa");
		return;
	}
	
	let respuestaCPP = await envioDatosCPP(2);
	//console.log(respuestaCPP);
	
	let radiacionIncidenteTotal = respuestaCPP.radiacionIncidenteTotal;
	let flujo = respuestaCPP.flujo;
	
	document.getElementById('incidenteTotal').style.display = "block";
	document.getElementById('flujo').style.display = "block";
	
	document.getElementById('muestraRadiacionTotal').innerText = radiacionIncidenteTotal;
	document.getElementById('muestraFlujo').innerText = flujo;
	
}

iniciacionAplicacion();






