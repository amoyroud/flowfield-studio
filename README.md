# FlowField Studio

A modular p5.js project for generating dynamic vector-field art with interactive controls, animation, and export capabilities.

## Features

- ✅ Generates dynamic vector-field art using Perlin noise
- ✅ Interactive parameter controls with custom spaceship-inspired UI
- ✅ Multiple pattern modes (Flow Field, Spiral, Vortex)
- ✅ Various shape types (Lines, Dots, Circles, Triangles, Squares, Numbers)
- ✅ Animation modes (Evolve, Particles)
- ✅ Mouse interaction with adjustable influence and radius
- ✅ Image upload for pattern masking
- ✅ Export artwork as PNG images
- ✅ **Video recording** - Record animations as MP4 video files (user-controlled duration)
- ✅ **Code export** - Generate standalone HTML files
- ✅ **Mobile-optimized** - Fully responsive design for Twitter mobile users
- ✅ Responsive canvas rendering with automatic sizing

## How to Use

1. Open `index.html` in a browser or use a local server
2. Adjust parameters using the control panel in the top-right corner:
   - **Scale**: Adjust the spacing between elements (10 - 50)
   - **Density**: Control how many elements are drawn (0.1 - 1.0)
   - **Noise**: Control the intensity of the flow field (0 - 5.0)
   - **Animation**: Toggle animation on/off and adjust speed
   - **Mouse Interaction**: Enable mouse influence on the pattern
   - **Background/Line Color**: Customize colors
   - **Pattern**: Choose between Flow Field, Spiral, or Vortex
   - **Shape**: Select Lines, Dots, Circles, Triangles, Squares, or Numbers
   - **Animation Mode**: Choose Evolve or Particles
3. Click **Save PNG** to download a snapshot
4. Click **Start Recording** to begin capturing video, then click **Stop Recording** when finished (downloads as MP4)
5. Click **Export Code** to download a standalone HTML file you can embed on your website

## Files

- `index.html` - Main HTML structure
- `sketch.js` - p5.js sketch with flow field generation and export features
- `controls.js` - Custom control panel implementation
- `style.css` - Canvas container styling
- `controls.css` - Control panel styling with spaceship-inspired UI

## Export Features

### Video Recording
- Records canvas animation at 30 FPS
- User-controlled recording duration (record for as long as needed)
- Outputs MP4 video format (with fallback to WebM if needed)
- Live recording timer display
- Manual stop via button click
- Automatic download when recording completes
- Works with all pattern and animation modes

### Code Export
- Generates a complete standalone HTML file
- Includes all current parameters
- Embeds p5.js from CDN
- Ready to upload to any website
- Code is also copied to clipboard for easy use

## Mobile Support

FlowField Studio is now fully optimized for mobile devices and works great when shared on Twitter:

- **Responsive canvas sizing** - Automatically adapts to screen size
- **Touch-optimized controls** - Larger touch targets and touch-friendly sliders
- **Performance optimized** - Reduced particle count on mobile for smooth animations
- **Portrait & landscape** - Handles both orientations gracefully
- **iOS ready** - Full Apple mobile web app support

## Future Enhancements

- 🎬 GIF export option
- 🎥 Customizable video duration and format options (MOV, AVI)
- 🪟 Embed as a window in Windows 95 desktop

## Technical Details

Built with:
- [p5.js](https://p5js.org/) v1.9.0 - Creative coding library
- Custom control panel system - Spaceship-inspired UI
- MediaRecorder API - Video capture functionality
- Perlin noise for organic flow patterns
- Vector mathematics for directional flow
- Particle system for dynamic animations

## Development

To run locally:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Or use Cursor's live preview
```

Then navigate to `http://localhost:8000`

