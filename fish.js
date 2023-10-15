
var canvas;
var gl;

var NumVertices  = 9;
var NumBody = 4;
var NumTail = 3;
var fishSize = 0.05;
var tailSize = 0.8;
// Hnútar fisks á xy-planinu
var vertices = [
    // l�kami (spjald)
    vec4( -0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2,  0.2, 0.0, 1.0 ),
	vec4(  0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.5,  0.0, 0.0, 1.0 ),
	vec4(  0.2, -0.15, 0.0, 1.0 ),
	vec4( -0.5,  0.0, 0.0, 1.0 ),
	// spor�ur (�r�hyrningur)
    vec4( -0.5,  0.0, 0.0, 1.0 ),
    vec4( -0.65,  0.15, 0.0, 1.0 ),
    vec4( -0.65, -0.15, 0.0, 1.0 )

];
//Hnútar tenings
var tankVertices = [
    vec4(-50, -50, -50, 1.0),
    vec4(50, -50, -50, 1.0),
    vec4(50, 50, -50, 1.0),
    vec4(-50, 50, -50, 1.0),
    vec4(-50, -50, 50, 1.0),
    vec4(50, -50, 50, 1.0),
    vec4(50, 50, 50, 1.0),
    vec4(-50, 50, 50, 1.0)
];

var tankIndices = [
    1, 0, 3, 3, 2, 1, // Front face
    2, 3, 7, 7, 6, 2, // Right face
    3, 0, 4, 4, 7, 3, // Bottom face
    6, 5, 1, 1, 2, 6, // Top face
    4, 5, 6, 6, 7, 4, // Back face
    5, 4, 0, 0, 1, 5  // Left face
];
var movement = false; 
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var rotTail = 0.0;     
var incTailTail = 0.05; 
var incTailFin = 0.05;
var rotFin = 1.0;
var zView = 75.0;      

var proLoc;
var mvLoc;
var colorLoc;
var tankColorLoc
var tankMvLoc;
var tankProLoc;

var program;
var tankProgram
var projTank

var vBuffer;
var tankBuffer;
var tankIndexBuffer;
var vPosition;

var tankBoundary = 500;
var fishSpeed = 0.5;

var rotFish = 0;


var fishes = [];

var colorArray = [ 
    // Blue
    vec4(0.2, 0.5, 0.8, 1.0),
    vec4(0.6, 0.7, 0.9, 1.0),
    vec4(0.1, 0.3, 0.6, 1.0),
    // Green
    vec4(0.2, 0.7, 0.3, 1.0),
    vec4(0.6, 0.8, 0.6, 1.0),
    vec4(0.1, 0.4, 0.2, 1.0),
    // Red
    vec4(0.8, 0.2, 0.2, 1.0),
    vec4(0.9, 0.6, 0.6, 1.0),
    vec4(0.6, 0.1, 0.1, 1.0),
    // Yellow
    vec4(0.9, 0.7, 0.2, 1.0),
    vec4(1.0, 0.9, 0.6, 1.0),
    vec4(0.7, 0.5, 0.1, 1.0),
    // Purple
    vec4(0.6, 0.3, 0.8, 1.0),
    vec4(0.8, 0.6, 0.9, 1.0),
    vec4(0.4, 0.2, 0.6, 1.0)
];

function initializeFishes(count) {
    for( var i = 0; i < count; i++) {
        var fish = {
            fishPos: vec4(Math.random() * tankBoundary * 2 - tankBoundary, Math.random() * tankBoundary * 2 - tankBoundary, Math.random() * tankBoundary * 2 - tankBoundary),
            fishDirection: vec4(Math.random() - 0.5, Math.random() - 0.5,Math.random() - 0.5, Math.random() - 0.5,Math.random() - 0.5, Math.random() - 0.5), // Random direction
            fishColor:  colorArray[Math.floor(Math.random() * colorArray.length)],
            finsColor:  colorArray[Math.floor(Math.random() * colorArray.length)],
        };
        fishes.push(fish);
    }
}

function drawFish(mv, rotTail, rotFin,fish) {
    mv = mult(mv, scalem(fishSize, fishSize, fishSize)); 
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));



    // update positions
    fish.fishPos[0] += fish.fishDirection[0];
    fish.fishPos[1] += fish.fishDirection[1];
    fish.fishPos[2] += fish.fishDirection[2];

    var phaseShiftTail = (Math.random() * Math.PI) /10; 
    var phaseShiftFin = (Math.random() * Math.PI) /10; 

    gl.uniform4fv(colorLoc, fish.fishColor);
    
    mv = mult(mv, translate(fish.fishPos[0],fish.fishPos[1],fish.fishPos[2])); 

    // Draw the body of the fish
    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLE_FAN, 0, NumBody);

    // Calculate the transformation for the tail
    var tailMV = mv;


    
    tailMV = mult(tailMV, rotateZ(45.0));
    tailMV = mult(tailMV, rotateY(rotTail  + phaseShiftTail));
    
    // Apply scaling to the tail
    tailMV = mult(tailMV, scalem(tailSize, tailSize, tailSize));
    
    // Apply translation to the tail
    tailMV = mult(tailMV, translate(-80.0, 80.0, -111.0));
  
    gl.uniform4fv(colorLoc,fish.finsColor); 

    // Draw the tail of the fish
    gl.uniformMatrix4fv(mvLoc, false, flatten(tailMV));
    gl.drawArrays(gl.TRIANGLES, NumBody, NumTail);
    drawFins(mv, rotTail+phaseShiftFin, 1,fish.finsColor); // for the right fin
    drawFins(mv, rotFin+phaseShiftFin, -1,fish.finsColor); // for the left fin
}

function drawFins(mv, rot, side,color) {
    var finMV = mv;

    finMV = mult(finMV, scalem(0.6, 0.6, 0.6));

    finMV = mult(finMV, rotateX(side * 90.0));
    finMV = mult(finMV, rotateX(rot));
    if(side === -1) {
        finMV = mult(finMV, translate(0.0,134.0, -50.0)); // Modify translation values accordingly
    } else if(side === 1) {
        finMV = mult(finMV, translate(0.0,-34.0, -50.0)); // Modify translation values accordingly

    }

    gl.uniform4fv(colorLoc,color); // Example color (blue)
    gl.uniformMatrix4fv(mvLoc, false, flatten(finMV));
    gl.drawArrays(gl.TRIANGLES, NumBody, NumTail); // Draw fins
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );
 

    
    gl.enable(gl.DEPTH_TEST);
 
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "fColor" );

    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );


    // Setjum ofanvarpsfylki hér í upphafi
    var proj = perspective(90.0, 1.0, 0.1, 300.0); // Adjusted for 150x150x150 cube
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));




    //fish tank
    tankProgram = initShaders(gl, "tank-vertex-shader", "tank-fragment-shader");
    projTank = perspective(90.0, 1.0, 0.1, 300.0);
    gl.useProgram(tankProgram);
    tankProLoc = gl.getUniformLocation(tankProgram, "tankProjection");
    gl.uniformMatrix4fv(tankProLoc, false, flatten(projTank));




    tankBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tankBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tankVertices), gl.STATIC_DRAW);

    var tankPosition = gl.getAttribLocation(tankProgram, "tankPosition");
    gl.vertexAttribPointer(tankPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tankPosition);
    tankColorLoc = gl.getUniformLocation(tankProgram, "tankColor");
    tankMvLoc = gl.getUniformLocation(tankProgram, "tankModelview");


    tankIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tankIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(tankIndices), gl.STATIC_DRAW);


    initializeFishes(10);

    // Atburðafall fyrir mús
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY += (e.offsetX - origX) % 360;
            spinX += (e.offsetY - origY) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );
    
    // Atburðafall fyrir lyklaborð
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zView += 0.2;
                break;
            case 40:	// niður ör
                zView -= 0.2;
                break;
         }
     }  );  

    // Atburðafall fyri músarhjól
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zView += 4.2;
         } else {
             zView -= 4.2;
         }
     }  );  

    render();
}


function render()
{
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthMask(true); 

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var mv = lookAt(vec3(0.0, 0.0, zView), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    



    rotTail += incTailTail;
    if (rotTail > 5.0 || rotTail < -5.0)
        incTailTail *= -1;
    
    rotFin -= incTailFin;
    if (rotFin > 5.0 || rotFin < -5.0)
        incTailFin *= -1;



    for (var i = 0; i < fishes.length; i++) {
        for (var j = 0; j < 3; j++) {
            if (fishes[i].fishPos[j] > tankBoundary) {

                fishes[i].fishPos[j] = -tankBoundary; 
            } else if (fishes[i].fishPos[j] < -tankBoundary) {

                fishes[i].fishPos[j] = tankBoundary; 

            }
        }
        drawFish(mv, rotTail, rotFin, fishes[i]);
    }


    // Render the fish tank
    gl.useProgram(tankProgram);

    var tankMv = lookAt(vec3(0.0, 0.0, zView + 40.0), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    tankMv = mult(tankMv, rotateX(spinX));
    tankMv = mult(tankMv, rotateY(spinY));


    gl.enable(gl.BLEND); 
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 
    gl.depthMask(false); 
    
    gl.bindBuffer(gl.ARRAY_BUFFER, tankBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tankIndexBuffer);
    gl.uniform4fv(tankColorLoc, vec4(0.3, 0.5, 0.7, 0.7));
    gl.uniformMatrix4fv(tankMvLoc, false, flatten(tankMv));

    gl.drawElements(gl.TRIANGLES, tankIndices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}

