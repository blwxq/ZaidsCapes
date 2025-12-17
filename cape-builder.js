// Cape Builder - Advanced Layer-Based System
class CapeBuilder {
    constructor() {
        this.canvas = document.getElementById('cape-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.layers = [];
        this.selectedLayer = null;
        this.currentTool = null;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.init();
    }

    init() {
        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        // Add default background layer
        this.addLayer('background', 'Background', { color: '#ffffff' });
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.render();
    }

    setupEventListeners() {
        // Add layer button
        document.getElementById('add-layer')?.addEventListener('click', () => {
            document.getElementById('layer-modal').style.display = 'block';
        });

        // Create layer button
        document.getElementById('create-layer-btn')?.addEventListener('click', () => {
            this.createNewLayer();
        });

        // Close modal
        document.querySelector('.close')?.addEventListener('click', () => {
            document.getElementById('layer-modal').style.display = 'none';
        });

        // Tool selection
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectTool(card.dataset.tool);
            });
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

        // Canvas mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    addLayer(type, name, properties = {}) {
        const layer = {
            id: Date.now() + Math.random(),
            type: type,
            name: name,
            visible: true,
            locked: false,
            opacity: 100,
            order: this.layers.length,
            properties: {
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                color: '#00ffff',
                ...properties
            }
        };
        
        this.layers.push(layer);
        this.updateLayersList();
        this.selectLayer(layer);
        this.render();
        
        return layer;
    }

    createNewLayer() {
        const type = document.getElementById('layer-type').value;
        const name = document.getElementById('layer-name').value || `${type.charAt(0).toUpperCase() + type.slice(1)} Layer`;
        
        const defaultProperties = {
            text: { text: 'Sample Text', fontSize: 24, fontFamily: 'Arial', color: '#000000' },
            shape: { shape: 'rectangle', color: '#00ffff', strokeWidth: 0 },
            gradient: { colors: ['#00ffff', '#ff00ff'], direction: 'horizontal' },
            pattern: { pattern: 'stripes', color1: '#00ffff', color2: '#ff00ff' },
            image: { src: '', scale: 1 }
        };

        this.addLayer(type, name, defaultProperties[type] || {});
        document.getElementById('layer-modal').style.display = 'none';
        this.selectTool(type);
    }

    selectLayer(layer) {
        this.selectedLayer = layer;
        this.updateLayersList();
        this.updatePropertiesPanel();
    }

    selectTool(tool) {
        this.currentTool = tool;
        document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        this.updatePropertiesPanel();
    }

    updateLayersList() {
        const container = document.getElementById('layers-list');
        if (!container) return;

        if (this.layers.length === 0) {
            container.innerHTML = `
                <div class="empty-layers">
                    <div class="empty-layers-icon">📄</div>
                    <p>No layers yet. Add one to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.layers.map(layer => {
            const isActive = this.selectedLayer?.id === layer.id;
            const icon = this.getLayerIcon(layer.type);
            
            return `
                <div class="layer-item ${isActive ? 'active' : ''}" data-layer-id="${layer.id}">
                    <div class="layer-info">
                        <div class="layer-icon">${icon}</div>
                        <div class="layer-details">
                            <h4>${layer.name}</h4>
                            <p>${layer.type}</p>
                        </div>
                    </div>
                    <div class="layer-controls">
                        <button class="layer-btn ${layer.visible ? 'visible' : ''}" 
                                onclick="builder.toggleLayerVisibility(${layer.id})" 
                                title="Toggle Visibility">👁️</button>
                        <button class="layer-btn" 
                                onclick="builder.deleteLayer(${layer.id})" 
                                title="Delete">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        container.querySelectorAll('.layer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('layer-btn')) {
                    const layerId = parseFloat(item.dataset.layerId);
                    const layer = this.layers.find(l => l.id === layerId);
                    if (layer) this.selectLayer(layer);
                }
            });
        });
    }

    getLayerIcon(type) {
        const icons = {
            background: '🖼️',
            text: '📝',
            shape: '🔷',
            gradient: '🌈',
            pattern: '🔳',
            image: '🖼️'
        };
        return icons[type] || '📄';
    }

    toggleLayerVisibility(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.updateLayersList();
            this.render();
        }
    }

    deleteLayer(layerId) {
        if (confirm('Delete this layer?')) {
            this.layers = this.layers.filter(l => l.id !== layerId);
            if (this.selectedLayer?.id === layerId) {
                this.selectedLayer = null;
            }
            this.updateLayersList();
            this.render();
        }
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        const content = document.getElementById('properties-content');
        
        if (!this.selectedLayer) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        content.innerHTML = this.generatePropertiesUI(this.selectedLayer);
        this.attachPropertyListeners(this.selectedLayer);
    }

    generatePropertiesUI(layer) {
        const { type, properties } = layer;
        
        switch(type) {
            case 'text':
                return `
                    <div class="property-group">
                        <label class="property-label">Text Content</label>
                        <input type="text" class="form-input" id="prop-text" value="${properties.text || ''}">
                    </div>
                    <div class="property-group">
                        <label class="property-label">Font Size</label>
                        <div class="slider-group">
                            <input type="range" class="slider" id="prop-font-size" min="10" max="100" value="${properties.fontSize || 24}">
                            <span class="slider-value" id="font-size-value">${properties.fontSize || 24}</span>
                        </div>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Font Family</label>
                        <select class="form-select" id="prop-font-family">
                            <option ${properties.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option ${properties.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                            <option ${properties.fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
                            <option ${properties.fontFamily === 'Impact' ? 'selected' : ''}>Impact</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Text Color</label>
                        <div class="color-picker-group">
                            <input type="color" class="color-picker" id="prop-text-color" value="${properties.color || '#000000'}">
                            <input type="text" class="form-input" id="prop-text-color-hex" value="${properties.color || '#000000'}">
                        </div>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Position X</label>
                        <input type="number" class="form-input" id="prop-x" value="${properties.x || 0}">
                    </div>
                    <div class="property-group">
                        <label class="property-label">Position Y</label>
                        <input type="number" class="form-input" id="prop-y" value="${properties.y || 0}">
                    </div>
                `;
            
            case 'shape':
                return `
                    <div class="property-group">
                        <label class="property-label">Shape Type</label>
                        <select class="form-select" id="prop-shape">
                            <option ${properties.shape === 'rectangle' ? 'selected' : ''}>rectangle</option>
                            <option ${properties.shape === 'circle' ? 'selected' : ''}>circle</option>
                            <option ${properties.shape === 'triangle' ? 'selected' : ''}>triangle</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Color</label>
                        <div class="color-picker-group">
                            <input type="color" class="color-picker" id="prop-shape-color" value="${properties.color || '#00ffff'}">
                            <input type="text" class="form-input" id="prop-shape-color-hex" value="${properties.color || '#00ffff'}">
                        </div>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Width</label>
                        <input type="number" class="form-input" id="prop-width" value="${properties.width || 100}">
                    </div>
                    <div class="property-group">
                        <label class="property-label">Height</label>
                        <input type="number" class="form-input" id="prop-height" value="${properties.height || 100}">
                    </div>
                    <div class="property-group">
                        <label class="property-label">Position X</label>
                        <input type="number" class="form-input" id="prop-x" value="${properties.x || 0}">
                    </div>
                    <div class="property-group">
                        <label class="property-label">Position Y</label>
                        <input type="number" class="form-input" id="prop-y" value="${properties.y || 0}">
                    </div>
                `;
            
            case 'gradient':
                return `
                    <div class="property-group">
                        <label class="property-label">Color 1</label>
                        <div class="color-picker-group">
                            <input type="color" class="color-picker" id="prop-grad-color1" value="${properties.colors?.[0] || '#00ffff'}">
                            <input type="text" class="form-input" id="prop-grad-color1-hex" value="${properties.colors?.[0] || '#00ffff'}">
                        </div>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Color 2</label>
                        <div class="color-picker-group">
                            <input type="color" class="color-picker" id="prop-grad-color2" value="${properties.colors?.[1] || '#ff00ff'}">
                            <input type="text" class="form-input" id="prop-grad-color2-hex" value="${properties.colors?.[1] || '#ff00ff'}">
                        </div>
                    </div>
                    <div class="property-group">
                        <label class="property-label">Direction</label>
                        <select class="form-select" id="prop-grad-direction">
                            <option ${properties.direction === 'horizontal' ? 'selected' : ''}>horizontal</option>
                            <option ${properties.direction === 'vertical' ? 'selected' : ''}>vertical</option>
                            <option ${properties.direction === 'diagonal' ? 'selected' : ''}>diagonal</option>
                        </select>
                    </div>
                `;
            
            default:
                return '<p>Properties panel for this layer type coming soon!</p>';
        }
    }

    attachPropertyListeners(layer) {
        // Text properties
        if (layer.type === 'text') {
            document.getElementById('prop-text')?.addEventListener('input', (e) => {
                layer.properties.text = e.target.value;
                this.render();
            });
            
            document.getElementById('prop-font-size')?.addEventListener('input', (e) => {
                layer.properties.fontSize = parseInt(e.target.value);
                document.getElementById('font-size-value').textContent = e.target.value;
                this.render();
            });
            
            document.getElementById('prop-text-color')?.addEventListener('input', (e) => {
                layer.properties.color = e.target.value;
                document.getElementById('prop-text-color-hex').value = e.target.value;
                this.render();
            });
            
            ['prop-x', 'prop-y'].forEach(id => {
                document.getElementById(id)?.addEventListener('input', (e) => {
                    layer.properties[id.replace('prop-', '')] = parseInt(e.target.value) || 0;
                    this.render();
                });
            });
        }
        
        // Shape properties
        if (layer.type === 'shape') {
            document.getElementById('prop-shape')?.addEventListener('change', (e) => {
                layer.properties.shape = e.target.value;
                this.render();
            });
            
            document.getElementById('prop-shape-color')?.addEventListener('input', (e) => {
                layer.properties.color = e.target.value;
                document.getElementById('prop-shape-color-hex').value = e.target.value;
                this.render();
            });
            
            ['prop-width', 'prop-height', 'prop-x', 'prop-y'].forEach(id => {
                document.getElementById(id)?.addEventListener('input', (e) => {
                    layer.properties[id.replace('prop-', '')] = parseInt(e.target.value) || 0;
                    this.render();
                });
            });
        }
        
        // Gradient properties
        if (layer.type === 'gradient') {
            ['prop-grad-color1', 'prop-grad-color2'].forEach(id => {
                document.getElementById(id)?.addEventListener('input', (e) => {
                    const index = id === 'prop-grad-color1' ? 0 : 1;
                    if (!layer.properties.colors) layer.properties.colors = ['#00ffff', '#ff00ff'];
                    layer.properties.colors[index] = e.target.value;
                    document.getElementById(id + '-hex').value = e.target.value;
                    this.render();
                });
            });
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render all visible layers in order
        this.layers
            .filter(layer => layer.visible)
            .sort((a, b) => a.order - b.order)
            .forEach(layer => {
                this.renderLayer(layer);
            });
    }

    renderLayer(layer) {
        this.ctx.save();
        
        // Set opacity
        this.ctx.globalAlpha = (layer.opacity || 100) / 100;
        
        switch(layer.type) {
            case 'background':
                this.ctx.fillStyle = layer.properties.color || '#ffffff';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
            
            case 'text':
                this.ctx.fillStyle = layer.properties.color || '#000000';
                this.ctx.font = `${layer.properties.fontSize || 24}px ${layer.properties.fontFamily || 'Arial'}`;
                this.ctx.fillText(
                    layer.properties.text || 'Sample Text',
                    layer.properties.x || 50,
                    layer.properties.y || 50
                );
                break;
            
            case 'shape':
                this.ctx.fillStyle = layer.properties.color || '#00ffff';
                const { x, y, width, height } = layer.properties;
                
                switch(layer.properties.shape) {
                    case 'rectangle':
                        this.ctx.fillRect(x || 50, y || 50, width || 100, height || 100);
                        break;
                    case 'circle':
                        this.ctx.beginPath();
                        this.ctx.arc((x || 50) + (width || 100)/2, (y || 50) + (height || 100)/2, (width || 100)/2, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                    case 'triangle':
                        this.ctx.beginPath();
                        this.ctx.moveTo((x || 50) + (width || 100)/2, y || 50);
                        this.ctx.lineTo(x || 50, (y || 50) + (height || 100));
                        this.ctx.lineTo((x || 50) + (width || 100), (y || 50) + (height || 100));
                        this.ctx.closePath();
                        this.ctx.fill();
                        break;
                }
                break;
            
            case 'gradient':
                const colors = layer.properties.colors || ['#00ffff', '#ff00ff'];
                let gradient;
                
                if (layer.properties.direction === 'horizontal') {
                    gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
                } else if (layer.properties.direction === 'vertical') {
                    gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                } else {
                    gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
                }
                
                gradient.addColorStop(0, colors[0]);
                gradient.addColorStop(1, colors[1]);
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
        }
        
        this.ctx.restore();
    }

    onMouseDown(e) {
        // Handle canvas interaction
    }

    onMouseMove(e) {
        // Handle mouse movement
    }

    onMouseUp(e) {
        // Handle mouse release
    }

    handleKeyboard(e) {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                this.saveCape();
            }
            if (e.key === 'e') {
                e.preventDefault();
                this.exportCape();
            }
        }
    }

    zoomIn() {
        this.zoom = Math.min(this.zoom + 0.1, 3);
        this.updateZoom();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom - 0.1, 0.5);
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
        // Apply zoom transform
        this.canvas.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`;
    }

    saveCape() {
        const capeData = {
            layers: this.layers,
            timestamp: Date.now()
        };
        
        localStorage.setItem('saved_cape', JSON.stringify(capeData));
        alert('Cape saved successfully!');
    }

    exportCape() {
        // Create download link
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
            this.render();
        }
    }
}

// Initialize builder when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.builder = new CapeBuilder();
});

