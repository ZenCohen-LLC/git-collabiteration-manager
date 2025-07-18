# Widget Integration Guide

## Overview
The Collabiteration Widget is a lightweight, injectable UI component that provides real-time iteration tracking and collaboration features. It integrates with any web application using a single script tag, similar to Intercom or Crisp.

## Quick Start

### Basic Integration
Add this script to your HTML:

```html
<script>
  window.CollabiterationSettings = {
    api_key: 'YOUR_API_KEY',
    iteration_id: 'current-iteration-id'
  };
  
  (function(){
    var w=window;var ic=w.Collabiteration=w.Collabiteration||[];
    if(ic.invoked)return;ic.invoked=!0;ic.SNIPPET_VERSION="1.0.0";
    ic.load=function(){
      var s=document.createElement("script");
      s.type="text/javascript";s.async=!0;
      s.src="https://widget.collabiteration.dev/v1/loader.js";
      var x=document.getElementsByTagName("script")[0];
      x.parentNode.insertBefore(s,x)
    };ic.load()
  })();
</script>
```

### React Integration
```jsx
import { useEffect } from 'react';

function MyApp() {
  useEffect(() => {
    window.CollabiterationSettings = {
      api_key: process.env.REACT_APP_COLLABITERATION_KEY,
      iteration_id: process.env.REACT_APP_ITERATION_ID
    };
    
    // Load widget
    if (!window.Collabiteration) {
      const script = document.createElement('script');
      script.src = 'https://widget.collabiteration.dev/v1/loader.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);
  
  return <div>Your app content</div>;
}
```

## Configuration Options

### Required Settings
```javascript
window.CollabiterationSettings = {
  api_key: 'YOUR_API_KEY',        // Required: Your project API key
  iteration_id: 'iteration-name'   // Required: Current iteration identifier
};
```

### Optional Settings
```javascript
window.CollabiterationSettings = {
  // ... required settings ...
  
  // User identification
  user: {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com'
  },
  
  // UI customization
  theme: {
    position: 'bottom-right',      // Widget position: bottom-right (default), bottom-left, top-right, top-left
    primaryColor: '#6B46C1',       // Primary color (purple gradient default)
    zIndex: 999999,                // Widget z-index
    offset: {                      // Position offset from edges
      horizontal: 20,
      vertical: 20
    }
  },
  
  // Feature toggles
  features: {
    realTime: true,                // Enable real-time updates
    analytics: true,               // Track user interactions
    keyboard: true,                // Enable keyboard shortcuts (Ctrl+Shift+C)
    sound: false                   // Sound notifications
  },
  
  // Callbacks
  onReady: function() {
    console.log('Widget loaded');
  },
  onOpen: function() {
    console.log('Widget opened');
  },
  onClose: function() {
    console.log('Widget closed');
  }
};
```

## Widget Architecture

### Components

1. **Loader Script** (`loader.js`)
   - Minimal script (~2KB gzipped)
   - Checks browser compatibility
   - Loads main widget bundle
   - Initializes configuration

2. **Widget Bundle** (`widget.bundle.js`)
   - React application (~450KB gzipped)
   - Lazy-loaded components
   - WebSocket connection
   - State management

3. **Launcher Button**
   - Fixed position overlay
   - Purple-blue gradient background
   - White robot icon (Font Awesome)
   - Smooth animations

4. **Modal Interface**
   - Shadow DOM isolation
   - Tab-based navigation
   - Responsive design
   - Keyboard accessible

### Technical Implementation

#### Shadow DOM Isolation
```javascript
class CollabiterationWidget {
  constructor() {
    this.shadowRoot = this.createShadowRoot();
    this.injectStyles();
    this.renderComponents();
  }
  
  createShadowRoot() {
    const host = document.createElement('div');
    host.id = 'collabiteration-widget-host';
    document.body.appendChild(host);
    return host.attachShadow({ mode: 'closed' });
  }
  
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = widgetStyles;
    this.shadowRoot.appendChild(style);
  }
}
```

#### Style Isolation
The widget uses several techniques to prevent style conflicts:

1. **Shadow DOM**: Complete style encapsulation
2. **CSS Modules**: Scoped class names
3. **CSS-in-JS**: Runtime style generation
4. **Reset Styles**: Normalized base styles

Example isolated styles:
```css
/* All styles scoped to shadow DOM */
:host {
  all: initial;
  position: fixed;
  z-index: 999999;
}

.cbr-launcher {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #6B46C1 0%, #4338CA 100%);
  box-shadow: 0 4px 12px rgba(107, 70, 193, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
}

.cbr-launcher:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(107, 70, 193, 0.6);
}
```

## API Communication

### Authentication
```javascript
// Widget automatically includes API key in requests
fetch('https://api.collabiteration.dev/api/widget/config', {
  headers: {
    'Authorization': `Bearer ${settings.api_key}`,
    'X-Iteration-ID': settings.iteration_id
  }
});
```

### WebSocket Connection
```javascript
// Automatic reconnection with exponential backoff
const socket = new WebSocket('wss://api.collabiteration.dev/ws');

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: 'auth',
    api_key: settings.api_key
  }));
  
  socket.send(JSON.stringify({
    type: 'subscribe',
    channel: 'iteration',
    id: settings.iteration_id
  }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleRealtimeUpdate(data);
};
```

## Widget Features

### Overview Tab
- Iteration metadata display
- Current lifecycle stage
- Status indicators
- Quick action buttons

### Plan Tab
- Markdown rendering
- Phase/task tracking
- Progress visualization
- Checklist interactions

### History Tab
- Event timeline
- User activity
- Change tracking
- Filtering options

### Actions Menu
- Stage transitions
- Share iteration
- Export data
- Settings

## Performance Optimization

### Bundle Size
- Core loader: ~2KB gzipped
- Main bundle: ~450KB gzipped
- Lazy-loaded features
- Code splitting by route

### Loading Strategy
```javascript
// Progressive enhancement
1. Load minimal launcher
2. User interaction triggers main bundle
3. Lazy load features as needed
4. Cache assets aggressively
```

### Caching
```javascript
// Service worker for offline support
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('widget.collabiteration.dev')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(response => {
          return caches.open('cbr-widget-v1').then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

## Browser Support

### Supported Browsers
- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers (iOS Safari, Chrome Android)

### Polyfills
Automatically included for:
- Shadow DOM
- Custom Elements
- Fetch API
- WebSocket

## Security Considerations

### Content Security Policy
Add to your CSP:
```
script-src 'self' https://widget.collabiteration.dev;
connect-src 'self' https://api.collabiteration.dev wss://api.collabiteration.dev;
frame-src 'self' https://widget.collabiteration.dev;
```

### API Key Security
- Use environment variables
- Never expose service role keys
- Rotate keys regularly
- Monitor usage

## Troubleshooting

### Widget Not Loading
1. Check browser console for errors
2. Verify API key is correct
3. Ensure iteration_id exists
4. Check CSP headers

### Common Issues

**"Invalid API key"**
```javascript
// Verify key format
console.log(window.CollabiterationSettings.api_key);
// Should start with cbr_test_ or cbr_live_
```

**"Widget conflicts with my styles"**
```javascript
// Force higher z-index
window.CollabiterationSettings.theme.zIndex = 2147483647;
```

**"WebSocket disconnecting"**
```javascript
// Check network tab for connection
// Widget auto-reconnects with backoff
```

## Advanced Usage

### Programmatic Control
```javascript
// Open widget
window.Collabiteration.open();

// Close widget
window.Collabiteration.close();

// Update user
window.Collabiteration.updateUser({
  id: 'new-user-id',
  name: 'Jane Doe'
});

// Track custom event
window.Collabiteration.track('custom_event', {
  metadata: 'value'
});

// Get current iteration
const iteration = await window.Collabiteration.getIteration();
```

### Custom Styling
```javascript
window.CollabiterationSettings.customStyles = `
  .cbr-launcher {
    background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%) !important;
  }
`;
```

### Disable Auto-Init
```javascript
window.CollabiterationSettings.autoInit = false;

// Initialize manually later
window.Collabiteration.init();
```

## Development Setup

### Local Testing
```bash
# Set environment to development
window.CollabiterationSettings.environment = 'development';
window.CollabiterationSettings.widgetUrl = 'http://localhost:3001';
```

### Debug Mode
```javascript
window.CollabiterationSettings.debug = true;
// Enables verbose logging
```

## Migration Guide

### From Embedded Assistant
```javascript
// Before: Embedded in your app
import { IterationAssistant } from './components/iteration-assistant';

// After: External widget
<script src="https://widget.collabiteration.dev/v1/loader.js"></script>
```

### Data Migration
Existing iteration data is automatically synchronized when you connect the widget.

## Support

- Documentation: https://docs.collabiteration.dev/widget
- Issues: https://github.com/zencohen-llc/collabiteration-widget/issues
- Email: support@collabiteration.dev