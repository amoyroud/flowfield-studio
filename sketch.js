/**
 * FlowField Studio - Enhanced with Animation, Patterns, and Shapes
 */

// Parameters
let params = {
  backgroundColor: "#0b1c66",
  lineColor: "#ffffff",
  noiseStrength: 2.0,
  scale: 20,
  density: 0.6,
  animationSpeed: 0.05, // Centered in range (0.0005 to 0.1)
  animated: false, // Default to static
  animationMode: 'evolve', // 'evolve', 'particles'
  patternMode: 'spiral', // 'flowfield', 'spiral', 'vortex', 'centripetal'
  shapeType: 'line', // 'line', 'dot', 'circle', 'triangle', 'square', 'number'
  mouseEnabled: false, // Default to mouse off
  mouseInfluence: 0.5, // Centered in range (0 to 1)
  mouseRadius: 175, // Centered in range (50 to 300)
  numberMode: 'single', // 'single' or 'range'
  singleNumber: 0, // The single number to display
  rangeStart: 0, // Start of number range
  rangeEnd: 9 // End of number range
};

// State
let cols, rows;
let zoff = 0;
let particles = [];
let flowField = [];
let controlPanel;
let uploadedImage = null;
let showImage = false;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseThreshold = 10; // Only update if mouse moves more than this many pixels
let currentNumberIndex = 0; // For range mode number sequencing

// Video Recording State
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let recordingStartTime;
let recordingInterval;

function setup() {
  // Calculate responsive canvas size
  const maxWidth = min(windowWidth - 40, 800); // Account for padding
  const maxHeight = min(windowHeight - 40, 800);
  const canvasSize = min(maxWidth, maxHeight);
  
  const canvas = createCanvas(canvasSize, canvasSize);
  canvas.parent("canvas-container");
  
  // Initialize flow field - use ceil to ensure full coverage of edges
  cols = ceil(width / params.scale);
  rows = ceil(height / params.scale);
  
  // Initialize particles
  initParticles();
  
  // Initialize mouse tracking
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  
  // Setup custom controls
  setupControls();
  
  // Start with animation on by default
  if (params.animated) {
    loop();
  } else {
    noLoop();
  }
  
  // Generate initial field
  generateField();
}

// Handle window resize for responsive design
function windowResized() {
  const maxWidth = min(windowWidth - 40, 800);
  const maxHeight = min(windowHeight - 40, 800);
  const canvasSize = min(maxWidth, maxHeight);
  
  resizeCanvas(canvasSize, canvasSize);
  
  // Recalculate grid - use ceil to ensure full coverage of edges
  cols = ceil(width / params.scale);
  rows = ceil(height / params.scale);
  
  // Reinitialize particles for new dimensions
  initParticles();
  
  // Regenerate field
  if (!params.animated) {
    generateField();
  }
}

function draw() {
  if (!params.animated) return;
  
  if (params.animationMode === 'evolve') {
    // Evolving pattern - redraw cleanly each frame
    zoff += params.animationSpeed;
    generateField();
  } else if (params.animationMode === 'particles') {
    // Particle animation
    zoff += params.animationSpeed; // Update pattern evolution
    background(params.backgroundColor);
    updateFlowField();
    
    // Update and draw particles
    for (let particle of particles) {
      particle.follow(flowField);
      particle.update();
      particle.show();
      particle.edges();
    }
  }
}

function mouseMoved() {
  // Update pattern when mouse moves (if mouse interaction is enabled)
  if (params.mouseEnabled) {
    // Only regenerate if mouse has moved significantly (reduces jitter)
    let mouseDist = dist(mouseX, mouseY, lastMouseX, lastMouseY);
    if (mouseDist > mouseThreshold) {
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      // If animation is off, regenerate field immediately
      // If animation is on, the draw loop will handle updates, but we still track mouse position
      if (!params.animated) {
        generateField();
      }
      // When animation is on, the draw loop calls generateField() every frame anyway,
      // so mouse influence will be applied automatically
    }
  }
  return false; // Prevent default
}

function generateField() {
  background(params.backgroundColor);
  
  // Reset number index for range mode only when not animating
  // This allows numbers to cycle continuously during animation
  if (!params.animated) {
    currentNumberIndex = 0;
  }
  
  // Recalculate grid if scale changed - use ceil to ensure full coverage of edges
  let newCols = ceil(width / params.scale);
  let newRows = ceil(height / params.scale);
  if (newCols !== cols || newRows !== rows) {
    cols = newCols;
    rows = newRows;
    initParticles(); // Reinitialize particles with new grid
  }
  
  // Use a fixed random seed for stable pattern (so only mouse-influenced areas change)
  randomSeed(42);
  
  drawFieldShapes();
}

function drawFieldShapes() {
  stroke(params.lineColor);
  strokeWeight(2);
  noFill();
  
  // Draw based on pattern mode
  switch(params.patternMode) {
    case 'spiral':
      drawSpiralField();
      break;
    case 'vortex':
      drawVortexField();
      break;
    case 'centripetal':
      drawCentripetalField();
      break;
    default:
      drawFlowField();
  }
}

function drawFlowField() {
  let yoff = 0;
  // Distribute grid evenly across full width/height for edge coverage
  let xStep = cols > 1 ? width / (cols - 1) : 0;
  let yStep = rows > 1 ? height / (rows - 1) : 0;
  
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    let py = rows > 1 ? (y * yStep) : height / 2;
    // Clamp to ensure we stay within bounds
    py = constrain(py, 0, height - 1);
    
    for (let x = 0; x < cols; x++) {
      let px = cols > 1 ? (x * xStep) : width / 2;
      // Clamp to ensure we stay within bounds
      px = constrain(px, 0, width - 1);
      
      // Check if we should draw based on density or image brightness
      let drawCount = 1;
      let shouldDraw = false;
      
      if (uploadedImage && showImage) {
        // Use image brightness to determine if we should draw
        let imgX = floor(map(px, 0, width, 0, uploadedImage.width));
        let imgY = floor(map(py, 0, height, 0, uploadedImage.height));
        let c = uploadedImage.get(imgX, imgY);
        let bright = brightness(c);
        
        // Skip if pixel is too bright (use inverse density based on brightness)
        shouldDraw = !(random(100) > map(bright, 0, 100, min(params.density, 1.0) * 100, 10));
      } else {
        // Density check - handle full range 0.1 to 2.0
        if (params.density >= 1.0) {
          // For density >= 1.0, always draw at least one shape
          shouldDraw = true;
          
          // Calculate how many shapes to draw based on density
          // At density 1.0: always 1 shape
          // At density 1.5: always 1 shape + 50% chance for second = average 1.5
          // At density 2.0: always 2 shapes
          if (params.density >= 2.0) {
            drawCount = 2;
          } else if (params.density > 1.0) {
            // For values between 1.0 and 2.0:
            // Always draw 1, plus probability for second based on fractional part
            let fractionalPart = params.density - 1.0;
            if (random() < fractionalPart) {
              drawCount = 2;
            }
          }
          // At exactly 1.0, drawCount stays at 1
        } else {
          // Normal probability check for density < 1.0
          shouldDraw = random() <= params.density;
        }
      }
      
      if (shouldDraw) {
        // Draw the shape(s)
        for (let i = 0; i < drawCount; i++) {
          let angle = noise(xoff, yoff, zoff) * TWO_PI * params.noiseStrength;
          
          // If image is present, influence angle based on pixel brightness/color
          if (uploadedImage && showImage) {
            angle = applyImageInfluence(px, py, angle);
          }
          
          // Apply mouse influence if within radius
          angle = applyMouseInfluence(px, py, angle);
          
          drawShape(px, py, angle);
          xoff += 0.1;
        }
      }
      xoff += 0.1;
    }
    yoff += 0.1;
  }
}

function drawSpiralField() {
  let centerX = width / 2;
  let centerY = height / 2;
  let rotation = zoff * 2;
  // Distribute grid evenly across full width/height for edge coverage
  let xStep = cols > 1 ? width / (cols - 1) : 0;
  let yStep = rows > 1 ? height / (rows - 1) : 0;
  
  for (let y = 0; y < rows; y++) {
    let py = rows > 1 ? (y * yStep) : height / 2;
    py = constrain(py, 0, height - 1);
    
    for (let x = 0; x < cols; x++) {
      let px = cols > 1 ? (x * xStep) : width / 2;
      px = constrain(px, 0, width - 1);
      
      // Check if we should draw based on density or image brightness
      let drawCount = 1;
      let shouldDraw = false;
      
      if (uploadedImage && showImage) {
        let imgX = floor(map(px, 0, width, 0, uploadedImage.width));
        let imgY = floor(map(py, 0, height, 0, uploadedImage.height));
        let c = uploadedImage.get(imgX, imgY);
        let bright = brightness(c);
        shouldDraw = !(random(100) > map(bright, 0, 100, min(params.density, 1.0) * 100, 10));
      } else {
        if (params.density >= 1.0) {
          shouldDraw = true;
          
          if (params.density >= 2.0) {
            drawCount = 2;
          } else if (params.density > 1.0) {
            let fractionalPart = params.density - 1.0;
            if (random() < fractionalPart) {
              drawCount = 2;
            }
          }
        } else {
          shouldDraw = random() <= params.density;
        }
      }
      
      if (shouldDraw) {
        for (let i = 0; i < drawCount; i++) {
          // Calculate angle based on distance from center
          let dx = px - centerX;
          let dy = py - centerY;
          let distance = dist(px, py, centerX, centerY);
          let angle = atan2(dy, dx) + rotation + (distance * 0.01);
          
          // If image is present, influence angle based on pixel brightness/color
          if (uploadedImage && showImage) {
            angle = applyImageInfluence(px, py, angle);
          }
          
          // Apply mouse influence
          angle = applyMouseInfluence(px, py, angle);
          
          drawShape(px, py, angle);
        }
      }
    }
  }
}

function drawVortexField() {
  // Multiple vortex centers
  let vortex1 = { x: width * 0.3, y: height * 0.3 };
  let vortex2 = { x: width * 0.7, y: height * 0.7 };
  let rotation = zoff * 3;
  // Distribute grid evenly across full width/height for edge coverage
  let xStep = cols > 1 ? width / (cols - 1) : 0;
  let yStep = rows > 1 ? height / (rows - 1) : 0;
  
  for (let y = 0; y < rows; y++) {
    let py = rows > 1 ? (y * yStep) : height / 2;
    py = constrain(py, 0, height - 1);
    
    for (let x = 0; x < cols; x++) {
      let px = cols > 1 ? (x * xStep) : width / 2;
      px = constrain(px, 0, width - 1);
      
      // Check if we should draw based on density or image brightness
      let drawCount = 1;
      let shouldDraw = false;
      
      if (uploadedImage && showImage) {
        let imgX = floor(map(px, 0, width, 0, uploadedImage.width));
        let imgY = floor(map(py, 0, height, 0, uploadedImage.height));
        let c = uploadedImage.get(imgX, imgY);
        let bright = brightness(c);
        shouldDraw = !(random(100) > map(bright, 0, 100, min(params.density, 1.0) * 100, 10));
      } else {
        if (params.density >= 1.0) {
          shouldDraw = true;
          
          if (params.density >= 2.0) {
            drawCount = 2;
          } else if (params.density > 1.0) {
            let fractionalPart = params.density - 1.0;
            if (random() < fractionalPart) {
              drawCount = 2;
            }
          }
        } else {
          shouldDraw = random() <= params.density;
        }
      }
      
      if (shouldDraw) {
        for (let i = 0; i < drawCount; i++) {
          // Calculate combined force from both vortices
          let angle1 = atan2(py - vortex1.y, px - vortex1.x) + rotation;
          let dist1 = dist(px, py, vortex1.x, vortex1.y);
          let force1 = 1 / (dist1 * 0.01 + 1);
          
          let angle2 = atan2(py - vortex2.y, px - vortex2.x) - rotation;
          let dist2 = dist(px, py, vortex2.x, vortex2.y);
          let force2 = 1 / (dist2 * 0.01 + 1);
          
          // Combine angles weighted by force
          let v1 = p5.Vector.fromAngle(angle1).mult(force1);
          let v2 = p5.Vector.fromAngle(angle2).mult(force2);
          let combined = p5.Vector.add(v1, v2);
          
          let angle = combined.heading();
          
          // If image is present, influence angle based on pixel brightness/color
          if (uploadedImage && showImage) {
            angle = applyImageInfluence(px, py, angle);
          }
          
          // Apply mouse influence
          angle = applyMouseInfluence(px, py, angle);
          
          drawShape(px, py, angle);
        }
      }
    }
  }
}

function drawCentripetalField() {
  // Centripetal pattern - all shapes point toward the center in unison
  let centerX = width / 2;
  let centerY = height / 2;
  let rotation = zoff * 2; // Optional: add rotation for animated effect
  // Distribute grid evenly across full width/height for edge coverage
  let xStep = cols > 1 ? width / (cols - 1) : 0;
  let yStep = rows > 1 ? height / (rows - 1) : 0;
  
  for (let y = 0; y < rows; y++) {
    let py = rows > 1 ? (y * yStep) : height / 2;
    py = constrain(py, 0, height - 1);
    
    for (let x = 0; x < cols; x++) {
      let px = cols > 1 ? (x * xStep) : width / 2;
      px = constrain(px, 0, width - 1);
      
      // Check if we should draw based on density or image brightness
      let drawCount = 1;
      let shouldDraw = false;
      
      if (uploadedImage && showImage) {
        let imgX = floor(map(px, 0, width, 0, uploadedImage.width));
        let imgY = floor(map(py, 0, height, 0, uploadedImage.height));
        let c = uploadedImage.get(imgX, imgY);
        let bright = brightness(c);
        shouldDraw = !(random(100) > map(bright, 0, 100, min(params.density, 1.0) * 100, 10));
      } else {
        if (params.density >= 1.0) {
          shouldDraw = true;
          
          if (params.density >= 2.0) {
            drawCount = 2;
          } else if (params.density > 1.0) {
            let fractionalPart = params.density - 1.0;
            if (random() < fractionalPart) {
              drawCount = 2;
            }
          }
        } else {
          shouldDraw = random() <= params.density;
        }
      }
      
      if (shouldDraw) {
        for (let i = 0; i < drawCount; i++) {
          // Calculate angle pointing toward center
          // atan2 gives angle from shape position to center, but we want the shape to point TO the center
          // So we use atan2(centerY - py, centerX - px) which is the angle from shape to center
          let dx = centerX - px;
          let dy = centerY - py;
          let angle = atan2(dy, dx) + rotation;
          
          // If image is present, influence angle based on pixel brightness/color
          if (uploadedImage && showImage) {
            angle = applyImageInfluence(px, py, angle);
          }
          
          // Apply mouse influence
          angle = applyMouseInfluence(px, py, angle);
          
          drawShape(px, py, angle);
        }
      }
    }
  }
}

function drawShape(x, y, angle) {
  push();
  translate(x, y);
  rotate(angle);
  
  let size = params.scale * 0.6;
  
  switch(params.shapeType) {
    case 'dot':
      strokeWeight(4);
      point(0, 0);
      strokeWeight(2);
      break;
      
    case 'circle':
      fill(params.lineColor);
      noStroke();
      circle(0, 0, size * 0.5);
      break;
      
    case 'triangle':
      fill(params.lineColor);
      noStroke();
      let h = size * 0.866; // height of equilateral triangle
      triangle(
        size/2, 0,
        -size/4, h/2,
        -size/4, -h/2
      );
      break;
      
    case 'square':
      fill(params.lineColor);
      noStroke();
      rectMode(CENTER);
      square(0, 0, size * 0.7);
      break;
      
    case 'number':
      fill(params.lineColor);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(params.scale * 0.5);
      
      let numToDisplay;
      if (params.numberMode === 'range') {
        // Cycle through 1-10
        numToDisplay = (currentNumberIndex % 10) + 1;
        currentNumberIndex++;
      } else {
        // Use custom number
        numToDisplay = params.singleNumber;
      }
      
      text(numToDisplay, 0, 0);
      break;
      
    default: // line
      line(0, 0, size, 0);
  }
  
  pop();
}

// Particle System
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 2;
    this.prevPos = this.pos.copy();
  }
  
  follow(flowField) {
    let x = floor(this.pos.x / params.scale);
    let y = floor(this.pos.y / params.scale);
    let index = x + y * cols;
    
    if (index >= 0 && index < flowField.length) {
      let force = flowField[index];
      this.applyForce(force);
    }
  }
  
  applyForce(force) {
    this.acc.add(force);
  }
  
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
  
  show() {
    // Get the angle of movement
    let angle = this.vel.heading();
    
    // Draw shape at current position with semi-transparency
    push();
    
    // Apply transparency to the stroke/fill
    let c = color(params.lineColor);
    c.setAlpha(100); // Semi-transparent
    
    if (params.shapeType === 'line') {
      // For lines, draw a trail from previous position
      stroke(c);
      strokeWeight(1);
      line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
    } else {
      // For other shapes, draw the shape at current position
      translate(this.pos.x, this.pos.y);
      rotate(angle);
      
      let size = params.scale * 0.4; // Slightly smaller for particles
      
      switch(params.shapeType) {
        case 'dot':
          stroke(c);
          strokeWeight(3);
          point(0, 0);
          break;
          
        case 'circle':
          fill(c);
          noStroke();
          circle(0, 0, size * 0.5);
          break;
          
        case 'triangle':
          fill(c);
          noStroke();
          let h = size * 0.866;
          triangle(
            size/2, 0,
            -size/4, h/2,
            -size/4, -h/2
          );
          break;
          
        case 'square':
          fill(c);
          noStroke();
          rectMode(CENTER);
          square(0, 0, size * 0.7);
          break;
          
        case 'number':
          fill(c);
          noStroke();
          textAlign(CENTER, CENTER);
          textSize(params.scale * 0.3);
          let numToDisplay = params.numberMode === 'range' 
            ? floor(random(1, 11)) 
            : params.singleNumber;
          text(numToDisplay, 0, 0);
          break;
      }
    }
    
    pop();
    this.updatePrev();
  }
  
  updatePrev() {
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
  }
  
  edges() {
    if (this.pos.x > width) {
      this.pos.x = 0;
      this.updatePrev();
    }
    if (this.pos.x < 0) {
      this.pos.x = width;
      this.updatePrev();
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
      this.updatePrev();
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
      this.updatePrev();
    }
  }
}

function initParticles() {
  particles = [];
  // Reduce particle count on mobile for better performance
  let particleCount = isMobile() ? 200 : 500;
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
}

// Detect if running on mobile device
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
}

function updateFlowField() {
  flowField = [];
  let yoff = 0;
  
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let angle;
      let px = x * params.scale;
      let py = y * params.scale;
      
      switch(params.patternMode) {
        case 'spiral':
          let centerX = width / 2;
          let centerY = height / 2;
          let dx = px - centerX;
          let dy = py - centerY;
          let distance = dist(px, py, centerX, centerY);
          angle = atan2(dy, dx) + (zoff * 2) + (distance * 0.01);
          break;
          
        case 'vortex':
          let vortex1 = { x: width * 0.3, y: height * 0.3 };
          let vortex2 = { x: width * 0.7, y: height * 0.7 };
          let angle1 = atan2(py - vortex1.y, px - vortex1.x) + (zoff * 3);
          let angle2 = atan2(py - vortex2.y, px - vortex2.x) - (zoff * 3);
          let dist1 = dist(px, py, vortex1.x, vortex1.y);
          let dist2 = dist(px, py, vortex2.x, vortex2.y);
          let force1 = 1 / (dist1 * 0.01 + 1);
          let force2 = 1 / (dist2 * 0.01 + 1);
          let v1 = p5.Vector.fromAngle(angle1).mult(force1);
          let v2 = p5.Vector.fromAngle(angle2).mult(force2);
          let combined = p5.Vector.add(v1, v2);
          angle = combined.heading();
          break;
          
        case 'centripetal':
          let centripetalCenterX = width / 2;
          let centripetalCenterY = height / 2;
          let centripetalDx = centripetalCenterX - px;
          let centripetalDy = centripetalCenterY - py;
          angle = atan2(centripetalDy, centripetalDx) + (zoff * 2);
          break;
          
        default: // flowfield
          angle = noise(xoff, yoff, zoff) * TWO_PI * params.noiseStrength;
      }
      
      // Apply image influence if present
      if (uploadedImage && showImage) {
        angle = applyImageInfluence(px, py, angle);
      }
      
      // Apply mouse influence
      angle = applyMouseInfluence(px, py, angle);
      
      let v = p5.Vector.fromAngle(angle);
      v.setMag(0.5);
      flowField.push(v);
      
      xoff += 0.1;
    }
    yoff += 0.1;
  }
}

// Mouse influence function
function applyMouseInfluence(px, py, angle) {
  if (!params.mouseEnabled || params.mouseInfluence === 0) return angle;
  
  let d = dist(mouseX, mouseY, px, py);
  
  if (d < params.mouseRadius) {
    // Calculate angle towards mouse
    let mouseAngle = atan2(mouseY - py, mouseX - px);
    
    // Calculate influence based on distance (closer = stronger)
    let influence = map(d, 0, params.mouseRadius, params.mouseInfluence, 0);
    
    // Blend the original angle with the mouse angle
    return lerp(angle, mouseAngle, influence);
  }
  
  return angle;
}

// Image influence function - analyzes pixels to influence the pattern
function applyImageInfluence(px, py, angle) {
  if (!uploadedImage) return angle;
  
  // Map canvas position to image position
  let imgX = floor(map(px, 0, width, 0, uploadedImage.width));
  let imgY = floor(map(py, 0, height, 0, uploadedImage.height));
  
  // Get pixel color
  let c = uploadedImage.get(imgX, imgY);
  let r = red(c);
  let g = green(c);
  let b = blue(c);
  let bright = brightness(c);
  let h = hue(c);
  
  // Use hue to influence angle direction
  let hueAngle = map(h, 0, 360, 0, TWO_PI);
  
  // Use brightness to determine influence strength (darker = stronger influence)
  let influenceStrength = map(bright, 0, 100, 0.7, 0.1);
  
  // Blend the original angle with the hue-based angle
  return lerp(angle, hueAngle, influenceStrength);
}

// Custom Controls Setup
function setupControls() {
  controlPanel = new ControlPanel();
  
  // Static Control Sliders (always visible)
  controlPanel.createSlider('scale-slider', 'Scale', 'scale', 10, 50, params.scale, 1);
  controlPanel.createSlider('density-slider', 'Density', 'density', 0.1, 2.0, params.density, 0.05);
  controlPanel.createSlider('noise-slider', 'Noise', 'noiseStrength', 0, 5, params.noiseStrength, 0.1);
  
  // Animation Toggle
  controlPanel.createToggle('animate-toggle', 'Animate', 'animated', params.animated);
  
  // Speed Slider (conditionally visible)
  controlPanel.createSlider('speed-slider', 'Speed', 'animationSpeed', 0.0005, 0.1, params.animationSpeed, 0.001);
  
  // Mouse Interaction Toggle
  controlPanel.createToggle('mouse-toggle', 'Mouse Interaction', 'mouseEnabled', params.mouseEnabled);
  
  // Mouse Sliders (conditionally visible)
  controlPanel.createSlider('mouse-influence-slider', 'Mouse Influence', 'mouseInfluence', 0, 1, params.mouseInfluence, 0.05);
  controlPanel.createSlider('mouse-radius-slider', 'Mouse Radius', 'mouseRadius', 50, 300, params.mouseRadius, 10);
  
  // Color Pickers
  controlPanel.createColorPicker('bg-color-picker', 'Background', 'backgroundColor', params.backgroundColor);
  controlPanel.createColorPicker('line-color-picker', 'Line Color', 'lineColor', params.lineColor);
  
  // Selectors
  controlPanel.createSelector('pattern-selector', 'Pattern', 'patternMode', [
    { value: 'flowfield', label: 'Flow Field' },
    { value: 'spiral', label: 'Spiral' },
    { value: 'vortex', label: 'Vortex' },
    { value: 'centripetal', label: 'Centripetal' }
  ], params.patternMode);
  
  controlPanel.createSelector('shape-selector', 'Shape', 'shapeType', [
    { value: 'line', label: 'Lines' },
    { value: 'dot', label: 'Dots' },
    { value: 'circle', label: 'Circles' },
    { value: 'triangle', label: 'Triangles' },
    { value: 'square', label: 'Squares' },
    { value: 'number', label: 'Numbers' }
  ], params.shapeType);
  
  controlPanel.createSelector('animation-selector', 'Animation', 'animationMode', [
    { value: 'evolve', label: 'Evolve' },
    { value: 'particles', label: 'Particles' }
  ], params.animationMode);
  
  // Update handler
  controlPanel.onUpdate = (param, value) => {
    params[param] = value;
    
    // Handle animation toggle
    if (param === 'animated') {
      // Show/hide speed slider
      const speedContainer = document.getElementById('speed-container');
      if (speedContainer) {
        speedContainer.style.display = value ? 'flex' : 'none';
      }
      
      if (value) {
        loop();
      } else {
        noLoop();
        generateField();
      }
      return; // Don't regenerate again below
    }
    
    // Handle mouse toggle
    if (param === 'mouseEnabled') {
      // Show/hide mouse sliders
      const influenceContainer = document.getElementById('mouse-influence-container');
      const radiusContainer = document.getElementById('mouse-radius-container');
      if (influenceContainer) {
        influenceContainer.style.display = value ? 'flex' : 'none';
      }
      if (radiusContainer) {
        radiusContainer.style.display = value ? 'flex' : 'none';
      }
      // Regenerate field when mouse interaction is toggled so user can see the effect
      if (!params.animated) {
        generateField();
      }
      return;
    }
    
    // Handle mouse influence/radius changes - regenerate if animation is off
    if ((param === 'mouseInfluence' || param === 'mouseRadius') && !params.animated) {
      generateField();
      return;
    }
    
    // Handle show image toggle
    if (param === 'showImage') {
      showImage = value;
      generateField();
      return;
    }
    
    // Handle shape type change to show/hide number settings
    if (param === 'shapeType') {
      const numberSettings = document.getElementById('number-settings-section');
      if (numberSettings) {
        numberSettings.style.display = value === 'number' ? 'block' : 'none';
      }
    }
    
    // Parameters that need field regeneration
    const structuralParams = ['noiseStrength', 'scale', 'density', 'patternMode', 'shapeType'];
    const visualParams = ['backgroundColor', 'lineColor'];
    
    if (structuralParams.includes(param)) {
      // Always regenerate for structural changes
      if (!params.animated) {
        generateField();
      }
      // If animated, the draw loop will handle it
    } else if (visualParams.includes(param)) {
      // For color changes, only regenerate if animation is off
      if (!params.animated) {
        generateField();
      }
      // If animated, colors will update on next frame automatically
    }
    
    // Speed, mouse influence, mouse radius don't need regeneration - they're used in real-time
  };
  
  // Toggle for showing uploaded image
  controlPanel.createToggle('show-image-toggle', 'Show Image', 'showImage', false);
  
  // Number mode selector
  const numberModeSelect = document.getElementById('number-mode');
  numberModeSelect.addEventListener('change', (e) => {
    params.numberMode = e.target.value;
    const customContainer = document.getElementById('custom-number-container');
    if (customContainer) {
      customContainer.style.display = e.target.value === 'custom' ? 'flex' : 'none';
    }
    if (!params.animated) {
      generateField();
    }
  });
  
  // Custom number input
  const customNumberInput = document.getElementById('custom-number');
  customNumberInput.addEventListener('input', (e) => {
    params.singleNumber = parseInt(e.target.value) || 0;
    if (!params.animated) {
      generateField();
    }
  });
  
  // Image upload handler
  const imageUpload = document.getElementById('image-upload');
  imageUpload.addEventListener('change', handleImageUpload);
  
  // Save button
  document.getElementById('save-btn').addEventListener('click', () => {
    saveCanvas('flowfield-studio', 'png');
  });
  
  // Record button
  document.getElementById('record-btn').addEventListener('click', toggleRecording);
  
  // Export code button
  document.getElementById('export-code-btn').addEventListener('click', exportCode);
}

// Handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      loadImage(e.target.result, (img) => {
        uploadedImage = img;
        showImage = true;
        params.showImage = true;
        
        // Auto-adjust scale and density for optimal image display
        params.scale = 10; // Set to minimum
        params.density = 1; // Set to maximum
        
        // Update the slider controls
        if (controlPanel.controls.scale) {
          controlPanel.controls.scale.setValue(10);
        }
        if (controlPanel.controls.density) {
          controlPanel.controls.density.setValue(1);
        }
        
        // Show and activate the toggle next to the file input
        const toggleElement = document.getElementById('show-image-toggle');
        if (toggleElement) {
          toggleElement.style.display = 'block';
          toggleElement.classList.add('active');
        }
        
        // Update toggle state
        if (controlPanel.controls.showImage) {
          controlPanel.controls.showImage.value = true;
        }
        
        generateField();
      });
    };
    reader.readAsDataURL(file);
  }
}

// Video Recording Functions
function toggleRecording() {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

function startRecording() {
  const canvas = document.querySelector('#canvas-container canvas');
  if (!canvas) {
    alert('Canvas not found!');
    return;
  }
  
  // Get the canvas stream
  const stream = canvas.captureStream(30); // 30 FPS
  
  // Try to use MP4 format, with fallback options
  let options = { videoBitsPerSecond: 2500000 }; // 2.5 Mbps
  let mimeType = 'video/mp4';
  
  // Try different codecs in order of preference for MP4/better compatibility
  const codecs = [
    'video/mp4',
    'video/webm;codecs=h264',
    'video/webm;codecs=vp9',
    'video/webm'
  ];
  
  for (let codec of codecs) {
    if (MediaRecorder.isTypeSupported(codec)) {
      mimeType = codec;
      break;
    }
  }
  
  options.mimeType = mimeType;
  
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, options);
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  
  mediaRecorder.onstop = () => {
    // Use MP4 extension regardless of actual format for better compatibility
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowfield-studio-${Date.now()}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Ensure animation is playing for recording
  const wasAnimated = params.animated;
  if (!wasAnimated) {
    params.animated = true;
    loop();
    
    // Update the animation toggle in the UI
    const animToggle = document.getElementById('animate-toggle');
    if (animToggle) {
      animToggle.classList.add('active');
    }
    
    // Also update the control object if it exists
    if (controlPanel.controls.animated) {
      controlPanel.controls.animated.value = true;
    }
  }
  
  mediaRecorder.start();
  isRecording = true;
  recordingStartTime = Date.now();
  
  // Update UI
  const recordBtn = document.getElementById('record-btn');
  recordBtn.classList.add('recording');
  recordBtn.innerHTML = '<span class="btn-icon">⏹</span> Stop Recording';
  
  const recordingStatus = document.getElementById('recording-status');
  recordingStatus.style.display = 'flex';
  
  // Update timer
  recordingInterval = setInterval(updateRecordingTime, 100);
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  isRecording = false;
  clearInterval(recordingInterval);
  
  // Update UI
  const recordBtn = document.getElementById('record-btn');
  recordBtn.classList.remove('recording');
  recordBtn.innerHTML = '<span class="btn-icon">⏺</span> Record';
  
  const recordingStatus = document.getElementById('recording-status');
  recordingStatus.style.display = 'none';
}

function updateRecordingTime() {
  const elapsed = Date.now() - recordingStartTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const timeString = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  document.getElementById('recording-time').textContent = timeString;
}

// Code Export Function
function exportCode() {
  const code = generateStandaloneHTML();
  
  // Create a blob and download
  const blob = new Blob([code], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flowfield-studio-export-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
  
  // Also copy to clipboard
  navigator.clipboard.writeText(code).then(() => {
    alert('Code exported! The file has been downloaded and the code has been copied to your clipboard.');
  }).catch(() => {
    alert('Code exported! The file has been downloaded.');
  });
}

function generateStandaloneHTML() {
  // Generate a complete standalone HTML file with current parameters
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowField Studio - Export</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    #canvas-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  
  <script>
    // Parameters
    let params = ${JSON.stringify(params, null, 2)};
    
    // State
    let cols, rows;
    let zoff = 0;
    let particles = [];
    let flowField = [];
    let currentNumberIndex = 0;
    
    function setup() {
      const canvas = createCanvas(800, 800);
      canvas.parent("canvas-container");
      
      cols = ceil(width / params.scale);
      rows = ceil(height / params.scale);
      
      initParticles();
      
      if (params.animated) {
        loop();
      } else {
        noLoop();
      }
      
      generateField();
    }
    
    function draw() {
      if (!params.animated) return;
      
      if (params.animationMode === 'evolve') {
        zoff += params.animationSpeed;
        generateField();
      } else if (params.animationMode === 'particles') {
        zoff += params.animationSpeed;
        background(params.backgroundColor);
        updateFlowField();
        
        for (let particle of particles) {
          particle.follow(flowField);
          particle.update();
          particle.show();
          particle.edges();
        }
      }
    }
    
    function generateField() {
      background(params.backgroundColor);
      
      let newCols = ceil(width / params.scale);
      let newRows = ceil(height / params.scale);
      if (newCols !== cols || newRows !== rows) {
        cols = newCols;
        rows = newRows;
        initParticles();
      }
      
      randomSeed(42);
      drawFieldShapes();
    }
    
    function drawFieldShapes() {
      stroke(params.lineColor);
      strokeWeight(2);
      noFill();
      
      switch(params.patternMode) {
        case 'spiral':
          drawSpiralField();
          break;
        case 'vortex':
          drawVortexField();
          break;
        case 'centripetal':
          drawCentripetalField();
          break;
        default:
          drawFlowField();
      }
    }
    
    function drawFlowField() {
      let yoff = 0;
      for (let y = 0; y < rows; y++) {
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
          let px = x * params.scale;
          let py = y * params.scale;
          
          if (random() > params.density) {
            xoff += 0.1;
            continue;
          }
          
          let angle = noise(xoff, yoff, zoff) * TWO_PI * params.noiseStrength;
          
          if (params.mouseEnabled) {
            angle = applyMouseInfluence(px, py, angle);
          }
          
          drawShape(px, py, angle);
          xoff += 0.1;
        }
        yoff += 0.1;
      }
    }
    
    function drawSpiralField() {
      let centerX = width / 2;
      let centerY = height / 2;
      let rotation = zoff * 2;
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let px = x * params.scale;
          let py = y * params.scale;
          
          if (random() > params.density) continue;
          
          let dx = px - centerX;
          let dy = py - centerY;
          let distance = dist(px, py, centerX, centerY);
          let angle = atan2(dy, dx) + rotation + (distance * 0.01);
          
          if (params.mouseEnabled) {
            angle = applyMouseInfluence(px, py, angle);
          }
          
          drawShape(px, py, angle);
        }
      }
    }
    
    function drawVortexField() {
      let vortex1 = { x: width * 0.3, y: height * 0.3 };
      let vortex2 = { x: width * 0.7, y: height * 0.7 };
      let rotation = zoff * 3;
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let px = x * params.scale;
          let py = y * params.scale;
          
          if (random() > params.density) continue;
          
          let angle1 = atan2(py - vortex1.y, px - vortex1.x) + rotation;
          let dist1 = dist(px, py, vortex1.x, vortex1.y);
          let force1 = 1 / (dist1 * 0.01 + 1);
          
          let angle2 = atan2(py - vortex2.y, px - vortex2.x) - rotation;
          let dist2 = dist(px, py, vortex2.x, vortex2.y);
          let force2 = 1 / (dist2 * 0.01 + 1);
          
          let v1 = p5.Vector.fromAngle(angle1).mult(force1);
          let v2 = p5.Vector.fromAngle(angle2).mult(force2);
          let combined = p5.Vector.add(v1, v2);
          
          let angle = combined.heading();
          
          if (params.mouseEnabled) {
            angle = applyMouseInfluence(px, py, angle);
          }
          
          drawShape(px, py, angle);
        }
      }
    }
    
    function drawCentripetalField() {
      let centerX = width / 2;
      let centerY = height / 2;
      let rotation = zoff * 2;
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let px = x * params.scale;
          let py = y * params.scale;
          
          if (random() > params.density) continue;
          
          let dx = centerX - px;
          let dy = centerY - py;
          let angle = atan2(dy, dx) + rotation;
          
          if (params.mouseEnabled) {
            angle = applyMouseInfluence(px, py, angle);
          }
          
          drawShape(px, py, angle);
        }
      }
    }
    
    function drawShape(x, y, angle) {
      push();
      translate(x, y);
      rotate(angle);
      
      let size = params.scale * 0.6;
      
      switch(params.shapeType) {
        case 'dot':
          strokeWeight(4);
          point(0, 0);
          strokeWeight(2);
          break;
          
        case 'circle':
          fill(params.lineColor);
          noStroke();
          circle(0, 0, size * 0.5);
          break;
          
        case 'triangle':
          fill(params.lineColor);
          noStroke();
          let h = size * 0.866;
          triangle(size/2, 0, -size/4, h/2, -size/4, -h/2);
          break;
          
        case 'square':
          fill(params.lineColor);
          noStroke();
          rectMode(CENTER);
          square(0, 0, size * 0.7);
          break;
          
        case 'number':
          fill(params.lineColor);
          noStroke();
          textAlign(CENTER, CENTER);
          textSize(params.scale * 0.5);
          
          let numToDisplay;
          if (params.numberMode === 'range') {
            numToDisplay = (currentNumberIndex % 10) + 1;
            currentNumberIndex++;
          } else {
            numToDisplay = params.singleNumber;
          }
          
          text(numToDisplay, 0, 0);
          break;
          
        default:
          line(0, 0, size, 0);
      }
      
      pop();
    }
    
    function applyMouseInfluence(px, py, angle) {
      if (!params.mouseEnabled || params.mouseInfluence === 0) return angle;
      
      let d = dist(mouseX, mouseY, px, py);
      
      if (d < params.mouseRadius) {
        let mouseAngle = atan2(mouseY - py, mouseX - px);
        let influence = map(d, 0, params.mouseRadius, params.mouseInfluence, 0);
        return lerp(angle, mouseAngle, influence);
      }
      
      return angle;
    }
    
    // Particle System
    class Particle {
      constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = 2;
        this.prevPos = this.pos.copy();
      }
      
      follow(flowField) {
        let x = floor(this.pos.x / params.scale);
        let y = floor(this.pos.y / params.scale);
        let index = x + y * cols;
        
        if (index >= 0 && index < flowField.length) {
          let force = flowField[index];
          this.applyForce(force);
        }
      }
      
      applyForce(force) {
        this.acc.add(force);
      }
      
      update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
      }
      
      show() {
        let angle = this.vel.heading();
        push();
        
        let c = color(params.lineColor);
        c.setAlpha(100);
        
        if (params.shapeType === 'line') {
          stroke(c);
          strokeWeight(1);
          line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
        } else {
          translate(this.pos.x, this.pos.y);
          rotate(angle);
          
          let size = params.scale * 0.4;
          
          switch(params.shapeType) {
            case 'dot':
              stroke(c);
              strokeWeight(3);
              point(0, 0);
              break;
              
            case 'circle':
              fill(c);
              noStroke();
              circle(0, 0, size * 0.5);
              break;
              
            case 'triangle':
              fill(c);
              noStroke();
              let h = size * 0.866;
              triangle(size/2, 0, -size/4, h/2, -size/4, -h/2);
              break;
              
            case 'square':
              fill(c);
              noStroke();
              rectMode(CENTER);
              square(0, 0, size * 0.7);
              break;
              
            case 'number':
              fill(c);
              noStroke();
              textAlign(CENTER, CENTER);
              textSize(params.scale * 0.3);
              let numToDisplay = params.numberMode === 'range' 
                ? floor(random(1, 11)) 
                : params.singleNumber;
              text(numToDisplay, 0, 0);
              break;
          }
        }
        
        pop();
        this.updatePrev();
      }
      
      updatePrev() {
        this.prevPos.x = this.pos.x;
        this.prevPos.y = this.pos.y;
      }
      
      edges() {
        if (this.pos.x > width) {
          this.pos.x = 0;
          this.updatePrev();
        }
        if (this.pos.x < 0) {
          this.pos.x = width;
          this.updatePrev();
        }
        if (this.pos.y > height) {
          this.pos.y = 0;
          this.updatePrev();
        }
        if (this.pos.y < 0) {
          this.pos.y = height;
          this.updatePrev();
        }
      }
    }
    
    function initParticles() {
      particles = [];
      let particleCount = 500;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }
    
    function updateFlowField() {
      flowField = [];
      let yoff = 0;
      
      for (let y = 0; y < rows; y++) {
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
          let angle;
          let px = x * params.scale;
          let py = y * params.scale;
          
          switch(params.patternMode) {
            case 'spiral':
              let centerX = width / 2;
              let centerY = height / 2;
              let dx = px - centerX;
              let dy = py - centerY;
              let distance = dist(px, py, centerX, centerY);
              angle = atan2(dy, dx) + (zoff * 2) + (distance * 0.01);
              break;
              
            case 'vortex':
              let vortex1 = { x: width * 0.3, y: height * 0.3 };
              let vortex2 = { x: width * 0.7, y: height * 0.7 };
              let angle1 = atan2(py - vortex1.y, px - vortex1.x) + (zoff * 3);
              let angle2 = atan2(py - vortex2.y, px - vortex2.x) - (zoff * 3);
              let dist1 = dist(px, py, vortex1.x, vortex1.y);
              let dist2 = dist(px, py, vortex2.x, vortex2.y);
              let force1 = 1 / (dist1 * 0.01 + 1);
              let force2 = 1 / (dist2 * 0.01 + 1);
              let v1 = p5.Vector.fromAngle(angle1).mult(force1);
              let v2 = p5.Vector.fromAngle(angle2).mult(force2);
              let combined = p5.Vector.add(v1, v2);
              angle = combined.heading();
              break;
              
            case 'centripetal':
              let centripetalCenterX = width / 2;
              let centripetalCenterY = height / 2;
              let centripetalDx = centripetalCenterX - px;
              let centripetalDy = centripetalCenterY - py;
              angle = atan2(centripetalDy, centripetalDx) + (zoff * 2);
              break;
              
            default:
              angle = noise(xoff, yoff, zoff) * TWO_PI * params.noiseStrength;
          }
          
          if (params.mouseEnabled) {
            angle = applyMouseInfluence(px, py, angle);
          }
          
          let v = p5.Vector.fromAngle(angle);
          v.setMag(0.5);
          flowField.push(v);
          
          xoff += 0.1;
        }
        yoff += 0.1;
      }
    }
    
    function mouseMoved() {
      if (params.mouseEnabled && !params.animated) {
        generateField();
      }
      return false;
    }
  </script>
</body>
</html>`;
}
