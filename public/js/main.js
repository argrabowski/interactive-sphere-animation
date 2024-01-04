var canvas;
var gl;
var program;

let lineControlPoints = [
  vec4(-8.0, 8.0, 0.0, 1.0),
  vec4(2.0, 4.0, 0.0, 1.0),
  vec4(6.0, 6.0, 0.0, 1.0),
  vec4(10.0, -8.0, 0.0, 1.0),
  vec4(2.0, -2.0, 0.0, 1.0),
  vec4(-6.0, -2.0, 0.0, 1.0),
  vec4(-8.0, 8.0, 0.0, 1.0),
  vec4(2.0, 4.0, 0.0, 1.0),
];

let lineSubdivisions = 0;
var numTimesToSubdivide = 3;
var index = 0;

// initialize verticies arrays
var linePoints = [];
var pointsArray = [];
var allPoints = [];
var normalsArray = [];

var vBuffer, vNormal;
var vPosition, vNormalPosition;

var near = -10;
var far = 10;

// initialize tetrahedron data
var left = -3.0;
var right = 3.0;
var ytop = 3.0;
var bottom = -3.0;

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

// initialize lighting variables
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightType = 0.0;
var wireframe = 0.0;

// initialize animation variables
var animate = false;
var animTransX = 0.0;
var animTransY = 0.0;
var currPoint = 0;
var nextPoint = 1;
var constCount = 0;
var transX, transY;
var pointRatio = 1;

// initialize time variables
var now = 0;
var then = 0;
var time = 0;

// initialize lighting constants
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;

// initialize matrix data
var viewMatrix, modelMatrix, scaleMatrix, translateMatrix;
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye = vec3(0.0, 0.0, 1.5);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

// push points of triangle to points and normals array
function triangle(a, b, c) {
  pointsArray.push(a);
  pointsArray.push(b);
  pointsArray.push(c);

  normalsArray.push(a[0], a[1], a[2], 0.0);
  normalsArray.push(b[0], b[1], b[2], 0.0);
  normalsArray.push(c[0], c[1], c[2], 0.0);

  index += 3;
}

// recursively subdivide triangle
function divideTriangle(a, b, c, count) {
  if (count > 0) {
    var ab = mix(a, b, 0.5);
    var ac = mix(a, c, 0.5);
    var bc = mix(b, c, 0.5);

    ab = normalize(ab, true);
    ac = normalize(ac, true);
    bc = normalize(bc, true);

    divideTriangle(a, ab, ac, count - 1);
    divideTriangle(ab, b, bc, count - 1);
    divideTriangle(bc, c, ac, count - 1);
    divideTriangle(ab, bc, ac, count - 1);
  } else {
    triangle(a, b, c);
  }
}

// generate tetrahedron by dividing triangles
function tetrahedron(a, b, c, d, n) {
  index = 0;
  pointsArray = [];
  normalsArray = [];

  divideTriangle(a, b, c, n);
  divideTriangle(d, c, b, n);
  divideTriangle(a, d, b, n);
  divideTriangle(a, c, d, n);
}

// chaikin curve generation function
function chaikin(vertices, iterations) {
  linePoints = [];
  if (iterations === 0) return vertices;

  var newVertices = [];

  for (var i = 0; i < vertices.length - 1; i++) {
    var v0 = vertices[i];
    var v1 = vertices[i + 1];

    // get 1/4 and 3/4 length points
    var p0 = mix(v0, v1, 0.25);
    var p1 = mix(v0, v1, 0.75);

    newVertices.push(p0, p1);
  }

  return chaikin(newVertices, iterations - 1);
}

// animate by incrementing and decrementing translation
function animation() {
  // record timing for animation frame
  now = Date.now();
  time = now - then;
  if (time >= 6) {
    // continue to next line segment
    if (constCount === 144) {
      currPoint = nextPoint;
      nextPoint += 1;
      constCount = 0;
      animTransX = 0;
      animTransY = 0;
    }
    if (currPoint === linePoints.length - 3) {
      nextPoint = 0;
    }
    if (nextPoint < linePoints.length) {
      // increment x and y components of translation
      animTransX += (linePoints[nextPoint][0] - linePoints[currPoint][0]) / 144;
      animTransY += (linePoints[nextPoint][1] - linePoints[currPoint][1]) / 144;
      constCount += 1;
    } else {
      currPoint = 0;
      nextPoint = 1;
    }
    // remember time when scene was rendered
    then = now;
  }
  // request another animation frame with render function
  requestAnimationFrame(render);
}

function main() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  // set canvas to black color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // get the diffuse, specular, and ambient products
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);
  var ambientProduct = mult(lightAmbient, materialAmbient);

  // add matrix and lighting data to WebGL
  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  // event listener for keypress
  document.addEventListener("keypress", keyboardControl);

  render();
}

// function handling kepress event
function keyboardControl(event) {
  let key = event.key;
  switch (key) {
    // toggle wireframe
    case "m":
    case "M":
      if (wireframe < 0.5) wireframe = 1.0;
      else wireframe = 0.0;
      break;
    // decrement sphere subdivision
    case "q":
    case "Q":
      if (numTimesToSubdivide > 1) numTimesToSubdivide--;
      break;
    // increment sphere subdivision
    case "e":
    case "E":
      if (numTimesToSubdivide < 8) numTimesToSubdivide++;
      break;
    // toggle light type
    case "l":
    case "L":
      if (lightType < 0.5) lightType = 1.0;
      else lightType = 0.0;
      break;
    // decrement line subdivision
    case "j":
    case "J":
      if (lineSubdivisions > 0) {
        lineSubdivisions--;
        currPoint = Math.round(currPoint / 2);
        nextPoint = currPoint + 1;
        constCount = 0;
        animTransX = 0;
        animTransY = 0;
      }
      break;
    // increment line subdivision
    case "i":
    case "I":
      if (lineSubdivisions < 8) {
        lineSubdivisions++;
        currPoint = currPoint * 2;
        nextPoint = currPoint + 1;
        constCount = 0;
        animTransX = 0;
        animTransY = 0;
      }
      break;
    // toggle animation
    case "a":
    case "A":
      if (animate) animate = false;
      else animate = true;
      break;
  }

  render();
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // get line points from chaikin function call
  linePoints = chaikin(lineControlPoints, lineSubdivisions);
  // add verticies and normals to respective arrays for sphere
  tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

  // create buffer for line and sphere
  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  allPoints = pointsArray.concat(linePoints);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(allPoints), gl.STATIC_DRAW);

  // add vertex and normal data to WebGL
  vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  vNormal = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  vNormalPosition = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormalPosition);

  // set camera and scale matrix values
  viewMatrix = lookAt(eye, at, up);
  scaleMatrix = scalem(0.28, 0.28, 0.28);

  // apply animation translation to matrix
  if (currPoint < linePoints.length) {
    transX = linePoints[currPoint][0] + animTransX;
    transY = linePoints[currPoint][1] + animTransY;
  } else {
    transX = linePoints[0][0] + animTransX;
    transY = linePoints[0][1] + animTransY;
  }
  translateMatrix = translate(transX, transY, 0);

  // get modelView and projection matrix for sphere
  modelMatrix = mult(scaleMatrix, translateMatrix);
  modelViewMatrix = mult(viewMatrix, modelMatrix);
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  gl.uniform1f(gl.getUniformLocation(program, "lightType"), lightType);
  gl.uniform1f(gl.getUniformLocation(program, "wireframe"), wireframe);

  // draw sphere with or without wireframe
  if (!wireframe) gl.drawArrays(gl.TRIANGLES, 0, index);
  else gl.drawArrays(gl.LINE_STRIP, 0, index);

  // get modelView and projection matrix for line
  viewMatrix = lookAt(eye, at, up);
  scaleMatrix = scalem(0.28, 0.28, 0.28);
  translateMatrix = translate(0.0, 0.0, 0.0);

  modelMatrix = mult(scaleMatrix, translateMatrix);
  modelViewMatrix = mult(viewMatrix, modelMatrix);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniform1f(gl.getUniformLocation(program, "wireframe"), 1.0);

  // draw line strip generated by chaikin algorithm
  gl.drawArrays(gl.LINE_STRIP, index, linePoints.length);

  if (animate) animation();
}
