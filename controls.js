/**
 * Custom Chrome-style Control Panel System
 * Spaceship-inspired UI controls for FlowField Studio
 */

class Slider {
  constructor(element, param, min, max, initial, step = 0.1) {
    this.element = element;
    this.param = param;
    this.min = min;
    this.max = max;
    this.value = initial;
    this.step = step;
    this.onChange = null;
    
    this.init();
  }
  
  init() {
    // Create slider structure
    this.element.innerHTML = `
      <div class="slider-track">
        <div class="slider-fill"></div>
        <div class="slider-thumb"></div>
      </div>
    `;
    
    this.track = this.element.querySelector('.slider-track');
    this.fill = this.element.querySelector('.slider-fill');
    this.thumb = this.element.querySelector('.slider-thumb');
    
    // Set initial position
    this.updatePosition();
    
    // Add event listeners
    this.track.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Touch support
    this.track.addEventListener('touchstart', this.onTouchStart.bind(this));
    document.addEventListener('touchmove', this.onTouchMove.bind(this));
    document.addEventListener('touchend', this.onMouseUp.bind(this));
  }
  
  onMouseDown(e) {
    e.preventDefault();
    this.isDragging = true;
    this.updateValueFromEvent(e);
    this.element.classList.add('active');
  }
  
  onTouchStart(e) {
    e.preventDefault();
    this.isDragging = true;
    this.updateValueFromEvent(e.touches[0]);
    this.element.classList.add('active');
  }
  
  onMouseMove(e) {
    if (!this.isDragging) return;
    this.updateValueFromEvent(e);
  }
  
  onTouchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.updateValueFromEvent(e.touches[0]);
  }
  
  onMouseUp() {
    this.isDragging = false;
    this.element.classList.remove('active');
  }
  
  updateValueFromEvent(e) {
    const rect = this.track.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    let newValue = this.min + percentage * (this.max - this.min);
    newValue = Math.round(newValue / this.step) * this.step;
    newValue = Math.max(this.min, Math.min(this.max, newValue));
    
    if (newValue !== this.value) {
      this.value = newValue;
      this.updatePosition();
      if (this.onChange) this.onChange(this.value);
    }
  }
  
  updatePosition() {
    const percentage = (this.value - this.min) / (this.max - this.min);
    this.fill.style.width = `${percentage * 100}%`;
    this.thumb.style.left = `${percentage * 100}%`;
  }
  
  formatValue(val) {
    if (val < 0.01 && val > 0) {
      return val.toFixed(3);
    }
    return val % 1 === 0 ? val : val.toFixed(2);
  }
  
  setValue(val) {
    this.value = Math.max(this.min, Math.min(this.max, val));
    this.updatePosition();
  }
}

class ToggleSwitch {
  constructor(element, param, initial = false) {
    this.element = element;
    this.param = param;
    this.value = initial;
    this.onChange = null;
    
    this.init();
  }
  
  init() {
    this.element.innerHTML = `
      <div class="toggle-track">
        <div class="toggle-thumb"></div>
        <div class="toggle-led"></div>
      </div>
    `;
    
    this.track = this.element.querySelector('.toggle-track');
    this.thumb = this.element.querySelector('.toggle-thumb');
    this.led = this.element.querySelector('.toggle-led');
    
    this.updateState();
    
    this.element.addEventListener('click', this.toggle.bind(this));
  }
  
  toggle() {
    this.value = !this.value;
    this.updateState();
    if (this.onChange) this.onChange(this.value);
  }
  
  updateState() {
    if (this.value) {
      this.element.classList.add('active');
    } else {
      this.element.classList.remove('active');
    }
  }
  
  setValue(val) {
    this.value = val;
    this.updateState();
  }
}

class ColorPicker {
  constructor(element, param, initial) {
    this.element = element;
    this.param = param;
    this.value = initial;
    this.onChange = null;
    
    this.init();
  }
  
  init() {
    this.element.innerHTML = `
      <div class="color-preview" style="background-color: ${this.value};">
        <input type="color" value="${this.value}" />
      </div>
    `;
    
    this.preview = this.element.querySelector('.color-preview');
    this.input = this.element.querySelector('input');
    
    // Make preview clickable to trigger color picker
    this.preview.addEventListener('click', () => {
      this.input.click();
    });
    
    this.input.addEventListener('input', (e) => {
      this.value = e.target.value;
      this.preview.style.backgroundColor = this.value;
      if (this.onChange) this.onChange(this.value);
    });
  }
  
  setValue(val) {
    this.value = val;
    this.input.value = val;
    this.preview.style.backgroundColor = val;
  }
}

class Selector {
  constructor(element, param, options, initial) {
    this.element = element;
    this.param = param;
    this.options = options;
    this.value = initial;
    this.onChange = null;
    
    this.init();
  }
  
  init() {
    const optionsHTML = this.options.map(opt => 
      `<option value="${opt.value}" ${opt.value === this.value ? 'selected' : ''}>${opt.label}</option>`
    ).join('');
    
    this.element.innerHTML = `<select>${optionsHTML}</select>`;
    this.select = this.element.querySelector('select');
    
    this.select.addEventListener('change', (e) => {
      this.value = e.target.value;
      if (this.onChange) this.onChange(this.value);
    });
  }
  
  setValue(val) {
    this.value = val;
    this.select.value = val;
  }
}

class ControlPanel {
  constructor() {
    this.controls = {};
    this.onUpdate = null;
  }
  
  createSlider(id, label, param, min, max, initial, step) {
    const container = document.getElementById(id);
    if (!container) return;
    
    const slider = new Slider(container, param, min, max, initial, step);
    slider.onChange = (value) => {
      if (this.onUpdate) this.onUpdate(param, value);
    };
    
    this.controls[param] = slider;
    
    // Add label above the slider
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    container.parentElement.insertBefore(labelEl, container);
    
    return slider;
  }
  
  createToggle(id, label, param, initial) {
    const container = document.getElementById(id);
    if (!container) return;
    
    const toggle = new ToggleSwitch(container, param, initial);
    toggle.onChange = (value) => {
      if (this.onUpdate) this.onUpdate(param, value);
    };
    
    this.controls[param] = toggle;
    
    // Only add label if not an inline toggle (inline toggles have labels in section headers)
    if (!container.classList.contains('toggle-inline')) {
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      container.parentElement.appendChild(labelEl);
    }
    
    return toggle;
  }
  
  createColorPicker(id, label, param, initial) {
    const container = document.getElementById(id);
    if (!container) return;
    
    const picker = new ColorPicker(container, param, initial);
    picker.onChange = (value) => {
      if (this.onUpdate) this.onUpdate(param, value);
    };
    
    this.controls[param] = picker;
    
    // Add label above the color picker
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    container.parentElement.insertBefore(labelEl, container.parentElement.firstChild);
    
    return picker;
  }
  
  createSelector(id, label, param, options, initial) {
    const container = document.getElementById(id);
    if (!container) return;
    
    const selector = new Selector(container, param, options, initial);
    selector.onChange = (value) => {
      if (this.onUpdate) this.onUpdate(param, value);
    };
    
    this.controls[param] = selector;
    
    // Add label above the selector
    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    container.parentElement.insertBefore(labelEl, container);
    
    return selector;
  }
  
  getValue(param) {
    return this.controls[param]?.value;
  }
  
  setValue(param, value) {
    this.controls[param]?.setValue(value);
  }
}

