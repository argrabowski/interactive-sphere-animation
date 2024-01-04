# Interactive Sphere Animation

https://interactive-sphere-animation.glitch.me

## Overview

This project utilizes WebGL to render an interactive 3D scene featuring a wireframe sphere and a line strip generated using the Chaikin algorithm. Users can interact with the scene through keypress events to control wireframe rendering, sphere subdivision, light type, line subdivision, and animation.

## Features

- Rendering of a wireframe sphere and a line strip.
- Chaikin algorithm for generating a line strip from control points.
- Phong lighting model with ambient, diffuse, and specular components.
- User controls for wireframe rendering, sphere subdivision, light type, line subdivision, and animation.

## Key Components

- **JavaScript File (`main.js`):**
  - WebGL initialization, rendering loop, and user interaction handling.
  - Functions for generating the wireframe sphere and line using the Chaikin algorithm.
  - Animation function for interactive movement.

- **HTML File (`index.html`):**
  - HTML structure for embedding the WebGL canvas and loading necessary scripts.

- **Shaders (`vertex-shader` and `fragment-shader`):**
  - Vertex and fragment shaders for handling lighting calculations and color assignments.

- **WebGL Utility Scripts (`webgl-utils.js`, `initShaders.js`, `MV.js`):**
  - Utility scripts for setting up the WebGL context and initializing shaders.

## Controls

**Toggle Wireframe Rendering:**
- Press `M` or `m` to toggle wireframe rendering on and off.

**Adjust Sphere Subdivision:**
- Press `Q` or `q` to decrement the sphere subdivision level.
- Press `E` or `e` to increment the sphere subdivision level.

**Toggle Light Type:**
- Press `L` or `l` to toggle between different light types.

**Adjust Line Subdivision:**
- Press `J` or `j` to decrement the line subdivision level.
- Press `I` or `i` to increment the line subdivision level.

**Toggle Animation:**
- Press `A` or `a` to toggle animation on and off.
