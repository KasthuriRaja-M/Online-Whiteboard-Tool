# Online Whiteboard Tool

A modern, feature-rich online whiteboard application built with HTML5 Canvas, JavaScript, and CSS3.

## Features

### Core Drawing Features
- **Freehand Drawing**: Draw with mouse/touch with customizable brush sizes
- **Shapes**: Rectangle, Circle, Ellipse, Line, Arrow, Triangle
- **Text Tool**: Add text with customizable font, size, and color
- **Eraser**: Erase specific areas or clear entire canvas
- **Selection Tool**: Select, move, resize, and delete objects

### Tools & Options
- **Color Picker**: Full color palette with RGB/HSL support
- **Brush Size**: Adjustable from 1px to 50px
- **Opacity Control**: Adjust transparency from 0% to 100%
- **Line Styles**: Solid, dashed, dotted lines
- **Fill Options**: Filled or outlined shapes

### Advanced Features
- **Undo/Redo**: Full history management
- **Save/Load**: Export as PNG, JPEG, or SVG
- **Zoom & Pan**: Navigate large canvases
- **Grid & Snap**: Align objects precisely
- **Layers**: Organize content in layers
- **Collaboration**: Real-time multi-user support (future enhancement)

### UI/UX Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes
- **Keyboard Shortcuts**: Quick access to tools
- **Toolbar**: Organized tool categories
- **Status Bar**: Display coordinates, zoom level, and tool info

## Technical Requirements

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Technologies Used
- HTML5 Canvas API
- Vanilla JavaScript (ES6+)
- CSS3 with Flexbox/Grid
- Local Storage for settings
- File API for save/load

### Performance Requirements
- Smooth 60fps drawing
- Support for canvas sizes up to 4000x4000px
- Memory efficient for large drawings
- Responsive UI with minimal lag

## Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Online-Whiteboard-Tool.git
cd Online-Whiteboard-Tool
```

2. Open `index.html` in your browser or serve with a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Access the application at `http://localhost:8000`

## Usage

### Basic Drawing
1. Select a drawing tool (pen, shapes, text)
2. Choose color and brush size
3. Click and drag on canvas to draw

### Keyboard Shortcuts
- `B` - Brush tool
- `E` - Eraser
- `R` - Rectangle
- `C` - Circle
- `L` - Line
- `T` - Text tool
- `S` - Selection tool
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+S` - Save
- `Ctrl+O` - Open
- `+/-` - Zoom in/out
- `Delete` - Delete selected objects

### File Operations
- **Save**: Export as PNG, JPEG, or SVG
- **Load**: Import existing images
- **Clear**: Reset entire canvas
- **Export**: Download in various formats

## Project Structure

```
Online-Whiteboard-Tool/
├── index.html              # Main HTML file
├── css/
│   ├── style.css           # Main stylesheet
│   ├── themes.css          # Dark/light theme styles
│   └── responsive.css      # Mobile responsive styles
├── js/
│   ├── app.js              # Main application logic
│   ├── canvas.js           # Canvas drawing operations
│   ├── tools.js            # Drawing tools implementation
│   ├── history.js          # Undo/redo functionality
│   ├── fileops.js          # Save/load operations
│   └── utils.js            # Utility functions
├── assets/
│   ├── icons/              # Tool icons
│   └── fonts/              # Custom fonts
└── README.md               # This file
```

## Development

### Adding New Features
1. Create feature branch
2. Implement functionality
3. Add tests if applicable
4. Update documentation
5. Submit pull request

### Code Style
- Use ES6+ features
- Follow JavaScript Standard Style
- Comment complex functions
- Use meaningful variable names

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and feature requests, please use the GitHub Issues page.
