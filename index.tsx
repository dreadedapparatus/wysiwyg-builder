import React, { useState, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- TYPES ---
type ComponentType = 'text' | 'image' | 'button' | 'spacer' | 'layout' | 'card' | 'divider' | 'social' | 'video' | 'logo' | 'footer' | 'button-group';

// Define a new type for component creation that includes layout types.
type CreationComponentType = ComponentType | 'two-column' | 'three-column';

interface BaseComponent {
  id: string;
  type: ComponentType;
}

// --- Content Components ---
interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
  fontSize: string;
  color: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
}

interface FooterComponent extends BaseComponent {
    type: 'footer';
    content: string;
    fontSize: string;
    color: string;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right';
}

interface ImageComponent extends BaseComponent {
  type: 'image';
  src: string;
  alt: string;
  previewSrc?: string;
  borderRadius: string;
  width: string;
  alignment: 'left' | 'center' | 'right';
  naturalWidth?: number;
  naturalHeight?: number;
}

interface LogoComponent extends BaseComponent {
    type: 'logo';
    src: string;
    alt: string;
    previewSrc?: string;
    width: string;
    alignment: 'left' | 'center' | 'right';
    naturalWidth?: number;
    naturalHeight?: number;
}

interface ButtonComponent extends BaseComponent {
  type: 'button';
  text: string;
  href: string;
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  fontWeight: 'normal' | 'bold';
}

interface SubButton {
    id: string;
    text: string;
    href: string;
    backgroundColor: string;
    textColor: string;
}

interface ButtonGroupComponent extends BaseComponent {
    type: 'button-group';
    buttons: SubButton[];
    alignment: 'left' | 'center' | 'right';
}

interface SpacerComponent extends BaseComponent {
  type: 'spacer';
  height: string;
}

interface DividerComponent extends BaseComponent {
    type: 'divider';
    color: string;
    height: string;
    padding: string;
}

interface SocialLink {
    id: string;
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'website';
    url: string;
}
interface SocialComponent extends BaseComponent {
    type: 'social';
    links: SocialLink[];
    alignment: 'left' | 'center' | 'right';
}

interface VideoComponent extends BaseComponent {
    type: 'video';
    videoUrl: string;
    imageUrl: string;
    alt: string;
    previewSrc?: string;
    width: string;
    alignment: 'left' | 'center' | 'right';
    naturalWidth?: number;
    naturalHeight?: number;
}

interface CardComponent extends BaseComponent {
  type: 'card';
  src: string;
  previewSrc?: string;
  alt: string;
  title: string;
  content: string;
  buttonText: string;
  buttonHref: string;
  backgroundColor: string;
  textColor: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

type ContentComponent = 
    | TextComponent 
    | ImageComponent 
    | ButtonComponent 
    | SpacerComponent 
    | CardComponent 
    | DividerComponent 
    | SocialComponent 
    | VideoComponent
    | LogoComponent
    | FooterComponent
    | ButtonGroupComponent;

// --- Layout Component ---
interface Column {
  id: string;
  components: ContentComponent[];
}

interface ColumnLayoutComponent extends BaseComponent {
  type: 'layout';
  layoutType: 'two-column' | 'three-column';
  columns: Column[];
}

type EmailComponent = ContentComponent | ColumnLayoutComponent;

interface EmailSettings {
  backgroundColor: string;
  contentBackgroundColor: string;
}

// Target for drag-and-drop operations
type DropTarget = 
  | { type: 'root'; index: number }
  | { type: 'column'; layoutId: string; columnIndex: number; index: number };

// --- UI COMPONENTS ---

const COMPONENT_TYPES: { type: CreationComponentType, label: string, icon: string, isLayout?: boolean }[] = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'button', label: 'Button', icon: '🔘' },
  { type: 'button-group', label: 'Buttons', icon: '[ B ]' },
  { type: 'divider', label: 'Divider', icon: '—' },
  { type: 'social', label: 'Social', icon: '🌐' },
  { type: 'video', label: 'Video', icon: '▶️' },
  { type: 'spacer', label: 'Spacer', icon: '⬍' },
  { type: 'logo', label: 'Logo', icon: '🏢' },
  { type: 'footer', label: 'Footer', icon: '📜' },
  { type: 'card', label: 'Card', icon: '🃏' },
  { type: 'two-column', label: '2 Columns', icon: '||', isLayout: true },
  { type: 'three-column', label: '3 Columns', icon: '|||', isLayout: true },
];

const ComponentsPanel = () => {
  const onDragStart = (e: React.DragEvent, componentType: CreationComponentType) => {
    e.dataTransfer.setData('application/reactflow', componentType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="components-panel">
      <h3>Components</h3>
      <div className="component-grid">
        {COMPONENT_TYPES.map(({ type, label, icon, isLayout }) => (
          <div
            key={type}
            className={`component-item ${isLayout ? 'layout-item' : ''}`}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
          >
            <div className="icon">{icon}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SOCIAL_ICONS = {
  facebook: 'https://img.icons8.com/fluent/48/000000/facebook-new.png',
  twitter: 'https://img.icons8.com/fluent/48/000000/twitter.png',
  instagram: 'https://img.icons8.com/fluent/48/000000/instagram-new.png',
  linkedin: 'https://img.icons8.com/fluent/48/000000/linkedin.png',
  youtube: 'https://img.icons8.com/fluent/48/000000/youtube-play.png',
  website: 'https://img.icons8.com/fluent/48/000000/domain.png'
};

const Canvas = ({ components, setComponents, selectedId, setSelectedId, emailSettings }) => {
  const [dragOverTarget, setDragOverTarget] = useState<DropTarget | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  const createNewComponent = (type: CreationComponentType): EmailComponent => {
    const id = `comp_${Date.now()}`;
    switch (type) {
      case 'text':
        return { id, type, content: 'This is a new text block. Click to edit!', fontSize: '16', color: '#000000', fontFamily: 'Arial', textAlign: 'left' };
      case 'image':
        return { id, type, src: 'https://via.placeholder.com/600x300', alt: 'Placeholder', borderRadius: '0', width: '100', alignment: 'center', naturalWidth: 600, naturalHeight: 300 };
      case 'button':
        return { id, type, text: 'Click Me', href: '#', backgroundColor: '#0d6efd', textColor: '#ffffff', fontSize: '16', fontWeight: 'normal' };
      case 'spacer':
        return { id, type, height: '20' };
      case 'divider':
        return { id, type, color: '#cccccc', height: '1', padding: '10' };
      case 'social':
        return { id, type, alignment: 'center', links: [
            { id: `social_${Date.now()}_1`, platform: 'facebook', url: '#' },
            { id: `social_${Date.now()}_2`, platform: 'twitter', url: '#' },
            { id: `social_${Date.now()}_3`, platform: 'instagram', url: '#' },
        ]};
      case 'video':
        return { id, type, videoUrl: '#', imageUrl: 'https://via.placeholder.com/600x300?text=Video+Thumbnail', alt: 'Video thumbnail', width: '100', alignment: 'center', naturalWidth: 600, naturalHeight: 300 };
      case 'card':
        return { id, type, src: 'https://via.placeholder.com/600x400', alt: 'Card Image', title: 'Card Title', content: 'This is some card content. Describe the item or feature here.', buttonText: 'Learn More', buttonHref: '#', backgroundColor: '#f8f9fa', textColor: '#212529', buttonBackgroundColor: '#0d6efd', buttonTextColor: '#ffffff', naturalWidth: 600, naturalHeight: 400 };
      case 'logo':
        return { id, type, src: 'https://via.placeholder.com/150x50?text=Your+Logo', alt: 'Company Logo', width: '150', alignment: 'center', naturalWidth: 150, naturalHeight: 50 };
      case 'footer':
        return { id, type, content: 'Your Company Name<br>123 Street, City, State 12345<br><a href="#" style="color: #888888; text-decoration: underline;">Unsubscribe</a>', fontSize: '12', color: '#888888', fontFamily: 'Arial', textAlign: 'center' };
      case 'button-group':
        return { id, type, alignment: 'center', buttons: [
            { id: `btn_${Date.now()}_1`, text: 'Button 1', href: '#', backgroundColor: '#0d6efd', textColor: '#ffffff' },
            { id: `btn_${Date.now()}_2`, text: 'Button 2', href: '#', backgroundColor: '#6c757d', textColor: '#ffffff' },
        ]};
      case 'two-column':
        return { id, type: 'layout', layoutType: 'two-column', columns: [{ id: `col_${Date.now()}_1`, components: [] }, { id: `col_${Date.now()}_2`, components: [] }] };
      case 'three-column':
        return { id, type: 'layout', layoutType: 'three-column', columns: [{ id: `col_${Date.now()}_1`, components: [] }, { id: `col_${Date.now()}_2`, components: [] }, { id: `col_${Date.now()}_3`, components: [] }] };
      default:
        throw new Error('Unknown component type');
    }
  };
  
  const recursiveDelete = (items: EmailComponent[], idToDelete: string): EmailComponent[] => {
    const filtered = items.filter(c => c.id !== idToDelete);
    return filtered.map(c => {
        if (c.type === 'layout') {
            return {
                ...c,
                columns: c.columns.map(col => ({
                    ...col,
                    components: recursiveDelete(col.components, idToDelete) as ContentComponent[]
                }))
            };
        }
        return c;
    });
  };

  const insertComponent = (items: EmailComponent[], target: DropTarget, componentToAdd: EmailComponent): EmailComponent[] => {
    if (target.type === 'root') {
        const newItems = [...items];
        newItems.splice(target.index, 0, componentToAdd);
        return newItems;
    } else { // 'column'
        return items.map(c => {
            if (c.id === target.layoutId && c.type === 'layout') {
                const newColumns = c.columns.map((col, index) => {
                    if (index === target.columnIndex) {
                        const newComponents = [...col.components];
                        newComponents.splice(target.index, 0, componentToAdd as ContentComponent);
                        return { ...col, components: newComponents };
                    }
                    return col;
                });
                return { ...c, columns: newColumns };
            }
            return c;
        });
    }
  };

  const handleAddComponent = (target: DropTarget, newComponent: EmailComponent) => {
    setComponents(prev => insertComponent(prev, target, newComponent));
    setSelectedId(newComponent.id);
  }

  const handleDeleteComponent = (idToDelete: string) => {
    if (selectedId === idToDelete) {
        setSelectedId(null);
    }
    setComponents(prev => recursiveDelete(prev, idToDelete));
  }

  const handleDrop = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    const newComponentType = e.dataTransfer.getData('application/reactflow') as CreationComponentType;
    const movedComponentData = e.dataTransfer.getData('application/json-component');

    if (movedComponentData) {
        // --- This is a MOVE operation ---
        const movedComponent = JSON.parse(movedComponentData) as EmailComponent;
        
        setComponents(prev => {
            const componentsAfterDelete = recursiveDelete(prev, movedComponent.id);
            return insertComponent(componentsAfterDelete, target, movedComponent);
        });
        setSelectedId(movedComponent.id);

    } else if (newComponentType) {
        // --- This is an ADD operation ---
        const newComponent = createNewComponent(newComponentType);
        handleAddComponent(target, newComponent);
    } 
  };


  const handleDragOver = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(target);
  };

  const renderContentComponent = (component: ContentComponent) => {
      switch (component.type) {
      case 'text':
      case 'footer':
          return <div dangerouslySetInnerHTML={{ __html: component.content }} style={{ padding: '10px', fontSize: `${component.fontSize}px`, color: component.color, fontFamily: component.fontFamily, textAlign: component.textAlign }} />;
      case 'image':
          return (
            <div style={{ textAlign: component.alignment, padding: '10px 0' }}>
              <img 
                src={component.previewSrc || component.src} 
                alt={component.alt} 
                style={{ 
                    width: `${component.width}%`, 
                    maxWidth: '100%', 
                    display: 'inline-block', 
                    borderRadius: `${component.borderRadius}px` 
                }} 
              />
            </div>
          );
      case 'logo':
          return <div style={{ textAlign: component.alignment, padding: '10px' }}><img src={component.previewSrc || component.src} alt={component.alt} style={{ width: `${component.width}px`, maxWidth: '100%', display: 'inline-block' }} /></div>;
      case 'button':
          return (
          <div style={{ padding: '10px', textAlign: 'center' }}>
              <a href={component.href} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: component.backgroundColor,
              color: component.textColor,
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: `${component.fontSize}px`,
              fontWeight: component.fontWeight,
              }}>
              {component.text}
              </a>
          </div>
          );
      case 'button-group':
          return (
            <div style={{ padding: '10px', textAlign: component.alignment }}>
                {component.buttons.map(btn => (
                     <a key={btn.id} href={btn.href} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: btn.backgroundColor,
                        color: btn.textColor,
                        textDecoration: 'none',
                        borderRadius: '5px',
                        margin: '0 5px'
                     }}>
                        {btn.text}
                     </a>
                ))}
            </div>
          );
      case 'spacer':
          return <div style={{ height: `${component.height}px` }} />;
      case 'divider':
          return <div style={{ padding: `${component.padding}px 0` }}><hr style={{ border: 'none', borderTop: `${component.height}px solid ${component.color}` }} /></div>;
      case 'social':
          return (
            <div style={{ padding: '10px', textAlign: component.alignment }}>
              {component.links.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0 5px' }}>
                      <img src={SOCIAL_ICONS[link.platform]} alt={link.platform} width="32" height="32" />
                  </a>
              ))}
            </div>
          );
       case 'video':
            return (
                <div style={{ padding: '10px 0', textAlign: component.alignment }}>
                    <a href={component.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', width: `${component.width}%`, position: 'relative' }}>
                        <img src={component.previewSrc || component.imageUrl} alt={component.alt} style={{ width: '100%', display: 'block' }} />
                        <div className="video-play-button">▶</div>
                    </a>
                </div>
            );
      case 'card':
          return (
              <div style={{ backgroundColor: component.backgroundColor, color: component.textColor, padding: '15px', borderRadius: '5px' }}>
                  <img src={component.previewSrc || component.src} alt={component.alt} style={{ maxWidth: '100%', display: 'block' }} />
                  <h4 style={{ margin: '10px 0 5px' }}>{component.title}</h4>
                  <p style={{ margin: '0 0 10px' }}>{component.content}</p>
                  <div style={{ textAlign: 'center' }}>
                       <a href={component.buttonHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: component.buttonBackgroundColor, color: component.buttonTextColor, textDecoration: 'none', borderRadius: '5px' }}>{component.buttonText}</a>
                  </div>
              </div>
          );
      default:
          return null;
      }
  };

  const DropZone = ({ target }: { target: DropTarget }) => {
    const isActive = JSON.stringify(dragOverTarget) === JSON.stringify(target);
    return (
        <div 
            className={`drop-zone ${isActive ? 'active' : ''}`}
            onDragOver={(e) => handleDragOver(e, target)}
            onDrop={(e) => handleDrop(e, target)}
        />
    );
  };

  const RenderItem = ({ component }: { component: EmailComponent }) => {
    const isLayout = component.type === 'layout';
    
    const clickHandler = isLayout
      ? undefined
      : (e: React.MouseEvent) => {
          e.stopPropagation();
          setSelectedId(component.id);
        };
        
    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/json-component', JSON.stringify(component));
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDraggingId(component.id), 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggingId(null);
    };
    
    return (
    <div
      className={`canvas-component ${selectedId === component.id ? 'selected' : ''} ${draggingId === component.id ? 'dragging' : ''}`}
      onClick={clickHandler}
      draggable={!isLayout}
      onDragStart={isLayout ? undefined : handleDragStart}
      onDragEnd={isLayout ? undefined : handleDragEnd}
    >
      {selectedId === component.id && (
         <div className="component-toolbar">
           <div className="drag-handle">✥</div>
           <span>{component.type.charAt(0).toUpperCase() + component.type.slice(1)}</span>
           <button className="toolbar-button delete" onClick={(e) => { e.stopPropagation(); handleDeleteComponent(component.id); }}>
             🗑️
           </button>
         </div>
      )}
      {component.type === 'layout' ? (
          <div className={`layout-grid ${component.layoutType}`}>
              {component.columns.map((col, colIndex) => {
                  const targetForEmpty: DropTarget = {type: 'column', layoutId: component.id, columnIndex: colIndex, index: 0};
                  const isEmptyColumnActive = JSON.stringify(dragOverTarget) === JSON.stringify(targetForEmpty);

                  return (
                      <div key={col.id} className="layout-column">
                          {col.components.length === 0 ? (
                              <div
                                  className={`empty-column-dropzone ${isEmptyColumnActive ? 'active' : ''}`}
                                  onDragOver={(e) => handleDragOver(e, targetForEmpty)}
                                  onDrop={(e) => handleDrop(e, targetForEmpty)}
                               >
                                  <span className="icon">➕</span>
                                  <span>Drop Here</span>
                              </div>
                          ) : (
                              <>
                                  <DropZone target={{type: 'column', layoutId: component.id, columnIndex: colIndex, index: 0}} />
                                  {col.components.map((innerComp, innerIndex) => (
                                      <React.Fragment key={innerComp.id}>
                                          <RenderItem component={innerComp} />
                                          <DropZone target={{type: 'column', layoutId: component.id, columnIndex: colIndex, index: innerIndex + 1}} />
                                      </React.Fragment>
                                  ))}
                              </>
                          )}
                      </div>
                  )
              })}
          </div>
      ) : renderContentComponent(component as ContentComponent)}
    </div>
  );
};

  return (
    <div className="canvas-container" onDragLeave={() => setDragOverTarget(null)} style={{ backgroundColor: emailSettings.backgroundColor }}>
      <div className="canvas" style={{ backgroundColor: emailSettings.contentBackgroundColor }}>
        {components.length === 0 ? (
          <div className="empty-canvas" 
               onDragOver={(e) => handleDragOver(e, { type: 'root', index: 0 })} 
               onDrop={(e) => handleDrop(e, { type: 'root', index: 0 })}>
            <div className='icon'>✨</div>
            <h3>Let's build an email</h3>
            <p>Drag a component from the left panel to get started.</p>
          </div>
        ) : (
          <>
            <DropZone target={{ type: 'root', index: 0 }} />
            {components.map((component, index) => (
              <React.Fragment key={component.id}>
                 <RenderItem component={component} />
                 <DropZone target={{ type: 'root', index: index + 1 }} />
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  );
};


const PropertiesPanel = ({ component, onUpdate, emailSettings, onUpdateSettings }) => {
    const FONT_FAMILIES = ['Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Brush Script MT'];
    const SOCIAL_PLATFORMS = Object.keys(SOCIAL_ICONS) as SocialLink['platform'][];
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!component) {
        return (
            <div className="properties-panel">
                <h3>Email Settings</h3>
                <div className="form-group">
                    <label>Background Color</label>
                    <div className="color-input-group">
                         <input type="color" value={emailSettings.backgroundColor} onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })} />
                         <input type="text" value={emailSettings.backgroundColor} onChange={(e) => onUpdateSettings({ backgroundColor: e.target.value })} />
                    </div>
                </div>
                <div className="form-group">
                    <label>Content Area Color</label>
                    <div className="color-input-group">
                         <input type="color" value={emailSettings.contentBackgroundColor} onChange={(e) => onUpdateSettings({ contentBackgroundColor: e.target.value })} />
                         <input type="text" value={emailSettings.contentBackgroundColor} onChange={(e) => onUpdateSettings({ contentBackgroundColor: e.target.value })} />
                    </div>
                </div>
            </div>
        );
    }
    
    const handleChange = (prop: string, value: any) => {
        onUpdate(component.id, { ...component, [prop]: value });
    };
    
    const handleFormat = (e: React.MouseEvent, command: string) => {
        e.preventDefault();
        document.execCommand(command, false);
    };

    const getImageDimensions = (url: string): Promise<{ width: number, height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject('Could not load image');
            img.src = url;
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;
                try {
                    const { width, height } = await getImageDimensions(dataUrl);
                    onUpdate(component.id, {
                        ...component,
                        previewSrc: dataUrl,
                        naturalWidth: width,
                        naturalHeight: height
                    });
                } catch (error) {
                    console.error("Error getting image dimensions from uploaded file:", error);
                    onUpdate(component.id, { ...component, previewSrc: dataUrl });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const url = e.target.value;
        if (url) {
            try {
                const { width, height } = await getImageDimensions(url);
                onUpdate(component.id, { ...component, naturalWidth: width, naturalHeight: height });
            } catch (error) {
                 console.error("Error getting image dimensions from URL:", error);
                 onUpdate(component.id, { ...component, naturalWidth: undefined, naturalHeight: undefined });
            }
        }
    };

    const handleSocialLinkChange = (index: number, prop: keyof SocialLink, value: string) => {
        const newLinks = [...(component as SocialComponent).links];
        newLinks[index] = { ...newLinks[index], [prop]: value };
        handleChange('links', newLinks);
    };

    const addSocialLink = () => {
        const newLinks = [...(component as SocialComponent).links, { id: `social_${Date.now()}`, platform: 'website', url: '#' }];
        handleChange('links', newLinks);
    };

    const removeSocialLink = (index: number) => {
        const newLinks = [...(component as SocialComponent).links];
        newLinks.splice(index, 1);
        handleChange('links', newLinks);
    };

    const handleButtonChange = (index: number, prop: keyof SubButton, value: string) => {
        const newButtons = [...(component as ButtonGroupComponent).buttons];
        newButtons[index] = { ...newButtons[index], [prop]: value };
        handleChange('buttons', newButtons);
    };
    
    const addGroupButton = () => {
        const newButtons = [...(component as ButtonGroupComponent).buttons, { id: `btn_${Date.now()}`, text: 'New Button', href: '#', backgroundColor: '#6c757d', textColor: '#ffffff' }];
        handleChange('buttons', newButtons);
    };
    
    const removeGroupButton = (index: number) => {
        const newButtons = [...(component as ButtonGroupComponent).buttons];
        newButtons.splice(index, 1);
        handleChange('buttons', newButtons);
    };

    const renderProperties = () => {
        switch (component.type) {
            case 'text': 
            case 'footer':
            return (
                <>
                    <div className="form-group">
                        <label>Font Family</label>
                        <select value={component.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                            {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Font Size</label>
                        <div className="slider-group">
                            <input
                                type="range"
                                min="8"
                                max="72"
                                value={component.fontSize}
                                onChange={(e) => handleChange('fontSize', e.target.value)}
                            />
                            <input 
                                type="number"
                                min="1"
                                className="slider-value-input"
                                value={component.fontSize} 
                                onChange={(e) => handleChange('fontSize', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>Color</label>
                            <div className="color-input-group">
                                <input type="color" value={component.color} onChange={(e) => handleChange('color', e.target.value)} />
                                <input type="text" value={component.color} onChange={(e) => handleChange('color', e.target.value)} />
                            </div>
                        </div>
                         <div className="form-group">
                            <label>Align</label>
                            <div className="text-align-group">
                                <button className={component.textAlign === 'left' ? 'active' : ''} onClick={() => handleChange('textAlign', 'left')}>L</button>
                                <button className={component.textAlign === 'center' ? 'active' : ''} onClick={() => handleChange('textAlign', 'center')}>C</button>
                                <button className={component.textAlign === 'right' ? 'active' : ''} onClick={() => handleChange('textAlign', 'right')}>R</button>
                            </div>
                        </div>
                    </div>
                   
                    <div className="form-group">
                        <label>Content</label>
                        <div className="rich-text-toolbar">
                            <button onMouseDown={(e) => handleFormat(e, 'bold')}><b>B</b></button>
                            <button onMouseDown={(e) => handleFormat(e, 'italic')}><i>I</i></button>
                            <button onMouseDown={(e) => handleFormat(e, 'underline')}><u>U</u></button>
                            <button onMouseDown={(e) => handleFormat(e, 'insertUnorderedList')}>●</button>
                            <button onMouseDown={(e) => handleFormat(e, 'insertOrderedList')}>1.</button>
                        </div>
                        <div 
                            className="rich-text-editor"
                            contentEditable
                            suppressContentEditableWarning
                            dangerouslySetInnerHTML={{ __html: component.content }}
                            onBlur={(e) => handleChange('content', e.target.innerHTML)}
                        />
                    </div>
                </>
            );
            case 'image': return (
                <>
                    <div className="form-group">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                        <button className="upload-button" onClick={() => fileInputRef.current?.click()}>Upload for Preview</button>
                    </div>
                    <div className="form-group">
                        <label>Image URL</label>
                        <input type="url" value={component.src} onChange={(e) => handleChange('src', e.target.value)} onBlur={handleUrlBlur} />
                        <p className="helper-text">The upload above is for preview only. You must provide a public URL here for the final email.</p>
                    </div>
                    <div className="form-group">
                        <label>Alt Text</label>
                        <input type="text" value={component.alt} onChange={(e) => handleChange('alt', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Width (%)</label>
                        <div className="slider-group">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={component.width}
                                onChange={(e) => handleChange('width', e.target.value)}
                            />
                            <input type="number" min="10" max="100" className="slider-value-input" value={component.width} onChange={(e) => handleChange('width', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Alignment</label>
                        <div className="text-align-group">
                            <button className={component.alignment === 'left' ? 'active' : ''} onClick={() => handleChange('alignment', 'left')}>L</button>
                            <button className={component.alignment === 'center' ? 'active' : ''} onClick={() => handleChange('alignment', 'center')}>C</button>
                            <button className={component.alignment === 'right' ? 'active' : ''} onClick={() => handleChange('alignment', 'right')}>R</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Corner Radius (px)</label>
                        <div className="slider-group">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={component.borderRadius}
                                onChange={(e) => handleChange('borderRadius', e.target.value)}
                            />
                            <input type="number" min="0" className="slider-value-input" value={component.borderRadius} onChange={(e) => handleChange('borderRadius', e.target.value)} />
                        </div>
                    </div>
                </>
            );
            case 'logo': return (
                <>
                    <div className="form-group">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                        <button className="upload-button" onClick={() => fileInputRef.current?.click()}>Upload for Preview</button>
                    </div>
                    <div className="form-group">
                        <label>Image URL</label>
                        <input type="url" value={component.src} onChange={(e) => handleChange('src', e.target.value)} onBlur={handleUrlBlur} />
                        <p className="helper-text">The upload above is for preview only. You must provide a public URL here for the final email.</p>
                    </div>
                    <div className="form-group">
                        <label>Alt Text</label>
                        <input type="text" value={component.alt} onChange={(e) => handleChange('alt', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>Width (px)</label>
                        <div className="slider-group">
                            <input type="range" min="20" max="400" value={component.width} onChange={(e) => handleChange('width', e.target.value)} />
                            <input type="number" min="1" className="slider-value-input" value={component.width} onChange={(e) => handleChange('width', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Alignment</label>
                        <div className="text-align-group">
                            <button className={component.alignment === 'left' ? 'active' : ''} onClick={() => handleChange('alignment', 'left')}>L</button>
                            <button className={component.alignment === 'center' ? 'active' : ''} onClick={() => handleChange('alignment', 'center')}>C</button>
                            <button className={component.alignment === 'right' ? 'active' : ''} onClick={() => handleChange('alignment', 'right')}>R</button>
                        </div>
                    </div>
                </>
            );
            case 'button': return (
                <>
                    <div className="form-group">
                        <label>Button Text</label>
                        <input type="text" value={component.text} onChange={(e) => handleChange('text', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>URL</label>
                        <input type="url" value={component.href} onChange={(e) => handleChange('href', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Font Size</label>
                        <div className="slider-group">
                            <input
                                type="range"
                                min="8"
                                max="48"
                                value={component.fontSize}
                                onChange={(e) => handleChange('fontSize', e.target.value)}
                            />
                            <input 
                                type="number"
                                min="1"
                                className="slider-value-input"
                                value={component.fontSize} 
                                onChange={(e) => handleChange('fontSize', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Font Weight</label>
                        <div className="button-toggle-group">
                            <button className={component.fontWeight === 'normal' ? 'active' : ''} onClick={() => handleChange('fontWeight', 'normal')}>Normal</button>
                            <button className={component.fontWeight === 'bold' ? 'active' : ''} onClick={() => handleChange('fontWeight', 'bold')}><b>Bold</b></button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Background Color</label>
                         <div className="color-input-group">
                             <input type="color" value={component.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                             <input type="text" value={component.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Text Color</label>
                        <div className="color-input-group">
                            <input type="color" value={component.textColor} onChange={(e) => handleChange('textColor', e.target.value)} />
                             <input type="text" value={component.textColor} onChange={(e) => handleChange('textColor', e.target.value)} />
                        </div>
                    </div>
                </>
            );
            case 'button-group': return (
                <>
                    <div className="form-group">
                        <label>Alignment</label>
                        <div className="text-align-group">
                            <button className={component.alignment === 'left' ? 'active' : ''} onClick={() => handleChange('alignment', 'left')}>L</button>
                            <button className={component.alignment === 'center' ? 'active' : ''} onClick={() => handleChange('alignment', 'center')}>C</button>
                            <button className={component.alignment === 'right' ? 'active' : ''} onClick={() => handleChange('alignment', 'right')}>R</button>
                        </div>
                    </div>
                     <div className="form-group">
                        <label>Buttons</label>
                        <div className="button-group-editor">
                            {component.buttons.map((btn, index) => (
                                <div key={btn.id} className="button-group-item">
                                    <input type="text" value={btn.text} onChange={(e) => handleButtonChange(index, 'text', e.target.value)} placeholder="Button Text" />
                                    <input type="url" value={btn.href} onChange={(e) => handleButtonChange(index, 'href', e.target.value)} placeholder="https://example.com" />
                                     <div className="color-input-group">
                                        <input type="color" title="Background Color" value={btn.backgroundColor} onChange={(e) => handleButtonChange(index, 'backgroundColor', e.target.value)} />
                                        <input type="color" title="Text Color" value={btn.textColor} onChange={(e) => handleButtonChange(index, 'textColor', e.target.value)} />
                                    </div>
                                    <button onClick={() => removeGroupButton(index)} className="remove-btn">🗑️</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addGroupButton} className="add-btn">Add Button</button>
                    </div>
                </>
            );
            case 'spacer': return (
                 <div className="form-group">
                    <label>Height (px)</label>
                    <input type="text" value={component.height} onChange={(e) => handleChange('height', e.target.value)} />
                </div>
            );
            case 'divider': return (
                <>
                    <div className="form-group">
                        <label>Color</label>
                        <div className="color-input-group">
                            <input type="color" value={component.color} onChange={(e) => handleChange('color', e.target.value)} />
                            <input type="text" value={component.color} onChange={(e) => handleChange('color', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Thickness (px)</label>
                        <input type="text" value={component.height} onChange={(e) => handleChange('height', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Vertical Padding (px)</label>
                        <input type="text" value={component.padding} onChange={(e) => handleChange('padding', e.target.value)} />
                    </div>
                </>
            );
             case 'social': return (
                <>
                    <div className="form-group">
                        <label>Alignment</label>
                        <div className="text-align-group">
                            <button className={component.alignment === 'left' ? 'active' : ''} onClick={() => handleChange('alignment', 'left')}>L</button>
                            <button className={component.alignment === 'center' ? 'active' : ''} onClick={() => handleChange('alignment', 'center')}>C</button>
                            <button className={component.alignment === 'right' ? 'active' : ''} onClick={() => handleChange('alignment', 'right')}>R</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Links</label>
                        <div className="social-link-editor">
                            {component.links.map((link, index) => (
                                <div key={link.id} className="social-link-item">
                                    <select value={link.platform} onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}>
                                        {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                    </select>
                                    <input type="url" value={link.url} onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} placeholder="https://example.com" />
                                    <button onClick={() => removeSocialLink(index)} className="remove-btn">🗑️</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addSocialLink} className="add-btn">Add Social Link</button>
                    </div>
                </>
            );
            case 'video': return (
                <>
                    <div className="form-group">
                        <label>Video URL</label>
                        <input type="url" value={component.videoUrl} onChange={(e) => handleChange('videoUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                        <p className="helper-text">The URL the user will be sent to when they click the image.</p>
                    </div>
                    <div className="form-group">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                        <button className="upload-button" onClick={() => fileInputRef.current?.click()}>Upload Thumbnail</button>
                    </div>
                    <div className="form-group">
                        <label>Thumbnail Image URL</label>
                        <input type="url" value={component.imageUrl} onChange={(e) => handleChange('imageUrl', e.target.value)} onBlur={handleUrlBlur} />
                        <p className="helper-text">The upload above is for preview only. You must provide a public URL.</p>
                    </div>
                    <div className="form-group">
                        <label>Alt Text</label>
                        <input type="text" value={component.alt} onChange={(e) => handleChange('alt', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>Width (%)</label>
                        <div className="slider-group">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={component.width}
                                onChange={(e) => handleChange('width', e.target.value)}
                            />
                            <input type="number" min="10" max="100" className="slider-value-input" value={component.width} onChange={(e) => handleChange('width', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Alignment</label>
                        <div className="text-align-group">
                            <button className={component.alignment === 'left' ? 'active' : ''} onClick={() => handleChange('alignment', 'left')}>L</button>
                            <button className={component.alignment === 'center' ? 'active' : ''} onClick={() => handleChange('alignment', 'center')}>C</button>
                            <button className={component.alignment === 'right' ? 'active' : ''} onClick={() => handleChange('alignment', 'right')}>R</button>
                        </div>
                    </div>
                </>
            );
            case 'card': return (
                <>
                    <div className="form-group">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                        <button className="upload-button" onClick={() => fileInputRef.current?.click()}>Upload Preview Image</button>
                    </div>
                    <div className="form-group">
                        <label>Image URL</label>
                        <input type="url" value={component.src} onChange={(e) => handleChange('src', e.target.value)} onBlur={handleUrlBlur} />
                        <p className="helper-text">Public URL required for final email.</p>
                    </div>
                    <div className="form-group">
                        <label>Alt Text</label>
                        <input type="text" value={component.alt} onChange={(e) => handleChange('alt', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>Title</label>
                        <input type="text" value={component.title} onChange={(e) => handleChange('title', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>Content</label>
                        <textarea value={component.content} onChange={(e) => handleChange('content', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Button Text</label>
                        <input type="text" value={component.buttonText} onChange={(e) => handleChange('buttonText', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>Button URL</label>
                        <input type="url" value={component.buttonHref} onChange={(e) => handleChange('buttonHref', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>Card Background</label>
                         <div className="color-input-group">
                             <input type="color" value={component.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                             <input type="text" value={component.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                        </div>
                    </div>
                     <div className="form-group">
                        <label>Button Background</label>
                         <div className="color-input-group">
                             <input type="color" value={component.buttonBackgroundColor} onChange={(e) => handleChange('buttonBackgroundColor', e.target.value)} />
                             <input type="text" value={component.buttonBackgroundColor} onChange={(e) => handleChange('buttonBackgroundColor', e.target.value)} />
                        </div>
                    </div>
                </>
            );
            case 'layout': return <p>Select an element inside a column to edit its properties.</p>;
            default: return null;
        }
    }

    return (
        <div className="properties-panel">
            <h3>{component.type.charAt(0).toUpperCase() + component.type.slice(1)} Properties</h3>
            {renderProperties()}
        </div>
    );
}

const ExportModal = ({ html, onClose }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(html);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Export HTML</h2>
                    <button onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <pre>
                        <code>{html}</code>
                    </pre>
                </div>
                <div className="modal-footer">
                    <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy to Clipboard'}</button>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

const App = () => {
  const [components, setComponents] = useState<EmailComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    backgroundColor: '#f8f9fa',
    contentBackgroundColor: '#ffffff',
  });

  const handleUpdateComponent = (id: string, updatedComponent: EmailComponent) => {
    const recursiveUpdate = (items: EmailComponent[]): EmailComponent[] => {
        return items.map(c => {
            if (c.id === id) return updatedComponent;
            if (c.type === 'layout') {
                return {
                    ...c,
                    columns: c.columns.map(col => ({
                        ...col,
                        components: recursiveUpdate(col.components) as ContentComponent[]
                    }))
                };
            }
            return c;
        });
    }
    setComponents(prev => recursiveUpdate(prev));
  };
  
  const handleUpdateEmailSettings = (updatedSettings: Partial<EmailSettings>) => {
    setEmailSettings(prev => ({ ...prev, ...updatedSettings }));
  };

  const findComponent = (id: string, items: EmailComponent[]): EmailComponent | null => {
      for (const component of items) {
          if (component.id === id) return component;
          if (component.type === 'layout') {
              for (const col of component.columns) {
                  const found = findComponent(id, col.components);
                  if (found) return found;
              }
          }
      }
      return null;
  }
  const selectedComponent = findComponent(selectedId, components);
  
  const generateComponentHtml = (component: EmailComponent): string => {
    const getPlaceholderSrc = (imgComponent: { naturalWidth?: number, naturalHeight?: number }, defaultW = 600, defaultH = 300) => {
        const w = imgComponent.naturalWidth || defaultW;
        const h = imgComponent.naturalHeight || defaultH;
        return `https://via.placeholder.com/${Math.round(w)}x${Math.round(h)}.png?text=Image`;
    };

    switch (component.type) {
      case 'text':
      case 'footer':
        return `<div style="padding:10px; font-family:${component.fontFamily}, sans-serif; font-size:${component.fontSize}px; color:${component.color}; text-align:${component.textAlign}; line-height: 1.5;">${component.content}</div>`;
      case 'image':
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="padding: 10px 0;"><img src="${getPlaceholderSrc(component)}" alt="${component.alt}" style="width:${component.width}%; max-width:100%; display:block; border-radius:${component.borderRadius}px;"></td></tr></table>`;
      case 'logo':
        const { naturalWidth, naturalHeight } = component;
        const logoWidth = parseInt(component.width, 10);
        let placeholderSrc;
        if (naturalWidth && naturalHeight && naturalWidth > 0) {
            const calculatedHeight = logoWidth * (naturalHeight / naturalWidth);
            placeholderSrc = `https://via.placeholder.com/${logoWidth}x${Math.round(calculatedHeight)}.png?text=Logo`;
        } else {
            placeholderSrc = `https://via.placeholder.com/${logoWidth}x${Math.round(logoWidth/3)}.png?text=Logo`;
        }
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="padding: 10px;"><img src="${placeholderSrc}" alt="${component.alt}" width="${component.width}" style="display:block; max-width: 100%;"></td></tr></table>`;
      case 'button':
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;"><tr><td align="center" bgcolor="${component.backgroundColor}" style="padding:10px 20px; border-radius:5px;"><a href="${component.href}" target="_blank" style="color:${component.textColor}; text-decoration:none; font-weight:${component.fontWeight}; font-family: sans-serif; font-size: ${component.fontSize}px;">${component.text}</a></td></tr></table>`;
      case 'button-group':
        const buttonsHtml = component.buttons.map(btn => 
            `<td align="center" bgcolor="${btn.backgroundColor}" style="padding:10px 20px; border-radius:5px;"><a href="${btn.href}" target="_blank" style="color:${btn.textColor}; text-decoration:none; font-family: sans-serif;">${btn.text}</a></td>`
        ).join('<td width="10">&nbsp;</td>'); // Spacer cell
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="padding:10px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>${buttonsHtml}</tr></table></td></tr></table>`;
      case 'spacer':
        return `<div style="height:${component.height}px; line-height:${component.height}px; font-size:1px;">&nbsp;</div>`;
       case 'divider':
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td style="padding:${component.padding}px 0;"><hr style="border:none; border-top:${component.height}px solid ${component.color};"></td></tr></table>`;
      case 'social':
        const linksHtml = component.links.map(link => 
            `<td style="padding: 0 5px;"><a href="${link.url}" target="_blank"><img src="${SOCIAL_ICONS[link.platform]}" alt="${link.platform}" width="32" height="32" style="display: block;"></a></td>`
        ).join('');
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="padding:10px;"><table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>${linksHtml}</tr></table></td></tr></table>`;
      case 'video':
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="padding:10px 0;"><a href="${component.videoUrl}" target="_blank" style="display:inline-block; width:${component.width}%;"><img src="${getPlaceholderSrc(component)}" alt="${component.alt}" width="100%" style="max-width:100%; display:block;"></a></td></tr></table>`;
      case 'card':
        return `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:${component.backgroundColor}; border-radius: 5px; overflow: hidden;">
                <tr><td><img src="${getPlaceholderSrc(component, 600, 400)}" alt="${component.alt}" style="max-width:100%; display:block;" width="100%"></td></tr>
                <tr><td style="padding: 15px; color: ${component.textColor}; font-family: sans-serif;">
                    <h4 style="margin:0 0 5px; font-size: 18px;">${component.title}</h4>
                    <p style="margin:0 0 15px; font-size: 14px;">${component.content}</p>
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" bgcolor="${component.buttonBackgroundColor}" style="padding:10px 20px; border-radius:5px;"><a href="${component.buttonHref}" target="_blank" style="color:${component.buttonTextColor}; text-decoration:none; font-weight:bold; font-size: 16px;">${component.buttonText}</a></td></tr></table>
                </td></tr>
            </table>
        `;
      case 'layout':
        const columnCount = component.columns.length;
        const columnWidth = `${100 / columnCount}%`;
        const columnsHtml = component.columns.map(col => {
            const content = col.components.map(c => generateComponentHtml(c)).join('\n');
            return `<td valign="top" width="${columnWidth}" class="column-wrapper" style="padding: 5px;">${content}</td>`
        }).join('');
        return `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>${columnsHtml}</tr>
            </table>
        `;
      default: return '';
    }
  }
  
  const generateEmailHtml = () => {
    const body = components.map(generateComponentHtml).join('\n');
    
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Email</title>
<style>
@media screen and (max-width: 600px) {
    .column-wrapper {
        display: block !important;
        width: 100% !important;
    }
}
</style>
</head>
<body style="margin:0; padding:0; background-color:${emailSettings.backgroundColor};">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse; background-color:${emailSettings.contentBackgroundColor};">
          <tr>
            <td style="padding: 20px;">
              ${body}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  return (
    <>
      <header className="header">
        <h1>Email Editor</h1>
        <div className="header-actions">
          <button onClick={() => setShowExportModal(true)}>Export HTML</button>
        </div>
      </header>
      <main className="main-container">
        <ComponentsPanel />
        <Canvas
          components={components}
          setComponents={setComponents}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          emailSettings={emailSettings}
        />
        <PropertiesPanel
          component={selectedComponent}
          onUpdate={handleUpdateComponent}
          emailSettings={emailSettings}
          onUpdateSettings={handleUpdateEmailSettings}
        />
      </main>
      {showExportModal && <ExportModal html={generateEmailHtml()} onClose={() => setShowExportModal(false)} />}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);