import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// --- TYPES ---
type ComponentType = 'text' | 'image' | 'button' | 'spacer' | 'layout' | 'card' | 'divider' | 'social' | 'video' | 'logo' | 'footer' | 'button-group' | 'emoji' | 'calendar';

// Define a new type for component creation that includes layout types.
type CreationComponentType = ComponentType | 'two-column' | 'three-column';

interface ComponentListItem {
    type: CreationComponentType;
    label: string;
    icon: string;
    isLayout?: boolean;
}

interface BorderSide {
  width: string;
  color: string;
}

interface ContainerStyle {
  backgroundColor?: string;
  borderTop?: BorderSide;
  borderRight?: BorderSide;
  borderBottom?: BorderSide;
  borderLeft?: BorderSide;
}

interface BaseComponent {
  id: string;
  type: ComponentType;
  containerStyle?: ContainerStyle;
  isLocked?: boolean;
}


// --- Content Components ---
interface TextComponent extends BaseComponent {
  type: 'text';
  content: string;
  fontSize: string;
  color: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  useGlobalFont: boolean;
  useGlobalTextColor: boolean;
  width: string;
}

interface FooterComponent extends BaseComponent {
    type: 'footer';
    content: string;
    fontSize: string;
    color: string;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right';
    useGlobalFont: boolean;
    useGlobalTextColor: boolean;
    width: string;
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
  href?: string;
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
  useGlobalAccentColor: boolean;
  fontFamily: string;
  useGlobalFont: boolean;
}

interface CalendarButtonComponent extends BaseComponent {
    type: 'calendar';
    // Button Fields
    text: string;
    backgroundColor: string;
    textColor: string;
    fontSize: string;
    fontWeight: 'normal' | 'bold';
    useGlobalAccentColor: boolean;
    fontFamily: string;
    useGlobalFont: boolean;
    // Event Fields
    eventTitle: string;
    startTime: string; // ISO String
    endTime: string; // ISO String
    location: string;
    description: string;
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
    fontFamily: string;
    useGlobalFont: boolean;
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
    width: string;
    useGlobalAccentColor: boolean;
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
  showImage: boolean;
  imageWidth: string;
  showButton: boolean;
  fontFamily: string;
  useGlobalFont: boolean;
  useGlobalTextColor: boolean;
  useGlobalButtonAccentColor: boolean;
  width: string;
  buttonFontWeight: 'normal' | 'bold';
  buttonFontFamily: string;
  useGlobalButtonFont: boolean;
}

interface EmojiComponent extends BaseComponent {
  type: 'emoji';
  character: string;
  fontSize: string;
  alignment: 'left' | 'center' | 'right';
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
    | ButtonGroupComponent
    | EmojiComponent
    | CalendarButtonComponent;

// --- Layout Component ---
interface Column {
  id: string;
  components: ContentComponent[];
}

interface ColumnLayoutComponent extends BaseComponent {
  type: 'layout';
  layoutType: 'two-column' | 'three-column';
  columns: Column[];
  columnWidths?: number[];
}

type EmailComponent = ContentComponent | ColumnLayoutComponent;

interface FavoriteItem {
    id: string;
    name: string;
    component: EmailComponent;
}

interface EmailSettings {
  backgroundColor: string;
  contentBackgroundColor: string;
  fontFamily: string;
  accentColor: string;
  textColor: string;
}

// Target for drag-and-drop operations
type DropTarget = 
  | { type: 'root'; index: number; position?: 'before' | 'after' }
  | { type: 'column'; layoutId: string; columnIndex: number; index: number; position?: 'before' | 'after' };

// A version of DropTarget without the 'position' property. Using a clean union type
// here instead of Omit<DropTarget, 'position'> to avoid TypeScript compiler issues
// with type narrowing on discriminated unions.
type DropLocation = 
  | { type: 'root'; index: number }
  | { type: 'column'; layoutId: string; columnIndex: number; index: number };


// --- UTILITY FUNCTIONS ---
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


// --- USE HISTORY HOOK ---
// FIX: Added a trailing comma to the generic type parameter `<T,>` to disambiguate from JSX syntax. This is a common requirement for generic arrow functions in .tsx files to prevent the parser from misinterpreting the generic as a JSX tag, which was causing a cascade of parsing errors throughout the file.
const useHistory = <T,>(initialState: T) => {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((newState: T) => {
    // Prevent adding identical state to history
    if (JSON.stringify(newState) === JSON.stringify(history[currentIndex])) {
      return;
    }
    
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [canUndo, currentIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [canRedo, currentIndex]);

  return { state, setState, undo, redo, canUndo, canRedo };
};

// --- UI COMPONENTS ---

const DEFAULT_COMPONENT_LIST: ComponentListItem[] = [
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'emoji', label: 'Emoji', icon: '😀' },
  { type: 'button', label: 'Button', icon: '🔘' },
  { type: 'calendar', label: 'Calendar', icon: '📅' },
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

const getComponentMeta = (type: ComponentType | CreationComponentType, list: ComponentListItem[]) => {
    return list.find(c => c.type === type) || { label: type, icon: '❓' };
};

const ComponentsPanel = ({ setDraggingComponentType, setSelectedId, favorites, onRemoveFavorite, onRenameFavorite, componentList, onReorder }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [isFavoritesCollapsed, setIsFavoritesCollapsed] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);

  useEffect(() => {
    if (editingId && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
  }, [editingId]);

  const handleRename = () => {
    if (editingId && editText.trim()) {
        onRenameFavorite(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const onDragStartCanvas = (e: React.DragEvent, componentType: CreationComponentType) => {
    e.dataTransfer.setData('application/reactflow', componentType);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingComponentType(componentType);
    setSelectedId(null);
  };

  const onFavoriteDragStart = (e: React.DragEvent, component: EmailComponent) => {
    e.dataTransfer.setData('application/json-favorite', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingComponentType(component.type);
    setSelectedId(null);
  };
  
  const handleReorderDragStart = (index: number) => {
    dragItemIndex.current = index;
  };
  
  const handleReorderDragEnter = (index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleReorderDrop = () => {
    if (dragItemIndex.current === null || dragOverItemIndex.current === null) return;
    const listCopy = [...componentList];
    const draggedItem = listCopy.splice(dragItemIndex.current, 1)[0];
    listCopy.splice(dragOverItemIndex.current, 0, draggedItem);
    onReorder(listCopy);
    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  return (
    <div className="components-panel">
      {favorites.length > 0 && (
          <div className="favorites-section">
              <h3 onClick={() => setIsFavoritesCollapsed(!isFavoritesCollapsed)}>
                  <span>Favorites</span>
                  <span className="collapse-icon">{isFavoritesCollapsed ? '▶' : '▼'}</span>
              </h3>
              {!isFavoritesCollapsed && (
                  <div className="component-grid">
                      {favorites.map((fav) => {
                          const typeToLookup = fav.component.type === 'layout' ? fav.component.layoutType : fav.component.type;
                          const meta = getComponentMeta(typeToLookup, DEFAULT_COMPONENT_LIST);
                          const isEditing = editingId === fav.id;

                          return (
                              <div
                                  key={fav.id}
                                  className="favorite-item"
                                  draggable={!isEditing}
                                  onDragStart={(e) => onFavoriteDragStart(e, fav.component)}
                                  onDragEnd={() => setDraggingComponentType(null)}
                              >
                                  <div className="component-item-content">
                                      <div className="icon">{meta.icon}</div>
                                      {isEditing ? (
                                        <input
                                            ref={renameInputRef}
                                            type="text"
                                            className="favorite-rename-input"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onBlur={handleRename}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingId(null); }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                      ) : (
                                        <div
                                            className="label"
                                            onClick={(e) => { e.stopPropagation(); setEditingId(fav.id); setEditText(fav.name); }}
                                            title="Click to rename"
                                        >
                                            {fav.name}
                                        </div>
                                      )}
                                  </div>
                                  <button
                                      className="remove-favorite-btn"
                                      onClick={(e) => { e.stopPropagation(); onRemoveFavorite(fav.id); }}
                                      title="Remove from Favorites"
                                  >
                                      &times;
                                  </button>
                              </div>
                          );
                      })}
                  </div>
                )}
          </div>
      )}

      <h3>Components</h3>
      <div className="component-grid">
        {componentList.map(({ type, label, icon, isLayout }, index) => (
          <div
            key={type}
            className={`component-item ${isLayout ? 'layout-item' : ''} ${isEditingOrder ? 'editing-order' : ''}`}
            draggable
            onDragStart={(e) => isEditingOrder ? handleReorderDragStart(index) : onDragStartCanvas(e, type)}
            onDragEnd={() => isEditingOrder ? undefined : setDraggingComponentType(null)}
            onDragEnter={() => isEditingOrder ? handleReorderDragEnter(index) : undefined}
            onDragOver={isEditingOrder ? (e) => e.preventDefault() : undefined}
            onDrop={isEditingOrder ? handleReorderDrop : undefined}
          >
            <div className="icon">{icon}</div>
            <div className="label">{label}</div>
            {isEditingOrder && <div className="reorder-handle">⠿</div>}
          </div>
        ))}
      </div>
       <div className="edit-order-button-wrapper">
        <button className="edit-order-button" onClick={() => setIsEditingOrder(prev => !prev)}>
          {isEditingOrder ? 'Done' : 'Edit Order'}
        </button>
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

const ColumnResizer: React.FC<{
    columnIndex: number;
    component: ColumnLayoutComponent;
    onUpdate: (id: string, updatedComponent: Partial<EmailComponent>) => void;
}> = ({ columnIndex, component, onUpdate }) => {
    const resizerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const layoutGrid = resizerRef.current?.parentElement;
        if (!layoutGrid) return;

        const containerWidth = layoutGrid.getBoundingClientRect().width;
        
        const initialWidths = component.columnWidths || component.columns.map(() => 100 / component.columns.length);
        const leftInitialWidth = initialWidths[columnIndex];
        const rightInitialWidth = initialWidths[columnIndex + 1];
        
        document.body.classList.add('resizing');

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            let deltaPercent = (dx / containerWidth) * 100;

            let newLeftWidth = leftInitialWidth + deltaPercent;
            let newRightWidth = rightInitialWidth - deltaPercent;
            
            const minWidth = 10;
            if (newLeftWidth < minWidth || newRightWidth < minWidth) {
                return;
            }

            const sum = leftInitialWidth + rightInitialWidth;
            if (deltaPercent > 0) { // dragging right
                newLeftWidth = Math.min(sum - minWidth, newLeftWidth);
                newRightWidth = sum - newLeftWidth;
            } else { // dragging left
                newLeftWidth = Math.max(minWidth, newLeftWidth);
                newRightWidth = sum - newLeftWidth;
            }
            
            const newWidths = [...initialWidths];
            newWidths[columnIndex] = newLeftWidth;
            newWidths[columnIndex + 1] = newRightWidth;
            
            const roundedWidths = newWidths.map(w => parseFloat(w.toFixed(2)));

            onUpdate(component.id, { ...component, columnWidths: roundedWidths });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.classList.remove('resizing');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [component, columnIndex, onUpdate]);
    
    return <div className="column-resizer" ref={resizerRef} onMouseDown={handleMouseDown} />;
};


const Canvas = ({ components, setComponents, selectedId, setSelectedId, emailSettings, draggingComponentType, setDraggingComponentType, onUpdate, onDuplicate, onDelete, onFavorite, componentList }) => {
  const [dragOverTarget, setDragOverTarget] = useState<DropTarget | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  const createNewComponent = (type: CreationComponentType): EmailComponent => {
    const id = `comp_${Date.now()}`;
    const baseProps: Pick<BaseComponent, 'id' | 'containerStyle' | 'isLocked'> = { id, containerStyle: { backgroundColor: 'transparent' }, isLocked: false };
    switch (type) {
      case 'text':
        return { ...baseProps, type, content: 'This is a new text block. Click to edit!', fontSize: '16', color: '#000000', fontFamily: 'Arial', textAlign: 'left', useGlobalFont: true, useGlobalTextColor: true, width: '100' };
      case 'image':
        return { ...baseProps, type, src: '', alt: 'Placeholder', borderRadius: '0', width: '100', alignment: 'center' };
      case 'button':
        return { ...baseProps, type, text: 'Click Me', href: '#', backgroundColor: '#0d6efd', textColor: '#ffffff', fontSize: '16', fontWeight: 'normal', useGlobalAccentColor: true, fontFamily: 'Arial', useGlobalFont: true };
      case 'calendar':
        const startDate = new Date();
        const endDate = new Date();
        endDate.setHours(startDate.getHours() + 1);
        return { ...baseProps, type, text: 'Add to Calendar', backgroundColor: '#0d6efd', textColor: '#ffffff', fontSize: '16', fontWeight: 'normal', useGlobalAccentColor: true, fontFamily: 'Arial', useGlobalFont: true, eventTitle: 'My Event', startTime: startDate.toISOString().slice(0, 16), endTime: endDate.toISOString().slice(0, 16), location: 'Online', description: 'This is an event description.' };
      case 'spacer':
        return { ...baseProps, type, height: '20' };
      case 'divider':
        return { ...baseProps, type, color: '#cccccc', height: '1', padding: '10', width: '100', useGlobalAccentColor: true };
      case 'social':
        return { ...baseProps, type, alignment: 'center', links: [
            { id: `social_${Date.now()}_1`, platform: 'facebook', url: '#' },
            { id: `social_${Date.now()}_2`, platform: 'twitter', url: '#' },
            { id: `social_${Date.now()}_3`, platform: 'instagram', url: '#' },
        ]};
      case 'video':
        return { ...baseProps, type, videoUrl: '#', imageUrl: '', alt: 'Video thumbnail', width: '100', alignment: 'center' };
      case 'card':
        return { ...baseProps, type, src: '', alt: 'Card Image', title: 'Card Title', content: 'This is some card content. Describe the item or feature here.', buttonText: 'Learn More', buttonHref: '#', backgroundColor: '#f8f9fa', textColor: '#212529', buttonBackgroundColor: '#0d6efd', buttonTextColor: '#ffffff', showImage: true, imageWidth: '100', showButton: true, fontFamily: 'Arial', useGlobalFont: true, useGlobalTextColor: true, useGlobalButtonAccentColor: true, width: '100', buttonFontWeight: 'bold', buttonFontFamily: 'Arial', useGlobalButtonFont: true };
      case 'logo':
        return { ...baseProps, type, src: '', alt: 'Company Logo', width: '150', alignment: 'center' };
      case 'footer':
        return { ...baseProps, type, content: 'Your Company Name<br>123 Street, City, State 12345<br><a href="#" style="color: #888888; text-decoration: underline;">Unsubscribe</a>', fontSize: '12', color: '#888888', fontFamily: 'Arial', textAlign: 'center', useGlobalFont: true, useGlobalTextColor: true, width: '100' };
      case 'button-group':
        return { ...baseProps, type, alignment: 'center', fontFamily: 'Arial', useGlobalFont: true, buttons: [
            { id: `btn_${Date.now()}_1`, text: 'Button 1', href: '#', backgroundColor: '#0d6efd', textColor: '#ffffff' },
            { id: `btn_${Date.now()}_2`, text: 'Button 2', href: '#', backgroundColor: '#6c757d', textColor: '#ffffff' },
        ]};
      case 'emoji':
        return { ...baseProps, type, character: '🎉', fontSize: '48', alignment: 'center' };
      case 'two-column':
        return { ...baseProps, id, type: 'layout', layoutType: 'two-column', columns: [{ id: `col_${Date.now()}_1`, components: [] }, { id: `col_${Date.now()}_2`, components: [] }] };
      case 'three-column':
        return { ...baseProps, id, type: 'layout', layoutType: 'three-column', columns: [{ id: `col_${Date.now()}_1`, components: [] }, { id: `col_${Date.now()}_2`, components: [] }, { id: `col_${Date.now()}_3`, components: [] }] };
      default:
        throw new Error('Unknown component type');
    }
  };
  
  const insertComponent = (items: EmailComponent[], target: DropLocation, componentToAdd: EmailComponent): EmailComponent[] => {
    if (target.type === 'root') {
        const newItems = [...items];
        newItems.splice(target.index, 0, componentToAdd);
        return newItems;
    }
    if (target.type === 'column') {
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
    return items;
  };

  const handleAddComponent = (target: DropLocation, newComponent: EmailComponent) => {
    setComponents(prev => insertComponent(prev, target, newComponent));
    setSelectedId(newComponent.id);
  }
  
  const regenerateIds = (component: EmailComponent): EmailComponent => {
    const newComponent = JSON.parse(JSON.stringify(component));
    const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;

    newComponent.id = newId('comp');
    newComponent.isLocked = false; 

    if (newComponent.type === 'layout') {
      newComponent.columns.forEach((col: Column) => {
        col.id = newId('col');
        col.components = col.components.map((c: ContentComponent) => regenerateIds(c) as ContentComponent);
      });
    } else if (newComponent.type === 'social') {
      newComponent.links.forEach((link: SocialLink) => link.id = newId('social'));
    } else if (newComponent.type === 'button-group') {
      newComponent.buttons.forEach((btn: SubButton) => btn.id = newId('btn'));
    }

    return newComponent;
  };

  const handleDrop = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    setDraggingComponentType(null);

    const newComponentType = e.dataTransfer.getData('application/reactflow') as CreationComponentType;
    const movedComponentData = e.dataTransfer.getData('application/json-component');
    const favoriteComponentData = e.dataTransfer.getData('application/json-favorite');
    
    const finalIndex = target.position === 'after' ? target.index + 1 : target.index;
    
    let finalDropTarget: DropLocation;
    if (target.type === 'root') {
        finalDropTarget = { type: 'root', index: finalIndex };
    } else {
        finalDropTarget = { type: 'column', layoutId: target.layoutId, columnIndex: target.columnIndex, index: finalIndex };
    }

    if (movedComponentData) {
        const movedComponent = JSON.parse(movedComponentData) as EmailComponent;
        
        setComponents(prev => {
            const componentsAfterDelete = recursiveDelete(prev, movedComponent.id);
            return insertComponent(componentsAfterDelete, finalDropTarget, movedComponent);
        });
        setSelectedId(movedComponent.id);

    } else if (favoriteComponentData) {
        const favoriteComponent = JSON.parse(favoriteComponentData) as EmailComponent;
        const newComponent = regenerateIds(favoriteComponent);
        handleAddComponent(finalDropTarget, newComponent);

    } else if (newComponentType) {
        const newComponent = createNewComponent(newComponentType);
        handleAddComponent(finalDropTarget, newComponent);
    } 
  };

  const handleDragOver = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    e.stopPropagation();
    if (JSON.stringify(target) !== JSON.stringify(dragOverTarget)) {
        setDragOverTarget(target);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      if (!(e.relatedTarget as Element)?.closest('.canvas-container')) {
          setDragOverTarget(null);
      }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('canvas-container') || target.classList.contains('canvas')) {
      setSelectedId(null);
    }
  };

  const DropPlaceholder = ({ componentType }: { componentType: CreationComponentType | null }) => {
    if (!componentType) return null;
    const { label } = getComponentMeta(componentType, componentList) || { label: 'Component' };
    return (
        <div className="drop-placeholder">
            <span>Drop {label} here</span>
        </div>
    );
  };


  const renderContentComponent = (component: ContentComponent) => {
      switch (component.type) {
      case 'text':
      case 'footer': {
          const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
          const finalTextColor = component.useGlobalTextColor ? emailSettings.textColor : component.color;
          const textContent = <div dangerouslySetInnerHTML={{ __html: component.content }} style={{ padding: '10px', fontSize: `${component.fontSize}px`, color: finalTextColor, fontFamily: finalFontFamily, textAlign: component.textAlign }} />;
          return <div style={{ width: `${component.width}%`, margin: '0 auto' }}>{textContent}</div>;
      }
      case 'image': {
        const imageContainerStyle: React.CSSProperties = {
          textAlign: component.alignment,
          padding: '10px 0'
        };

        if (!component.previewSrc && !component.src) {
            return (
                <div style={imageContainerStyle}>
                    <div className="empty-image-placeholder" style={{ width: `${component.width}%` }}>
                        <div className="icon">🖼️</div>
                        <span>Image</span>
                    </div>
                </div>
            );
        }

        const imageElement = (
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
        );
        
        if (component.href) {
          return (
            <div style={imageContainerStyle}>
              <a href={component.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-block', lineHeight: 0 }}>
                {imageElement}
              </a>
            </div>
          );
        }
        return <div style={imageContainerStyle}>{imageElement}</div>;
      }
      case 'logo':
        if (!component.previewSrc && !component.src) {
            return (
              <div style={{ textAlign: component.alignment, padding: '10px' }}>
                <div className="empty-image-placeholder" style={{ width: `${component.width}px` }}>
                  <div className="icon">🏢</div>
                  <span>Logo</span>
                </div>
              </div>
            );
          }
          return <div style={{ textAlign: component.alignment, padding: '10px' }}><img src={component.previewSrc || component.src} alt={component.alt} style={{ width: `${component.width}px`, maxWidth: '100%', display: 'inline-block' }} /></div>;
      case 'button':
      case 'calendar':
          const finalButtonBgColor = component.useGlobalAccentColor ? emailSettings.accentColor : component.backgroundColor;
          const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
          const href = component.type === 'button' ? component.href : '#'; // Calendar link is handled in export
          return (
          <div style={{ padding: '10px', textAlign: 'center' }}>
              <a href={href} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: finalButtonBgColor,
              color: component.textColor,
              textDecoration: 'none',
              borderRadius: '5px',
              fontSize: `${component.fontSize}px`,
              fontWeight: component.fontWeight,
              fontFamily: finalFontFamily,
              }}>
              {component.text}
              </a>
          </div>
          );
      case 'button-group':
          const finalGroupFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
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
                        margin: '0 5px',
                        fontFamily: finalGroupFontFamily,
                     }}>
                        {btn.text}
                     </a>
                ))}
            </div>
          );
      case 'spacer':
          return <div style={{ height: `${component.height}px` }} />;
      case 'divider':
          const finalDividerColor = component.useGlobalAccentColor ? emailSettings.accentColor : component.color;
          return (
            <div style={{ padding: `${component.padding}px 0` }}>
                <div style={{ width: `${component.width}%`, margin: '0 auto' }}>
                    <hr style={{ border: 'none', borderTop: `${component.height}px solid ${finalDividerColor}`, margin: 0, width: '100%' }} />
                </div>
            </div>
          );
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
       case 'video': {
            const videoContainerStyle: React.CSSProperties = { padding: '10px 0', textAlign: component.alignment };
            const videoWrapperStyle: React.CSSProperties = { display: 'inline-block', width: `${component.width}%`, position: 'relative' };
            
            if (!component.previewSrc && !component.imageUrl) {
                 return (
                    <div style={videoContainerStyle}>
                        <div className="empty-image-placeholder" style={{ ...videoWrapperStyle, display: 'inline-flex', position: 'static' }}>
                            <div className="icon">▶️</div>
                            <span>Video Thumbnail</span>
                        </div>
                    </div>
                );
            }
            
            return (
                <div style={videoContainerStyle}>
                    <a href={component.videoUrl} target="_blank" rel="noopener noreferrer" style={videoWrapperStyle}>
                        <img src={component.previewSrc || component.imageUrl} alt={component.alt} style={{ width: '100%', display: 'block' }} />
                        <div className="video-play-button">▶</div>
                    </a>
                </div>
            );
        }
      case 'card': {
          const finalCardButtonBgColor = component.useGlobalButtonAccentColor ? emailSettings.accentColor : component.buttonBackgroundColor;
          const finalCardFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
          const finalCardTextColor = component.useGlobalTextColor ? emailSettings.textColor : component.textColor;
          const finalButtonFontFamily = component.useGlobalButtonFont ? emailSettings.fontFamily : component.buttonFontFamily;
          const cardContent = (
              <div style={{ backgroundColor: component.backgroundColor, color: finalCardTextColor, padding: '15px', borderRadius: '5px', fontFamily: finalCardFontFamily }}>
                  {component.showImage && (
                    (!component.previewSrc && !component.src) ? (
                        <div className="empty-image-placeholder" style={{ display: 'flex', width: '100%', minHeight: '200px' }}>
                            <div className="icon">🃏</div>
                            <span>Card Image</span>
                        </div>
                    ) : (
                        <img src={component.previewSrc || component.src} alt={component.alt} style={{ maxWidth: '100%', display: 'block', width: `${component.imageWidth}%`, margin: '0 auto' }} />
                    )
                  )}
                  <h4 style={{ margin: '10px 0 5px' }}>{component.title}</h4>
                  <p style={{ margin: '0 0 10px' }}>{component.content}</p>
                  {component.showButton && (
                    <div style={{ textAlign: 'center' }}>
                         <a href={component.buttonHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: finalCardButtonBgColor, color: component.buttonTextColor, textDecoration: 'none', borderRadius: '5px', fontWeight: component.buttonFontWeight, fontFamily: finalButtonFontFamily }}>{component.buttonText}</a>
                    </div>
                  )}
              </div>
          );
          return <div style={{ width: `${component.width}%`, margin: '0 auto' }}>{cardContent}</div>;
      }
      case 'emoji':
          return (
            <div style={{ padding: '10px', textAlign: component.alignment }}>
                <span style={{ fontSize: `${component.fontSize}px`, lineHeight: 1 }}>
                    {component.character}
                </span>
            </div>
          );
      default:
          return null;
      }
  };

  const getContainerInlineStyles = (component: EmailComponent): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (!component.containerStyle) return styles;

    const { backgroundColor, borderTop, borderRight, borderBottom, borderLeft } = component.containerStyle;

    if (backgroundColor && backgroundColor !== 'transparent') {
        styles.backgroundColor = backgroundColor;
    }
    if (borderTop?.width && parseInt(borderTop.width) > 0) {
        styles.borderTop = `${borderTop.width}px solid ${borderTop.color}`;
    }
    if (borderRight?.width && parseInt(borderRight.width) > 0) {
        styles.borderRight = `${borderRight.width}px solid ${borderRight.color}`;
    }
    if (borderBottom?.width && parseInt(borderBottom.width) > 0) {
        styles.borderBottom = `${borderBottom.width}px solid ${borderBottom.color}`;
    }
    if (borderLeft?.width && parseInt(borderLeft.width) > 0) {
        styles.borderLeft = `${borderLeft.width}px solid ${borderLeft.color}`;
    }

    return styles;
  };

  const RenderItem: React.FC<{
    component: EmailComponent;
    targetPath: DropLocation;
    onUpdate: (id: string, updated: Partial<EmailComponent>) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onFavorite: (id: string) => void;
  }> = ({ component, targetPath, onUpdate, onDuplicate, onDelete, onFavorite }) => {
    const isLayout = component.type === 'layout';
    
    const clickHandler = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedId(component.id);
    };
        
    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/json-component', JSON.stringify(component));
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDraggingId(component.id), 0);
        setDraggingComponentType(component.type);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggingId(null);
        setDraggingComponentType(null);
    };

    const handleItemDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const isTopHalf = e.clientY < rect.top + rect.height / 2;
        
        let newTarget: DropTarget;
        if (targetPath.type === 'column') {
            newTarget = { type: 'column', layoutId: targetPath.layoutId, columnIndex: targetPath.columnIndex, index: targetPath.index, position: isTopHalf ? 'before' : 'after' };
        } else {
            newTarget = { type: 'root', index: targetPath.index, position: isTopHalf ? 'before' : 'after' };
        }
        
        handleDragOver(e, newTarget);
    };
    
    const isMyTargetForDrop = (() => {
      if (!dragOverTarget || dragOverTarget.index !== targetPath.index) {
        return false;
      }
      if (dragOverTarget.type === 'root' && targetPath.type === 'root') {
        return true;
      }
      if (dragOverTarget.type === 'column' && targetPath.type === 'column') {
        return dragOverTarget.layoutId === targetPath.layoutId &&
               dragOverTarget.columnIndex === targetPath.columnIndex;
      }
      return false;
    })();

    const isDropTargetBefore = isMyTargetForDrop && dragOverTarget.position === 'before';
    const isDropTargetAfter = isMyTargetForDrop && dragOverTarget.position === 'after';

    const classNames = [
        'canvas-component',
        isLayout ? 'layout-component-wrapper' : '',
        selectedId === component.id ? 'selected' : '',
        draggingId === component.id ? 'dragging' : '',
    ].filter(Boolean).join(' ');
    
    const containerStyles = getContainerInlineStyles(component);
    
    return (
        <React.Fragment>
            {isDropTargetBefore && <DropPlaceholder componentType={draggingComponentType} />}
            <div
                className={classNames}
                onClick={!isLayout ? clickHandler : undefined}
                draggable={!isLayout && !component.isLocked}
                onDragStart={!isLayout && !component.isLocked ? handleDragStart : undefined}
                onDragEnd={!isLayout ? handleDragEnd : undefined}
                onDragOver={!isLayout ? handleItemDragOver : undefined}
                onDrop={!isLayout ? (e) => handleDrop(e, dragOverTarget!) : undefined}
            >
              {isLayout ? (
                 <div className="layout-component-content">
                    {/* FIX: Use a type guard to ensure `targetPath.type` is 'root' before accessing `targetPath.index`. This resolves a TypeScript error. */}
                    <div
                        className="layout-outer-dropzone layout-outer-dropzone-top"
                        onDragOver={(e) => targetPath.type === 'root' && handleDragOver(e, { type: 'root', index: targetPath.index, position: 'before' })}
                        onDrop={(e) => targetPath.type === 'root' && handleDrop(e, { type: 'root', index: targetPath.index, position: 'before' })}
                    />
                     <div className="layout-toolbar" onClick={clickHandler} draggable={!component.isLocked} onDragStart={!component.isLocked ? handleDragStart : undefined} onDragEnd={handleDragEnd}>
                       {!component.isLocked && <div className="drag-handle">✥</div>}
                       <span>{(component as ColumnLayoutComponent).layoutType.replace('-', ' ')}</span>
                       {selectedId === component.id && (
                         <>
                           <button className="toolbar-button favorite" title="Favorite" onClick={(e) => { e.stopPropagation(); onFavorite(component.id); }}>
                             ⭐
                           </button>
                           {!component.isLocked &&
                             <button className="toolbar-button duplicate" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(component.id); }}>
                               📋
                             </button>
                           }
                           <button className="toolbar-button lock" title={component.isLocked ? 'Unlock' : 'Lock'} onClick={(e) => { e.stopPropagation(); onUpdate(component.id, { ...component, isLocked: !component.isLocked }); }}>
                             {component.isLocked ? '🔒' : '🔓'}
                           </button>
                           {!component.isLocked &&
                             <button className="toolbar-button delete" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(component.id); }}>
                               🗑️
                             </button>
                           }
                         </>
                       )}
                     </div>
                      <div style={containerStyles}>
                        <div className="layout-grid-wrapper">
                          <div className={`layout-grid ${component.layoutType}`}>
                              {(component as ColumnLayoutComponent).columns.map((col, colIndex) => {
                                  const widths = (component as ColumnLayoutComponent).columnWidths || (component as ColumnLayoutComponent).columns.map(() => 100 / (component as ColumnLayoutComponent).columns.length);
                                  const targetForEmpty: DropTarget = {type: 'column', layoutId: component.id, columnIndex: colIndex, index: 0};
                                  const isEmptyColumnActive = JSON.stringify(dragOverTarget) === JSON.stringify(targetForEmpty);
                
                                  return (
                                    <React.Fragment key={col.id}>
                                      <div className="layout-column" style={{ width: `${widths[colIndex]}%`}}>
                                          {col.components.length === 0 ? (
                                              <div
                                                  className={`empty-column-dropzone ${isEmptyColumnActive ? 'active' : ''}`}
                                                  onDragOver={(e) => handleDragOver(e, targetForEmpty)}
                                                  onDrop={(e) => handleDrop(e, targetForEmpty)}
                                               >
                                                  {isEmptyColumnActive ? (
                                                      <DropPlaceholder componentType={draggingComponentType} />
                                                  ) : (
                                                      <>
                                                          <span className="icon">➕</span>
                                                          <span>Drop Here</span>
                                                      </>
                                                  )}
                                              </div>
                                          ) : (
                                              <>
                                                  {col.components.map((innerComp, innerIndex) => {
                                                      const innerTargetPath: DropLocation = {type: 'column', layoutId: component.id, columnIndex: colIndex, index: innerIndex};
                                                      return (
                                                          <RenderItem 
                                                            key={innerComp.id} 
                                                            component={innerComp} 
                                                            targetPath={innerTargetPath}
                                                            onUpdate={onUpdate}
                                                            onDuplicate={onDuplicate}
                                                            onDelete={onDelete}
                                                            onFavorite={onFavorite}
                                                          />
                                                      );
                                                  })}
                                              </>
                                          )}
                                      </div>
                                      {!component.isLocked && colIndex < (component as ColumnLayoutComponent).columns.length - 1 && (
                                        <ColumnResizer columnIndex={colIndex} component={component as ColumnLayoutComponent} onUpdate={onUpdate} />
                                      )}
                                    </React.Fragment>
                                  )
                              })}
                          </div>
                        </div>
                      </div>
                    {/* FIX: Use a type guard to ensure `targetPath.type` is 'root' before accessing `targetPath.index`. This resolves a TypeScript error. */}
                    <div
                        className="layout-outer-dropzone layout-outer-dropzone-bottom"
                        onDragOver={(e) => targetPath.type === 'root' && handleDragOver(e, { type: 'root', index: targetPath.index, position: 'after' })}
                        onDrop={(e) => targetPath.type === 'root' && handleDrop(e, { type: 'root', index: targetPath.index, position: 'after' })}
                    />
                 </div>
              ) : (
                <>
                    {selectedId === component.id && (
                     <div className="component-toolbar">
                       {!component.isLocked && <div className="drag-handle">✥</div>}
                       <span>{component.type.charAt(0).toUpperCase() + component.type.slice(1)}</span>
                       <button className="toolbar-button favorite" title="Favorite" onClick={(e) => { e.stopPropagation(); onFavorite(component.id); }}>
                         ⭐
                       </button>
                       {!component.isLocked &&
                         <button className="toolbar-button duplicate" title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(component.id); }}>
                           📋
                         </button>
                       }
                       <button className="toolbar-button lock" title={component.isLocked ? 'Unlock' : 'Lock'} onClick={(e) => { e.stopPropagation(); onUpdate(component.id, { ...component, isLocked: !component.isLocked }); }}>
                         {component.isLocked ? '🔒' : '🔓'}
                       </button>
                       {!component.isLocked &&
                         <button className="toolbar-button delete" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(component.id); }}>
                           🗑️
                         </button>
                       }
                     </div>
                    )}
                    <div style={containerStyles}>
                        {renderContentComponent(component as ContentComponent)}
                    </div>
                </>
              )}
            </div>
          {isDropTargetAfter && <DropPlaceholder componentType={draggingComponentType} />}
        </React.Fragment>
      );
};

  const isInitialDropActive = dragOverTarget && dragOverTarget.type === 'root' && dragOverTarget.index === 0;

  const handleCanvasAreaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCanvasAreaDrop = (e: React.DragEvent) => {
    if (dragOverTarget) {
      handleDrop(e, dragOverTarget);
    }
  };

  return (
    <div className="canvas-container" onDragLeave={handleDragLeave} style={{ backgroundColor: emailSettings.backgroundColor }} onClick={handleBackgroundClick}>
      <div 
        className="canvas" 
        style={{ backgroundColor: emailSettings.contentBackgroundColor }}
        onDragOver={handleCanvasAreaDragOver}
        onDrop={handleCanvasAreaDrop}
      >
        {components.length === 0 ? (
          <div className="empty-canvas" 
               onDragOver={(e) => handleDragOver(e, { type: 'root', index: 0 })}
          >
            {isInitialDropActive ? (
                <DropPlaceholder componentType={draggingComponentType} />
            ) : (
                <>
                    <div className='icon'>✨</div>
                    <h3>Let's build an email</h3>
                    <p>Drag a component from the left panel to get started.</p>
                </>
            )}
          </div>
        ) : (
          <>
            {components.map((component, index) => (
              <RenderItem key={component.id} component={component} targetPath={{ type: 'root', index: index }} onUpdate={onUpdate} onDuplicate={onDuplicate} onDelete={onDelete} onFavorite={onFavorite} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const ContainerStyleEditor = ({ component, onUpdate }) => {
    const { containerStyle = {} } = component;

    const handleStyleChange = (prop, value) => {
        const newStyle = { ...containerStyle, [prop]: value };
        onUpdate(component.id, { ...component, containerStyle: newStyle });
    };

    const handleBorderChange = (side, prop, value) => {
        const newStyle = {
            ...containerStyle,
            [side]: {
                ...(containerStyle[side] || { width: '0', color: '#000000' }),
                [prop]: value
            }
        };
        onUpdate(component.id, { ...component, containerStyle: newStyle });
    };

    const borderSides = ['borderTop', 'borderRight', 'borderBottom', 'borderLeft'];

    return (
        <div className="container-style-editor">
            <h4>Container Styles</h4>
            <div className="form-group">
                <label>Background Color</label>
                <div className="color-input-group">
                    <input type="color" value={containerStyle.backgroundColor || '#ffffff'} onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} />
                    <input type="text" value={containerStyle.backgroundColor || '#ffffff'} onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} />
                </div>
            </div>
            
            <div className="border-editor">
                <label>Borders</label>
                {borderSides.map(side => (
                    <div key={side} className="border-row">
                        <span>{side.replace('border', '')}</span>
                        <div className="border-inputs">
                            <input
                                type="number"
                                min="0"
                                value={containerStyle[side]?.width || '0'}
                                onChange={(e) => handleBorderChange(side, 'width', e.target.value)}
                            />
                            <span>px</span>
                             <input
                                type="color"
                                value={containerStyle[side]?.color || '#000000'}
                                onChange={(e) => handleBorderChange(side, 'color', e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const PropertiesPanel = ({ component, onUpdate, emailSettings, onUpdateSettings }) => {
    const FONT_FAMILIES = ['Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Brush Script MT'];
    const SOCIAL_PLATFORMS = Object.keys(SOCIAL_ICONS) as SocialLink['platform'][];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditingEmoji, setIsEditingEmoji] = useState(false);
    const emojiInputRef = useRef<HTMLInputElement>(null);
    
    // Reset editing state when the selected component changes
    useEffect(() => {
        setIsEditingEmoji(false);
    }, [component?.id]);

    // Focus input when editing state becomes true
    useEffect(() => {
        if (isEditingEmoji && emojiInputRef.current) {
            emojiInputRef.current.focus();
            emojiInputRef.current.select();
        }
    }, [isEditingEmoji]);


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
                <h4>Global Styles</h4>
                 <div className="form-group">
                    <label>Global Font Family</label>
                    <select value={emailSettings.fontFamily} onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}>
                        {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label>Global Text Color</label>
                    <div className="color-input-group">
                         <input type="color" value={emailSettings.textColor} onChange={(e) => onUpdateSettings({ textColor: e.target.value })} />
                         <input type="text" value={emailSettings.textColor} onChange={(e) => onUpdateSettings({ textColor: e.target.value })} />
                    </div>
                </div>
                <div className="form-group">
                    <label>Global Accent Color</label>
                    <div className="color-input-group">
                         <input type="color" value={emailSettings.accentColor} onChange={(e) => onUpdateSettings({ accentColor: e.target.value })} />
                         <input type="text" value={emailSettings.accentColor} onChange={(e) => onUpdateSettings({ accentColor: e.target.value })} />
                    </div>
                </div>
            </div>
        );
    }

    if (component.isLocked) {
        return (
            <div className="properties-panel locked-panel">
                <h3>🔒 Component Locked</h3>
                <p>Unlock this component to make changes.</p>
                <button className="unlock-button" onClick={() => onUpdate(component.id, { ...component, isLocked: false })}>Unlock Component</button>
            </div>
        );
    }
    
    const handleChange = (prop: string, value: any) => {
        onUpdate(component.id, { ...component, [prop]: value });
    };
    
    const handleFormat = (e: React.MouseEvent, command: string) => {
        e.preventDefault();
        if (command === 'createLink') {
            const url = prompt('Enter the link URL:', 'https://');
            if (url) {
                // execCommand is deprecated but necessary for this simple implementation
                document.execCommand(command, false, url);
            }
        } else {
            document.execCommand(command, false);
        }
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

    const handleVideoUrlBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const url = e.target.value;
        if (!url || url === (component as VideoComponent).videoUrl) return;

        handleChange('videoUrl', url);

        const fetchVideoThumbnail = async (videoUrl: string): Promise<{ thumbnailUrl: string | null, title: string | null }> => {
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/;

            const isYoutube = youtubeRegex.test(videoUrl);
            const isVimeo = vimeoRegex.test(videoUrl);

            if (!isYoutube && !isVimeo) {
                return { thumbnailUrl: null, title: null };
            }

            try {
                // Use noembed.com as a CORS-friendly oEmbed proxy for both YouTube and Vimeo
                const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
                
                if (!response.ok) {
                    // If the proxy fails, throw an error to be caught by the catch block.
                    throw new Error(`noembed.com fetch failed with status: ${response.status}`);
                }
                
                const data = await response.json();

                if (data.error) {
                    // Handle cases where noembed returns a JSON error (e.g., video not found)
                    throw new Error(data.error);
                }

                return { thumbnailUrl: data.thumbnail_url || null, title: data.title || null };

            } catch (error) {
                console.error("Thumbnail fetch error:", error);
                
                // Fallback specifically for YouTube if the proxy fails
                if (isYoutube) {
                    const youtubeMatch = videoUrl.match(youtubeRegex);
                    const videoId = youtubeMatch?.[1];
                    if (videoId) {
                        console.log("Using YouTube fallback thumbnail.");
                        return { thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, title: 'YouTube Video' };
                    }
                }
                
                // For Vimeo or if YouTube fallback fails, return null
                return { thumbnailUrl: null, title: null };
            }
        };

        const { thumbnailUrl, title } = await fetchVideoThumbnail(url);

        if (thumbnailUrl) {
            try {
                const { width, height } = await getImageDimensions(thumbnailUrl);
                onUpdate(component.id, {
                    ...component,
                    videoUrl: url,
                    imageUrl: thumbnailUrl,
                    previewSrc: thumbnailUrl, // Use it for preview as well
                    alt: title || (component as VideoComponent).alt,
                    naturalWidth: width,
                    naturalHeight: height
                });
            } catch (error) {
                 console.error("Error getting image dimensions from fetched thumbnail:", error);
                 onUpdate(component.id, { ...component, videoUrl: url, imageUrl: thumbnailUrl, previewSrc: thumbnailUrl, alt: title || (component as VideoComponent).alt });
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
                    <div className="global-toggle-group">
                        <label>Use Global Font</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Font Family</label>
                        <select value={component.fontFamily} disabled={component.useGlobalFont} onChange={(e) => handleChange('fontFamily', e.target.value)}>
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
                            <div className="global-toggle-group">
                                <label>Use Global</label>
                                <label className="switch">
                                    <input type="checkbox" checked={component.useGlobalTextColor} onChange={(e) => handleChange('useGlobalTextColor', e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div className="color-input-group">
                                <input type="color" value={component.color} disabled={component.useGlobalTextColor} onChange={(e) => handleChange('color', e.target.value)} />
                                <input type="text" value={component.color} disabled={component.useGlobalTextColor} onChange={(e) => handleChange('color', e.target.value)} />
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
                        <label>Content Width (%)</label>
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
                        <label>Content</label>
                        <div className="rich-text-toolbar">
                            <button onMouseDown={(e) => handleFormat(e, 'bold')}><b>B</b></button>
                            <button onMouseDown={(e) => handleFormat(e, 'italic')}><i>I</i></button>
                            <button onMouseDown={(e) => handleFormat(e, 'underline')}><u>U</u></button>
                            <button onMouseDown={(e) => handleFormat(e, 'createLink')}>🔗</button>
                            <button onMouseDown={(e) => handleFormat(e, 'unlink')}>🚫</button>
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
                        <label>Link URL (optional)</label>
                        <input type="url" placeholder="https://example.com" value={component.href || ''} onChange={(e) => handleChange('href', e.target.value)} />
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
                    <div className="global-toggle-group">
                        <label>Use Global Font</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Font Family</label>
                        <select value={component.fontFamily} disabled={component.useGlobalFont} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                            {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
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
                     <div className="global-toggle-group">
                        <label>Use Global Accent Color</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalAccentColor} onChange={(e) => handleChange('useGlobalAccentColor', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Background Color</label>
                         <div className="color-input-group">
                             <input type="color" value={component.backgroundColor} disabled={component.useGlobalAccentColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                             <input type="text" value={component.backgroundColor} disabled={component.useGlobalAccentColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
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
            case 'calendar': return (
                <>
                    <h4>Event Details</h4>
                    <div className="form-group">
                        <label>Event Title</label>
                        <input type="text" value={component.eventTitle} onChange={(e) => handleChange('eventTitle', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>Start Time</label>
                        <input type="datetime-local" value={component.startTime} onChange={(e) => handleChange('startTime', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>End Time</label>
                        <input type="datetime-local" value={component.endTime} onChange={(e) => handleChange('endTime', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Location</label>
                        <input type="text" value={component.location} onChange={(e) => handleChange('location', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={component.description} onChange={(e) => handleChange('description', e.target.value)} />
                    </div>
                    <h4>Button Styles</h4>
                    <div className="form-group">
                        <label>Button Text</label>
                        <input type="text" value={component.text} onChange={(e) => handleChange('text', e.target.value)} />
                    </div>
                     <div className="global-toggle-group">
                        <label>Use Global Font</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Font Family</label>
                        <select value={component.fontFamily} disabled={component.useGlobalFont} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                            {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Font Size</label>
                        <div className="slider-group">
                            <input type="range" min="8" max="48" value={component.fontSize} onChange={(e) => handleChange('fontSize', e.target.value)} />
                            <input type="number" min="1" className="slider-value-input" value={component.fontSize} onChange={(e) => handleChange('fontSize', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Font Weight</label>
                        <div className="button-toggle-group">
                            <button className={component.fontWeight === 'normal' ? 'active' : ''} onClick={() => handleChange('fontWeight', 'normal')}>Normal</button>
                            <button className={component.fontWeight === 'bold' ? 'active' : ''} onClick={() => handleChange('fontWeight', 'bold')}><b>Bold</b></button>
                        </div>
                    </div>
                     <div className="global-toggle-group">
                        <label>Use Global Accent Color</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalAccentColor} onChange={(e) => handleChange('useGlobalAccentColor', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Background Color</label>
                         <div className="color-input-group">
                             <input type="color" value={component.backgroundColor} disabled={component.useGlobalAccentColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                             <input type="text" value={component.backgroundColor} disabled={component.useGlobalAccentColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
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
                    <div className="global-toggle-group">
                        <label>Use Global Font</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Font Family</label>
                        <select value={component.fontFamily} disabled={component.useGlobalFont} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                            {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
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
                    <div className="slider-group">
                        <input
                            type="range"
                            min="10"
                            max="200"
                            value={component.height}
                            onChange={(e) => handleChange('height', e.target.value)}
                        />
                        <input
                            type="number"
                            min="1"
                            className="slider-value-input"
                            value={component.height}
                            onChange={(e) => handleChange('height', e.target.value)}
                        />
                    </div>
                </div>
            );
            case 'divider': return (
                <>
                     <div className="global-toggle-group">
                        <label>Use Global Accent Color</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalAccentColor} onChange={(e) => handleChange('useGlobalAccentColor', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Color</label>
                        <div className="color-input-group">
                            <input type="color" value={component.color} disabled={component.useGlobalAccentColor} onChange={(e) => handleChange('color', e.target.value)} />
                            <input type="text" value={component.color} disabled={component.useGlobalAccentColor} onChange={(e) => handleChange('color', e.target.value)} />
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
                        <input
                            type="url"
                            value={component.videoUrl}
                            onChange={(e) => handleChange('videoUrl', e.target.value)}
                            onBlur={handleVideoUrlBlur}
                            placeholder="https://youtube.com/watch?v=..."
                        />
                        <p className="helper-text">Enter a YouTube or Vimeo URL to fetch the thumbnail automatically.</p>
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
                        <label>Show Image</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.showImage} onChange={(e) => handleChange('showImage', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    {component.showImage && (
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
                                <label>Image Width (%)</label>
                                <div className="slider-group">
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={component.imageWidth}
                                        onChange={(e) => handleChange('imageWidth', e.target.value)}
                                    />
                                    <input type="number" min="10" max="100" className="slider-value-input" value={component.imageWidth} onChange={(e) => handleChange('imageWidth', e.target.value)} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Alt Text</label>
                                <input type="text" value={component.alt} onChange={(e) => handleChange('alt', e.target.value)} />
                            </div>
                        </>
                    )}
                    <div className="global-toggle-group">
                        <label>Use Global Font</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label>Font Family</label>
                        <select value={component.fontFamily} disabled={component.useGlobalFont} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                            {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                    <div className="global-toggle-group">
                        <label>Use Global Text Color</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.useGlobalTextColor} onChange={(e) => handleChange('useGlobalTextColor', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                     <div className="form-group">
                        <label>Text Color</label>
                         <div className="color-input-group">
                             <input type="color" value={component.textColor} disabled={component.useGlobalTextColor} onChange={(e) => handleChange('textColor', e.target.value)} />
                             <input type="text" value={component.textColor} disabled={component.useGlobalTextColor} onChange={(e) => handleChange('textColor', e.target.value)} />
                        </div>
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
                        <label>Title</label>
                        <input type="text" value={component.title} onChange={(e) => handleChange('title', e.target.value)} />
                    </div>
                     <div className="form-group">
                        <label>Content</label>
                        <textarea value={component.content} onChange={(e) => handleChange('content', e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Show Button</label>
                        <label className="switch">
                            <input type="checkbox" checked={component.showButton} onChange={(e) => handleChange('showButton', e.target.checked)} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    {component.showButton && (
                        <>
                            <div className="form-group">
                                <label>Button Text</label>
                                <input type="text" value={component.buttonText} onChange={(e) => handleChange('buttonText', e.target.value)} />
                            </div>
                             <div className="form-group">
                                <label>Button URL</label>
                                <input type="url" value={component.buttonHref} onChange={(e) => handleChange('buttonHref', e.target.value)} />
                            </div>
                            <div className="global-toggle-group">
                                <label>Use Global Font</label>
                                <label className="switch">
                                    <input type="checkbox" checked={component.useGlobalButtonFont} onChange={(e) => handleChange('useGlobalButtonFont', e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Font Family</label>
                                <select value={component.buttonFontFamily} disabled={component.useGlobalButtonFont} onChange={(e) => handleChange('buttonFontFamily', e.target.value)}>
                                    {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Button Font Weight</label>
                                <div className="button-toggle-group">
                                    <button className={component.buttonFontWeight === 'normal' ? 'active' : ''} onClick={() => handleChange('buttonFontWeight', 'normal')}>Normal</button>
                                    <button className={component.buttonFontWeight === 'bold' ? 'active' : ''} onClick={() => handleChange('buttonFontWeight', 'bold')}><b>Bold</b></button>
                                </div>
                            </div>
                             <div className="global-toggle-group">
                                <label>Use Global Button Color</label>
                                <label className="switch">
                                    <input type="checkbox" checked={component.useGlobalButtonAccentColor} onChange={(e) => handleChange('useGlobalButtonAccentColor', e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                             <div className="form-group">
                                <label>Button Background</label>
                                 <div className="color-input-group">
                                     <input type="color" value={component.buttonBackgroundColor} disabled={component.useGlobalButtonAccentColor} onChange={(e) => handleChange('buttonBackgroundColor', e.target.value)} />
                                     <input type="text" value={component.buttonBackgroundColor} disabled={component.useGlobalButtonAccentColor} onChange={(e) => handleChange('buttonBackgroundColor', e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}
                     <div className="form-group">
                        <label>Card Background</label>
                         <div className="color-input-group">
                             <input type="color" value={component.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                             <input type="text" value={component.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                        </div>
                    </div>
                </>
            );
            case 'emoji': return (
                <>
                    <div className="form-group">
                        <label>Emoji Character</label>
                        {isEditingEmoji ? (
                            <input
                                ref={emojiInputRef}
                                type="text"
                                value={component.character}
                                onChange={(e) => handleChange('character', e.target.value)}
                                onBlur={() => setIsEditingEmoji(false)}
                                maxLength={2}
                            />
                        ) : (
                            <button
                                className="emoji-picker-button"
                                onClick={() => setIsEditingEmoji(true)}
                            >
                                {component.character}
                            </button>
                        )}
                        <p className="helper-text">Click to edit. Press Cmd+Ctrl+Space (Mac) or Win+. (Windows) for system emoji picker.</p>
                    </div>
                    <div className="form-group">
                        <label>Size (px)</label>
                        <div className="slider-group">
                            <input
                                type="range"
                                min="16"
                                max="200"
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
                        <label>Alignment</label>
                        <div className="text-align-group">
                            <button className={component.alignment === 'left' ? 'active' : ''} onClick={() => handleChange('alignment', 'left')}>L</button>
                            <button className={component.alignment === 'center' ? 'active' : ''} onClick={() => handleChange('alignment', 'center')}>C</button>
                            <button className={component.alignment === 'right' ? 'active' : ''} onClick={() => handleChange('alignment', 'right')}>R</button>
                        </div>
                    </div>
                </>
            );
            case 'layout': 
                const layoutComponent = component as ColumnLayoutComponent;
                const widths = layoutComponent.columnWidths || layoutComponent.columns.map(() => 100 / layoutComponent.columns.length);
                return (
                    <>
                        <p>You have selected a layout container. You can move or delete it, or style its background and borders below.</p>
                        <div className="column-widths-info">
                            <label>Column Widths</label>
                            <div className="column-widths-display">
                                {widths.map(w => w.toFixed(1)).join('% / ')}%
                            </div>
                            <button onClick={() => handleChange('columnWidths', undefined)} className="reset-button">Reset Column Sizes</button>
                        </div>
                    </>
                );
            default: return null;
        }
    }

    return (
        <div className="properties-panel">
            <h3>{component.type.charAt(0).toUpperCase() + component.type.slice(1)} Properties</h3>
            {renderProperties()}
            {component && <ContainerStyleEditor component={component} onUpdate={onUpdate} />}
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
interface AppState {
    components: EmailComponent[];
    emailSettings: EmailSettings;
}

interface EmailTemplate {
    id: string;
    name: string;
    state: AppState;
}

const TemplatesModal = ({ templates, onClose, onSave, onLoadState, onDelete, onRename, setConfirmation }) => {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const LIGHT_BLANK_STATE: AppState = {
      components: [],
      emailSettings: {
        backgroundColor: '#f8f9fa',
        contentBackgroundColor: '#ffffff',
        fontFamily: 'Arial',
        accentColor: '#0d6efd',
        textColor: '#212529',
      }
  };
  const DARK_BLANK_STATE: AppState = {
      components: [],
      emailSettings: {
        backgroundColor: '#1A1C1E',
        contentBackgroundColor: '#282A2D',
        fontFamily: 'Arial',
        accentColor: '#A8C7FA',
        textColor: '#E2E2E6',
      }
  };


  useEffect(() => {
    if (editingId && renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
    }
  }, [editingId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTemplateName.trim()) {
      onSave(newTemplateName.trim());
      setNewTemplateName('');
    }
  };

  const handleLoad = (stateToLoad: AppState) => {
    setConfirmation({
      message: 'This will replace your current email design. Are you sure?',
      onConfirm: () => {
        onLoadState(stateToLoad);
        onClose();
      }
    });
  };
  
  const handleDelete = (id: string) => {
    setConfirmation({
        message: 'Are you sure you want to delete this template?',
        onConfirm: () => onDelete(id)
    });
  };

  const handleRename = () => {
    if (editingId && editText.trim()) {
        onRename(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content template-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Email Templates</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSave} className="template-save-form">
            <input 
              type="text" 
              value={newTemplateName} 
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="Enter new template name"
            />
            <button type="submit">Save Current Email</button>
          </form>
          <ul className="template-list">
             {/* FIX: Changed <div> to <li> for valid HTML structure within a <ul>. */}
             <li className="template-section-header">Starters</li>
             <li className="template-item static-template">
                <span className="template-name">Blank (light)</span>
                <div className="template-actions">
                    <button onClick={() => handleLoad(LIGHT_BLANK_STATE)} className="load-btn">Load</button>
                </div>
             </li>
             <li className="template-item static-template">
                <span className="template-name">Blank (dark)</span>
                <div className="template-actions">
                    <button onClick={() => handleLoad(DARK_BLANK_STATE)} className="load-btn">Load</button>
                </div>
             </li>

            {/* FIX: Changed <div> to <li> for valid HTML structure within a <ul>. */}
            {templates.length > 0 && <li className="template-section-header">Your Templates</li>}

            {templates.length === 0 && !newTemplateName && (
              <li className="no-templates">You have no saved templates. Save your current design to get started.</li>
            )}
            
            {templates.map(template => {
              const isEditing = editingId === template.id;
              return (
                <li key={template.id} className="template-item">
                  {isEditing ? (
                    <input 
                       ref={renameInputRef}
                       type="text"
                       className="template-rename-input"
                       value={editText}
                       onChange={e => setEditText(e.target.value)}
                       onBlur={handleRename}
                       onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingId(null); }}
                    />
                  ) : (
                    <span className="template-name" onClick={() => { setEditingId(template.id); setEditText(template.name); }}>
                      {template.name}
                    </span>
                  )}
                  <div className="template-actions">
                    <button onClick={() => handleLoad(template.state)} className="load-btn">Load</button>
                    <button onClick={() => handleDelete(template.id)} className="delete-btn">Delete</button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content confirmation-modal">
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="confirm-btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="confirm-btn-primary" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
};

const generateIcsContent = (component: CalendarButtonComponent): string => {
    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        // Format to YYYYMMDDTHHMMSSZ, required by iCalendar spec
        return new Date(isoString).toISOString().replace(/[-:]|\.\d{3}/g, '');
    };

    const escapeText = (text: string) => {
        if (!text) return '';
        return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    };

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//EmailEditor//EN',
        'BEGIN:VEVENT',
        `UID:${component.id}@emaileditor.app`,
        `DTSTAMP:${formatDate(new Date().toISOString())}`,
        `DTSTART:${formatDate(component.startTime)}`,
        `DTEND:${formatDate(component.endTime)}`,
        `SUMMARY:${escapeText(component.eventTitle)}`,
        `DESCRIPTION:${escapeText(component.description)}`,
        `LOCATION:${escapeText(component.location)}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ];

    return lines.join('\r\n');
};

const App = () => {
  const initialState: AppState = {
      components: [],
      emailSettings: {
        backgroundColor: '#f8f9fa',
        contentBackgroundColor: '#ffffff',
        fontFamily: 'Arial',
        accentColor: '#0d6efd',
        textColor: '#212529',
      }
  };
  
  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<AppState>(initialState);
  const { components, emailSettings } = state;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [draggingComponentType, setDraggingComponentType] = useState<CreationComponentType | null>(null);
  const [favoriteComponents, setFavoriteComponents] = useState<FavoriteItem[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [confirmation, setConfirmation] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [componentList, setComponentList] = useState<ComponentListItem[]>(DEFAULT_COMPONENT_LIST);
  
  // Load favorites and templates from localStorage on initial mount
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('emailEditorFavorites');
      if (savedFavorites) setFavoriteComponents(JSON.parse(savedFavorites));

      const savedTemplates = localStorage.getItem('emailEditorTemplates');
      if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

      const savedOrder = localStorage.getItem('emailEditorComponentOrder');
      if (savedOrder) {
        const orderArray: CreationComponentType[] = JSON.parse(savedOrder);
        const defaultMap = new Map(DEFAULT_COMPONENT_LIST.map(item => [item.type, item]));
        const orderedList = orderArray.map(type => defaultMap.get(type)).filter(Boolean) as ComponentListItem[];
        const currentTypes = new Set(orderedList.map(item => item.type));
        DEFAULT_COMPONENT_LIST.forEach(item => {
            if (!currentTypes.has(item.type)) {
                orderedList.push(item);
            }
        });
        setComponentList(orderedList);
      }

    } catch (error) {
      console.error("Failed to load from localStorage:", error);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('emailEditorFavorites', JSON.stringify(favoriteComponents));
    } catch (error) {
      console.error("Failed to save favorites to localStorage:", error);
    }
  }, [favoriteComponents]);
  
  // Save templates to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('emailEditorTemplates', JSON.stringify(templates));
    } catch (error) {
      console.error("Failed to save templates to localStorage:", error);
    }
  }, [templates]);

  // Save component order to localStorage whenever it changes
  useEffect(() => {
    try {
      const orderToSave = componentList.map(item => item.type);
      localStorage.setItem('emailEditorComponentOrder', JSON.stringify(orderToSave));
    } catch (error) {
      console.error("Failed to save component order to localStorage:", error);
    }
  }, [componentList]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const undoKeyPressed = (isMac ? event.metaKey : event.ctrlKey) && !event.shiftKey && event.key === 'z';
        const redoKeyPressed = (isMac ? ((event.metaKey && event.shiftKey && event.key === 'z') || (event.metaKey && event.key === 'y')) : (event.ctrlKey && event.key === 'y'));
        
        if (undoKeyPressed) {
            event.preventDefault();
            undo();
        } else if (redoKeyPressed) {
            event.preventDefault();
            redo();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);


  const setComponents = (updater: (prev: EmailComponent[]) => EmailComponent[]) => {
      const newComponents = updater(components);
      setState({ ...state, components: newComponents });
  }
  
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

  const handleUpdateComponent = (id: string, updatedComponent: Partial<EmailComponent>) => {
    const recursiveUpdate = (items: EmailComponent[]): EmailComponent[] => {
        return items.map(c => {
            if (c.id === id) return { ...c, ...updatedComponent } as EmailComponent;
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
  
  const handleDeleteComponent = (idToDelete: string) => {
    if (selectedId === idToDelete) {
        setSelectedId(null);
    }
    setComponents(prev => recursiveDelete(prev, idToDelete));
  };

  const handleUpdateEmailSettings = (updatedSettings: Partial<EmailSettings>) => {
    setState({ ...state, emailSettings: { ...emailSettings, ...updatedSettings } });
  };

  const handleDuplicateComponent = (idToDuplicate: string) => {
    const regenerateIds = (component: EmailComponent): EmailComponent => {
      const newComponent = JSON.parse(JSON.stringify(component));
      const newId = (prefix: string) => `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;

      newComponent.id = newId('comp');
      newComponent.isLocked = false; // Always unlock duplicates

      if (newComponent.type === 'layout') {
        newComponent.columns.forEach((col: Column) => {
          col.id = newId('col');
          // FIX: The `regenerateIds` function returns `EmailComponent`, but `col.components` requires a `ContentComponent[]`.
          // Since the recursive call is on items from a `ContentComponent` array, we can safely cast the result.
          col.components = col.components.map((c: ContentComponent) => regenerateIds(c) as ContentComponent);
        });
      } else if (newComponent.type === 'social') {
        newComponent.links.forEach((link: SocialLink) => link.id = newId('social'));
      } else if (newComponent.type === 'button-group') {
        newComponent.buttons.forEach((btn: SubButton) => btn.id = newId('btn'));
      }

      return newComponent;
    };

    const findAndInsertDuplicate = (items: EmailComponent[]): EmailComponent[] => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.id === idToDuplicate) {
          const duplicate = regenerateIds(item);
          const newItems = [...items];
          newItems.splice(i + 1, 0, duplicate);
          return newItems;
        }

        if (item.type === 'layout') {
          for (let j = 0; j < item.columns.length; j++) {
            const col = item.columns[j];
            const updatedComponents = findAndInsertDuplicate(col.components) as ContentComponent[];

            if (updatedComponents !== col.components) {
              const newLayout = { ...item };
              newLayout.columns = [...item.columns];
              newLayout.columns[j] = { ...col, components: updatedComponents };
              const newItems = [...items];
              newItems[i] = newLayout;
              return newItems;
            }
          }
        }
      }
      return items;
    };

    setComponents(prev => findAndInsertDuplicate(prev));
  };

  const handleFavoriteComponent = (idToFavorite: string) => {
    const componentToFavorite = findComponent(idToFavorite, components);
    if (componentToFavorite) {
        const defaultName = componentToFavorite.type === 'layout' 
            ? (componentToFavorite as ColumnLayoutComponent).layoutType.replace('-', ' ') 
            : componentToFavorite.type;
        
        // Remove the prompt, which is unreliable in sandboxed environments.
        // Instantly add the favorite with a default name. The user can rename it later.
        const favoriteCopy = JSON.parse(JSON.stringify(componentToFavorite));
        const newFavorite: FavoriteItem = {
            id: `fav_${Date.now()}`,
            name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1), // Use the component type as the default name
            component: favoriteCopy,
        };
        setFavoriteComponents(prev => [...prev, newFavorite]);
    }
  };

  const handleRemoveFavorite = (idToRemove: string) => {
    setFavoriteComponents(prev => prev.filter(fav => fav.id !== idToRemove));
  };

  const handleRenameFavorite = (idToRename: string, newName: string) => {
    setFavoriteComponents(prev => prev.map(fav => fav.id === idToRename ? { ...fav, name: newName } : fav));
  };
  
  const handleSaveTemplate = (name: string) => {
    const newTemplate: EmailTemplate = {
      id: `tpl_${Date.now()}`,
      name,
      state: {
        components: JSON.parse(JSON.stringify(components)),
        emailSettings: JSON.parse(JSON.stringify(emailSettings)),
      },
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const handleLoadState = (newState: AppState) => {
    setState(newState);
    setSelectedId(null);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const handleRenameTemplate = (id: string, newName: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const handleExportData = () => {
    try {
        const backupData = {
            favorites: favoriteComponents,
            templates: templates,
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = 'email-editor-backup.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    } catch (error) {
        console.error("Failed to export data:", error);
        alert("An error occurred while exporting your data.");
    }
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const data = JSON.parse(text);

            if (Array.isArray(data.favorites) && Array.isArray(data.templates)) {
                setConfirmation({
                    message: 'This will overwrite your current favorites and templates. Are you sure you want to proceed?',
                    onConfirm: () => {
                        setFavoriteComponents(data.favorites);
                        setTemplates(data.templates);
                        alert('Data imported successfully!');
                    }
                });
            } else {
                throw new Error('Invalid backup file format.');
            }
        } catch (error) {
            console.error("Failed to import data:", error);
            alert(`Error importing file: ${(error as Error).message}`);
        } finally {
            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };
    reader.readAsText(file);
  };

  const handleReorderComponents = (newList: ComponentListItem[]) => {
    setComponentList(newList);
  };


  const selectedComponent = findComponent(selectedId, components);
  
  const getContainerStyleString = (component: EmailComponent): string => {
    if (!component.containerStyle) return '';

    const { backgroundColor, borderTop, borderRight, borderBottom, borderLeft } = component.containerStyle;
    let style = '';

    if (backgroundColor && backgroundColor !== 'transparent') {
        style += `background-color:${backgroundColor};`;
    }
    if (borderTop?.width && parseInt(borderTop.width) > 0) {
        style += `border-top:${borderTop.width}px solid ${borderTop.color};`;
    }
    if (borderRight?.width && parseInt(borderRight.width) > 0) {
        style += `border-right:${borderRight.width}px solid ${borderRight.color};`;
    }
     if (borderBottom?.width && parseInt(borderBottom.width) > 0) {
        style += `border-bottom:${borderBottom.width}px solid ${borderBottom.color};`;
    }
    if (borderLeft?.width && parseInt(borderLeft.width) > 0) {
        style += `border-left:${borderLeft.width}px solid ${borderLeft.color};`;
    }

    return style;
  };

  const generateComponentHtml = (component: EmailComponent): string => {
    const getPlaceholderSrc = (imgComponent: { naturalWidth?: number, naturalHeight?: number }, defaultW = 600, defaultH = 300) => {
        const w = imgComponent.naturalWidth || defaultW;
        const h = imgComponent.naturalHeight || defaultH;
        return `https://via.placeholder.com/${Math.round(w)}x${Math.round(h)}.png?text=Image`;
    };
    
    const containerStyles = getContainerStyleString(component);

    switch (component.type) {
      case 'text':
      case 'footer': {
        const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        // FIX: Correctly access the `color` property on TextComponent and FooterComponent. The property for text color is `color`, not `textColor`.
        const finalTextColor = component.useGlobalTextColor ? emailSettings.textColor : component.color;
        const textContent = `<div style="padding:10px; font-family:${finalFontFamily}, sans-serif; font-size:${component.fontSize}px; color:${finalTextColor}; text-align:${component.textAlign}; line-height: 1.5;">${component.content}</div>`;
        const textWrapper = `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="width:${component.width}%;">
                <tr><td>${textContent}</td></tr>
            </table>
        `;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td style="${containerStyles}">${textWrapper}</td></tr></table>`;
      }
      case 'image':
        const imgTag = `<img src="${component.src || getPlaceholderSrc(component)}" alt="${component.alt}" style="width:${component.width}%; max-width:100%; display:block; border:0; border-radius:${component.borderRadius}px;">`;
        const imageTdStyle = `padding: 10px 0; ${containerStyles}`;
        if (component.href) {
            return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${imageTdStyle}"><a href="${component.href}" target="_blank" style="text-decoration:none;">${imgTag}</a></td></tr></table>`;
        }
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${imageTdStyle}">${imgTag}</td></tr></table>`;
      case 'logo':
        const { naturalWidth, naturalHeight } = component;
        const logoWidth = parseInt(component.width, 10);
        let placeholderSrc;
        if (component.src) {
            placeholderSrc = component.src;
        } else if (naturalWidth && naturalHeight && naturalWidth > 0) {
            const calculatedHeight = logoWidth * (naturalHeight / naturalWidth);
            placeholderSrc = `https://via.placeholder.com/${logoWidth}x${Math.round(calculatedHeight)}.png?text=Logo`;
        } else {
            placeholderSrc = `https://via.placeholder.com/${logoWidth}x${Math.round(logoWidth/3)}.png?text=Logo`;
        }
        const logoTdStyle = `padding: 10px; ${containerStyles}`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${logoTdStyle}"><img src="${placeholderSrc}" alt="${component.alt}" width="${component.width}" style="display:block; max-width: 100%;"></td></tr></table>`;
      case 'button':
        const finalButtonBgColor = component.useGlobalAccentColor ? emailSettings.accentColor : component.backgroundColor;
        const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const buttonContent = `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;"><tr><td align="center" bgcolor="${finalButtonBgColor}" style="padding:10px 20px; border-radius:5px;"><a href="${component.href}" target="_blank" style="color:${component.textColor}; text-decoration:none; font-weight:${component.fontWeight}; font-family: ${finalFontFamily}, sans-serif; font-size: ${component.fontSize}px;">${component.text}</a></td></tr></table>`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td style="${containerStyles}">${buttonContent}</td></tr></table>`;

      case 'calendar':
        const finalCalButtonBgColor = component.useGlobalAccentColor ? emailSettings.accentColor : component.backgroundColor;
        const finalCalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const icsContent = generateIcsContent(component);
        const dataUri = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
        const calButtonContent = `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;"><tr><td align="center" bgcolor="${finalCalButtonBgColor}" style="padding:10px 20px; border-radius:5px;"><a href="${dataUri}" download="event.ics" target="_blank" style="color:${component.textColor}; text-decoration:none; font-weight:${component.fontWeight}; font-family: ${finalCalFontFamily}, sans-serif; font-size: ${component.fontSize}px;">${component.text}</a></td></tr></table>`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td style="${containerStyles}">${calButtonContent}</td></tr></table>`;
      
      case 'button-group':
        const finalGroupFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const buttonsHtml = component.buttons.map(btn => 
            `<td align="center" bgcolor="${btn.backgroundColor}" style="padding:10px 20px; border-radius:5px;"><a href="${btn.href}" target="_blank" style="color:${btn.textColor}; text-decoration:none; font-family: ${finalGroupFontFamily}, sans-serif;">${btn.text}</a></td>`
        ).join('<td width="10">&nbsp;</td>'); // Spacer cell
        const buttonGroupTdStyle = `padding:10px; ${containerStyles}`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${buttonGroupTdStyle}"><table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>${buttonsHtml}</tr></table></td></tr></table>`;
      case 'spacer':
        const spacerContent = `<div style="height:${component.height}px; line-height:${component.height}px; font-size:1px;">&nbsp;</div>`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td style="${containerStyles}">${spacerContent}</td></tr></table>`;
       case 'divider':
        const finalDividerColor = component.useGlobalAccentColor ? emailSettings.accentColor : component.color;
        const dividerItself = `
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:${component.width}%;">
                <tr>
                    <td style="font-size: 0; line-height: 0; border-top: ${component.height}px solid ${finalDividerColor};">&nbsp;</td>
                </tr>
            </table>
        `;
        const wrapperTdStyle = `padding:${component.padding}px 0; ${containerStyles}`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td style="${wrapperTdStyle}">${dividerItself}</td></tr></table>`;
      case 'social':
        const linksHtml = component.links.map(link => 
            `<td style="padding: 0 5px;"><a href="${link.url}" target="_blank"><img src="${SOCIAL_ICONS[link.platform]}" alt="${link.platform}" width="32" height="32" style="display: block;"></a></td>`
        ).join('');
        const socialTdStyle = `padding:10px; ${containerStyles}`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${socialTdStyle}"><table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>${linksHtml}</tr></table></td></tr></table>`;
      case 'video':
        const videoTdStyle = `padding:10px 0; ${containerStyles}`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${videoTdStyle}"><a href="${component.videoUrl}" target="_blank" style="display:inline-block; width:${component.width}%;"><img src="${component.imageUrl || getPlaceholderSrc(component)}" alt="${component.alt}" width="100%" style="max-width:100%; display:block;"></a></td></tr></table>`;
      case 'card': {
        const finalCardButtonBgColor = component.useGlobalButtonAccentColor ? emailSettings.accentColor : component.buttonBackgroundColor;
        const finalCardFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const finalCardTextColor = component.useGlobalTextColor ? emailSettings.textColor : component.textColor;
        const finalButtonFontFamily = component.useGlobalButtonFont ? emailSettings.fontFamily : component.buttonFontFamily;
        const imageRow = component.showImage ? `<tr><td align="center" style="font-size: 0; line-height: 0; padding-bottom: 15px;"><img src="${component.src || getPlaceholderSrc(component, 600, 400)}" alt="${component.alt}" style="max-width:100%; display:block;" width="${component.imageWidth}%"></td></tr>` : '';
        const buttonHtml = component.showButton ? `<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;"><tr><td align="center" bgcolor="${finalCardButtonBgColor}" style="padding:10px 20px; border-radius:5px;"><a href="${component.buttonHref}" target="_blank" style="color:${component.buttonTextColor}; text-decoration:none; font-weight:${component.buttonFontWeight}; font-size: 16px; font-family: ${finalButtonFontFamily}, sans-serif;">${component.buttonText}</a></td></tr></table>` : '';
        const cardContentTable = `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:${component.backgroundColor}; border-radius: 5px; overflow: hidden;">
                ${imageRow}
                <tr><td style="padding: 15px; color: ${finalCardTextColor}; font-family: ${finalCardFontFamily}, sans-serif;">
                    <h4 style="margin:0 0 5px; font-size: 18px;">${component.title}</h4>
                    <p style="margin:0 0 15px; font-size: 14px;">${component.content}</p>
                    ${buttonHtml}
                </td></tr>
            </table>
        `;
        const cardWrapper = `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="width:${component.width}%;">
              <tr>
                <td>${cardContentTable}</td>
              </tr>
            </table>
        `;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td style="${containerStyles}">${cardWrapper}</td></tr></table>`;
      }
      case 'emoji':
          const emojiTdStyle = `padding: 10px; font-size: ${component.fontSize}px; line-height: 1; text-align: ${component.alignment}; ${containerStyles}`;
          return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${emojiTdStyle}"><span style="font-size: ${component.fontSize}px; line-height: 1;">${component.character}</span></td></tr></table>`;
      case 'layout':
        const columnCount = component.columns.length;
        const columnWidths = component.columnWidths || Array(columnCount).fill(100 / columnCount);
        const columnsHtml = component.columns.map((col, index) => {
            const content = col.components.map(c => generateComponentHtml(c)).join('\n');
            return `<td valign="top" width="${columnWidths[index]}%" class="column-wrapper" style="padding: 5px;">${content}</td>`
        }).join('');
        return `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
              <tr>
                <td style="${containerStyles}">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                      <tr>${columnsHtml}</tr>
                  </table>
                </td>
              </tr>
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
<meta charSet="utf-8">
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
          <div className="history-controls">
            <button onClick={undo} disabled={!canUndo}>Undo</button>
            <button onClick={redo} disabled={!canRedo}>Redo</button>
          </div>
          <div className="data-actions">
            {/* FIX: Removed `header-button` className to allow new styles from `data-actions button` to apply correctly. */}
            <button onClick={() => importInputRef.current?.click()}>Import</button>
            <button onClick={handleExportData}>Export</button>
            <input
                type="file"
                ref={importInputRef}
                style={{ display: 'none' }}
                accept="application/json"
                onChange={handleImportFileSelect}
            />
          </div>
          <button className="header-button" onClick={() => setShowTemplatesModal(true)}>Templates</button>
          <button onClick={() => setShowExportModal(true)}>Export HTML</button>
        </div>
      </header>
      <main className="main-container">
        <ComponentsPanel
            setDraggingComponentType={setDraggingComponentType}
            setSelectedId={setSelectedId}
            favorites={favoriteComponents}
            onRemoveFavorite={handleRemoveFavorite}
            onRenameFavorite={handleRenameFavorite}
            componentList={componentList}
            onReorder={handleReorderComponents}
        />
        <Canvas
          components={components}
          setComponents={setComponents}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          emailSettings={emailSettings}
          draggingComponentType={draggingComponentType}
          setDraggingComponentType={setDraggingComponentType}
          onUpdate={handleUpdateComponent}
          onDuplicate={handleDuplicateComponent}
          onDelete={handleDeleteComponent}
          onFavorite={handleFavoriteComponent}
          componentList={componentList}
        />
        <PropertiesPanel
          component={selectedComponent}
          onUpdate={handleUpdateComponent}
          emailSettings={emailSettings}
          onUpdateSettings={handleUpdateEmailSettings}
        />
      </main>
      {showExportModal && <ExportModal html={generateEmailHtml()} onClose={() => setShowExportModal(false)} />}
      {showTemplatesModal && 
        <TemplatesModal 
            templates={templates}
            onClose={() => setShowTemplatesModal(false)}
            onSave={handleSaveTemplate}
            onLoadState={handleLoadState}
            onDelete={handleDeleteTemplate}
            onRename={handleRenameTemplate}
            setConfirmation={setConfirmation}
        />
      }
      {confirmation && (
        <ConfirmationModal 
            message={confirmation.message}
            onConfirm={() => {
                confirmation.onConfirm();
                setConfirmation(null);
            }}
            onCancel={() => setConfirmation(null)}
        />
      )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);