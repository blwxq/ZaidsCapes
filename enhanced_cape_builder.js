// Enhanced Cape Builder with Pixlr-like Features
// Magic Tool, Image Scaling, Shapes, Filters, Layers, and More!

class EnhancedCapeBuilder {
    constructor() {
        this.canvas = document.getElementById('cape-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.layers = [];
        this.selectedLayer = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 50;
        
        // Magic Tool (Magic Wand) settings
        this.magicTolerance = 32;
        this.magicContiguous = true;
        
        // Image scaling
        this.imageCache = new Map();
        
        // Filter presets
        this.filters = {
            blur: { radius: 5 },
            brightness: { level: 1.2 },
            contrast: { level: 1.2 },
            saturation: { level: 1.2 },
            hue: { shift: 0 },
            grayscale: { enabled: false },
            sepia: { enabled: false },
            invert: { enabled: false },
            emboss: { enabled: false }
        };
        
        this.init();
    }

    init() {
        // Set canvas size (standard cape size)
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        // Add default background layer
        this.addLayer('background', 'Background', { color: '#ffffff' });
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.saveState();
        this.render();
    }

    setupEventListeners() {
        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        
        // Canvas touch events (mobile support)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        // Tool selection
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectTool(card.dataset.tool);
            });
        });
        
        // Layer controls
        document.getElementById('add-layer')?.addEventListener('click', () => {
            document.getElementById('layer-modal').style.display = 'block';
        });
        
        document.getElementById('create-layer-btn')?.addEventListener('click', () => {
            this.createNewLayer();
        });
        
        // Canvas actions
        document.getElementById('save-cape')?.addEventListener('click', () => this.saveCape());
        document.getElementById('export-cape')?.addEventListener('click', () => this.exportCape());
        document.getElementById('clear-all')?.addEventListener('click', () => this.clearAll());
        
        // Zoom controls
        document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-view')?.addEventListener('click', () => this.resetView());
        document.getElementById('center-view')?.addEventListener('click', () => this.centerView());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Magic tool tolerance slider
        const magicToleranceSlider = document.getElementById('magic-tolerance');
        if (magicToleranceSlider) {
            magicToleranceSlider.addEventListener('input', (e) => {
                this.magicTolerance = parseInt(e.target.value);
                document.getElementById('tolerance-value').textContent = this.magicTolerance;
            });
        }
        
        // Image upload
        const imageInput = document.getElementById('image-upload');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        
        // Filter controls
        this.setupFilterControls();
    }

    setupFilterControls() {
        // Blur
        const blurSlider = document.getElementById('filter-blur');
        if (blurSlider) {
            blurSlider.addEventListener('input', (e) => {
                this.filters.blur.radius = parseInt(e.target.value);
                this.applyFilters();
            });
        }
        
        // Brightness
        const brightnessSlider = document.getElementById('filter-brightness');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                this.filters.brightness.level = parseFloat(e.target.value);
                this.applyFilters();
            });
        }
        
        // Contrast
        const contrastSlider = document.getElementById('filter-contrast');
        if (contrastSlider) {
            contrastSlider.addEventListener('input', (e) => {
                this.filters.contrast.level = parseFloat(e.target.value);
                this.applyFilters();
            });
        }
        
        // Toggle filters
        ['grayscale', 'sepia', 'invert', 'emboss'].forEach(filterName => {
            const checkbox = document.getElementById(`filter-${filterName}`);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.filters[filterName].enabled = e.target.checked;
                    this.applyFilters();
                });
            }
        });
    }

    // === LAYER MANAGEMENT ===
    
    addLayer(type, name, properties = {}) {
        const layer = {
            id: Date.now() + Math.random(),
            type: type,
            name: name,
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
            order: this.layers.length,
            filters: JSON.parse(JSON.stringify(this.filters)), // Clone filters
            properties: {
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                skewX: 0,
                skewY: 0,
                ...properties
            }
        };
        
        this.layers.push(layer);
        this.updateLayersList();
        this.selectLayer(layer);
        this.saveState();
        this.render();
        
        return layer;
    }

    // === MAGIC TOOL (Magic Wand Selection) ===
    
    magicToolSelect(x, y) {
        if (!this.selectedLayer) return;
        
        const layer = this.selectedLayer;
        const imageData = this.getLayerImageData(layer);
        if (!imageData) return;
        
        // Get pixel color at clicked point
        const pixelIndex = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
        const r = imageData.data[pixelIndex];
        const g = imageData.data[pixelIndex + 1];
        const b = imageData.data[pixelIndex + 2];
        const a = imageData.data[pixelIndex + 3];
        
        // Flood fill or select similar colors
        const selectedPixels = this.floodFill(
            imageData,
            Math.floor(x),
            Math.floor(y),
            { r, g, b, a },
            this.magicTolerance,
            this.magicContiguous
        );
        
        // Store selection in layer
        layer.properties.selection = selectedPixels;
        this.render();
    }
    
    floodFill(imageData, startX, startY, targetColor, tolerance, contiguous) {
        const width = imageData.width;
        const height = imageData.height;
        const selected = [];
        const visited = new Set();
        const stack = [[startX, startY]];
        
        const colorDistance = (c1, c2) => {
            return Math.sqrt(
                Math.pow(c1.r - c2.r, 2) +
                Math.pow(c1.g - c2.g, 2) +
                Math.pow(c1.b - c2.b, 2) +
                Math.pow(c1.a - c2.a, 2)
            );
        };
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            
            if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) {
                continue;
            }
            
            visited.add(key);
            const pixelIndex = (y * width + x) * 4;
            const pixelColor = {
                r: imageData.data[pixelIndex],
                g: imageData.data[pixelIndex + 1],
                b: imageData.data[pixelIndex + 2],
                a: imageData.data[pixelIndex + 3]
            };
            
            if (colorDistance(pixelColor, targetColor) <= tolerance) {
                selected.push([x, y]);
                
                // Add neighbors to stack if contiguous
                if (contiguous) {
                    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
                } else {
                    // Non-contiguous: check all pixels (similar to Pixlr's global selection)
                    // This is simplified - full implementation would check all pixels
                }
            }
        }
        
        return selected;
    }
    
    getLayerImageData(layer) {
        // Create temporary canvas to get layer image data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        this.renderLayer(tempCtx, layer);
        return tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    }

    // === IMAGE HANDLING ===
    
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = () => {
                // Create image layer
                const layer = this.addLayer('image', `Image ${this.layers.length}`, {
                    src: e.target.result,
                    originalWidth: img.width,
                    originalHeight: img.height,
                    scale: 1,
                    x: 0,
                    y: 0,
                    width: Math.min(img.width, this.canvas.width),
                    height: Math.min(img.height, this.canvas.height)
                });
                
                // Cache image
                this.imageCache.set(layer.id, img);
                this.render();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    scaleImage(layer, scaleX, scaleY) {
        if (!layer || layer.type !== 'image') return;
        
        const img = this.imageCache.get(layer.id);
        if (!img) return;
        
        layer.properties.scaleX = scaleX || layer.properties.scaleX;
        layer.properties.scaleY = scaleY || layer.properties.scaleY;
        layer.properties.width = img.width * layer.properties.scaleX;
        layer.properties.height = img.height * layer.properties.scaleY;
        
        this.saveState();
        this.render();
    }

    // === SHAPES ===
    
    drawShape(layer) {
        const { shape, x, y, width, height, color, strokeWidth, strokeColor, rotation } = layer.properties;
        
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        this.ctx.rotate((rotation || 0) * Math.PI / 180);
        
        switch (shape) {
            case 'rectangle':
                this.ctx.fillStyle = color;
                this.ctx.fillRect(-width / 2, -height / 2, width, height);
                if (strokeWidth > 0) {
                    this.ctx.strokeStyle = strokeColor || '#000000';
                    this.ctx.lineWidth = strokeWidth;
                    this.ctx.strokeRect(-width / 2, -height / 2, width, height);
                }
                break;
                
            case 'circle':
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, Math.min(width, height) / 2, 0, Math.PI * 2);
                this.ctx.fill();
                if (strokeWidth > 0) {
                    this.ctx.strokeStyle = strokeColor || '#000000';
                    this.ctx.lineWidth = strokeWidth;
                    this.ctx.stroke();
                }
                break;
                
            case 'triangle':
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -height / 2);
                this.ctx.lineTo(-width / 2, height / 2);
                this.ctx.lineTo(width / 2, height / 2);
                this.ctx.closePath();
                this.ctx.fill();
                if (strokeWidth > 0) {
                    this.ctx.strokeStyle = strokeColor || '#000000';
                    this.ctx.lineWidth = strokeWidth;
                    this.ctx.stroke();
                }
                break;
                
            case 'star':
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                const points = 5;
                const outerRadius = Math.min(width, height) / 2;
                const innerRadius = outerRadius / 2;
                for (let i = 0; i < points * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / points - Math.PI / 2;
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (i === 0) this.ctx.moveTo(px, py);
                    else this.ctx.lineTo(px, py);
                }
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'polygon':
                // Custom polygon drawing
                const sides = layer.properties.sides || 6;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                const radius = Math.min(width, height) / 2;
                for (let i = 0; i < sides; i++) {
                    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    if (i === 0) this.ctx.moveTo(px, py);
                    else this.ctx.lineTo(px, py);
                }
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
        
        this.ctx.restore();
    }

    // === FILTERS ===
    
    applyFilters() {
        if (!this.selectedLayer) return;
        
        this.saveState();
        this.render();
    }
    
    applyFilterToLayer(layer) {
        if (!layer.filters) return;
        
        const filters = layer.filters;
        
        // This is a simplified version - full implementation would use Canvas filters API
        // For now, we'll apply filters during render
        
        // Grayscale
        if (filters.grayscale?.enabled) {
            this.ctx.filter = 'grayscale(100%)';
        }
        
        // Sepia
        if (filters.sepia?.enabled) {
            this.ctx.filter = 'sepia(100%)';
        }
        
        // Invert
        if (filters.invert?.enabled) {
            this.ctx.filter = 'invert(100%)';
        }
        
        // Blur
        if (filters.blur?.radius > 0) {
            this.ctx.filter = `blur(${filters.blur.radius}px)`;
        }
        
        // Brightness & Contrast
        const brightness = filters.brightness?.level || 1;
        const contrast = filters.contrast?.level || 1;
        this.ctx.filter = `brightness(${brightness}) contrast(${contrast})`;
    }

    // === RENDERING ===
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render all visible layers in order
        this.layers
            .filter(layer => layer.visible)
            .sort((a, b) => a.order - b.order)
            .forEach(layer => {
                this.renderLayer(this.ctx, layer);
            });
        
        // Draw selection outline if magic tool was used
        if (this.selectedLayer?.properties?.selection) {
            this.drawSelectionOutline(this.selectedLayer.properties.selection);
        }
    }
    
    renderLayer(ctx, layer) {
        ctx.save();
        
        // Set opacity
        ctx.globalAlpha = (layer.opacity || 100) / 100;
        
        // Set blend mode
        ctx.globalCompositeOperation = layer.blendMode || 'source-over';
        
        // Apply filters
        this.applyFilterToLayer(layer);
        
        switch (layer.type) {
            case 'background':
                ctx.fillStyle = layer.properties.color || '#ffffff';
                ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
                
            case 'text':
                this.renderText(ctx, layer);
                break;
                
            case 'shape':
                this.drawShape(layer);
                break;
                
            case 'image':
                this.renderImage(ctx, layer);
                break;
                
            case 'gradient':
                this.renderGradient(ctx, layer);
                break;
                
            case 'pattern':
                this.renderPattern(ctx, layer);
                break;
        }
        
        ctx.restore();
    }
    
    renderText(ctx, layer) {
        const { text, x, y, fontSize, fontFamily, color, bold, italic, align } = layer.properties;
        
        ctx.fillStyle = color || '#000000';
        ctx.font = `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${fontSize || 24}px ${fontFamily || 'Arial'}`;
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text || 'Sample Text', x || 50, y || 50);
    }
    
    renderImage(ctx, layer) {
        const img = this.imageCache.get(layer.id);
        if (!img) return;
        
        const { x, y, width, height, rotation, scaleX, scaleY } = layer.properties;
        
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate((rotation || 0) * Math.PI / 180);
        ctx.scale(scaleX || 1, scaleY || 1);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
    }
    
    renderGradient(ctx, layer) {
        const { colors, direction, x, y, width, height } = layer.properties;
        let gradient;
        
        if (direction === 'horizontal') {
            gradient = ctx.createLinearGradient(x, y, x + width, y);
        } else if (direction === 'vertical') {
            gradient = ctx.createLinearGradient(x, y, x, y + height);
        } else if (direction === 'radial') {
            gradient = ctx.createRadialGradient(x + width / 2, y + height / 2, 0, x + width / 2, y + height / 2, Math.max(width, height) / 2);
        } else {
            gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        }
        
        const colorArray = colors || ['#00CED1', '#C71585'];
        colorArray.forEach((color, index) => {
            gradient.addColorStop(index / (colorArray.length - 1), color);
        });
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x || 0, y || 0, width || this.canvas.width, height || this.canvas.height);
    }
    
    renderPattern(ctx, layer) {
        // Pattern rendering (stripes, dots, etc.)
        const { pattern, color1, color2, size } = layer.properties;
        
        // Simplified pattern implementation
        ctx.fillStyle = color1 || '#ffffff';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (pattern === 'stripes') {
            ctx.fillStyle = color2 || '#000000';
            const stripeWidth = size || 10;
            for (let x = 0; x < this.canvas.width; x += stripeWidth * 2) {
                ctx.fillRect(x, 0, stripeWidth, this.canvas.height);
            }
        }
    }
    
    drawSelectionOutline(selection) {
        if (!selection || selection.length === 0) return;
        
        this.ctx.strokeStyle = '#00CED1';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        
        // Draw selection outline (simplified - would need proper path finding)
        selection.forEach(([x, y]) => {
            if (this.ctx.path.length === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // === MOUSE HANDLERS ===
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width) - this.panX,
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height) - this.panY
        };
    }
    
    onMouseDown(e) {
        const pos = this.getMousePos(e);
        this.startX = pos.x;
        this.startY = pos.y;
        this.isDrawing = true;
        
        switch (this.currentTool) {
            case 'magic':
                this.magicToolSelect(pos.x, pos.y);
                break;
            case 'brush':
                // Brush drawing
                break;
            case 'eraser':
                // Eraser tool
                break;
            case 'select':
                // Select tool
                break;
        }
    }
    
    onMouseMove(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        switch (this.currentTool) {
            case 'brush':
                // Continue brush stroke
                break;
            case 'eraser':
                // Continue erasing
                break;
        }
    }
    
    onMouseUp(e) {
        if (this.isDrawing) {
            this.saveState();
        }
        this.isDrawing = false;
    }

    // === TOOL SELECTION ===
    
    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        this.updatePropertiesPanel();
    }

    // === UNDO/REDO ===
    
    saveState() {
        const state = JSON.parse(JSON.stringify(this.layers));
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
        this.redoStack = []; // Clear redo stack on new action
    }
    
    undo() {
        if (this.undoStack.length <= 1) return;
        this.redoStack.push(this.undoStack.pop());
        this.layers = JSON.parse(JSON.stringify(this.undoStack[this.undoStack.length - 1]));
        this.updateLayersList();
        this.render();
    }
    
    redo() {
        if (this.redoStack.length === 0) return;
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.layers = JSON.parse(JSON.stringify(state));
        this.updateLayersList();
        this.render();
    }

    // === ZOOM & PAN ===
    
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5);
        this.updateZoom();
    }
    
    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.5);
        this.updateZoom();
    }
    
    resetView() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoom();
    }
    
    centerView() {
        this.panX = 0;
        this.panY = 0;
        this.updateZoom();
    }
    
    updateZoom() {
        this.canvas.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`;
        this.canvas.style.transformOrigin = 'center center';
    }

    // === KEYBOARD SHORTCUTS ===
    
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            if (e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redo();
            }
            if (e.key === 's') {
                e.preventDefault();
                this.saveCape();
            }
            if (e.key === 'e') {
                e.preventDefault();
                this.exportCape();
            }
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                this.zoomIn();
            }
            if (e.key === '-') {
                e.preventDefault();
                this.zoomOut();
            }
        }
        
        if (e.key === 'Delete' && this.selectedLayer) {
            this.deleteLayer(this.selectedLayer.id);
        }
    }

    // === LAYER MANAGEMENT UI ===
    
    selectLayer(layer) {
        this.selectedLayer = layer;
        this.updateLayersList();
        this.updatePropertiesPanel();
    }
    
    updateLayersList() {
        const container = document.getElementById('layers-list');
        if (!container) return;
        
        // Implementation similar to existing cape-builder.js
        // ... (would include layer list rendering)
    }
    
    updatePropertiesPanel() {
        // Implementation similar to existing cape-builder.js
        // ... (would include properties panel rendering)
    }
    
    deleteLayer(layerId) {
        this.layers = this.layers.filter(l => l.id !== layerId);
        if (this.selectedLayer?.id === layerId) {
            this.selectedLayer = null;
        }
        this.updateLayersList();
        this.saveState();
        this.render();
    }

    // === EXPORT ===
    
    saveCape() {
        const capeData = {
            layers: this.layers,
            timestamp: Date.now(),
            version: '2.0'
        };
        localStorage.setItem('saved_cape', JSON.stringify(capeData));
        alert('Cape saved successfully!');
    }
    
    exportCape() {
        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cape-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    clearAll() {
        if (confirm('Clear all layers? This cannot be undone!')) {
            this.layers = [];
            this.selectedLayer = null;
            this.addLayer('background', 'Background', { color: '#ffffff' });
            this.updateLayersList();
            this.saveState();
            this.render();
        }
    }
    
    createNewLayer() {
        const type = document.getElementById('layer-type').value;
        const name = document.getElementById('layer-name').value || `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`;
        
        const defaultProperties = {
            text: { text: 'Sample Text', fontSize: 24, fontFamily: 'Arial', color: '#000000' },
            shape: { shape: 'rectangle', color: '#00CED1', strokeWidth: 0 },
            gradient: { colors: ['#00CED1', '#C71585'], direction: 'horizontal' },
            pattern: { pattern: 'stripes', color1: '#00CED1', color2: '#C71585' },
            image: { src: '', scale: 1 }
        };
        
        this.addLayer(type, name, defaultProperties[type] || {});
        document.getElementById('layer-modal').style.display = 'none';
        this.selectTool(type);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.builder = new EnhancedCapeBuilder();
});

