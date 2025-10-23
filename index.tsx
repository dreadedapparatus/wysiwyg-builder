import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';

// --- TYPES ---
type ComponentType = 'text' | 'image' | 'button' | 'spacer' | 'layout' | 'card' | 'divider' | 'social' | 'video' | 'logo' | 'footer' | 'button-group' | 'emoji' | 'calendar' | 'table';

// Define a new type for component creation that includes layout types.
type CreationComponentType = ComponentType | 'two-column' | 'three-column' | 'image-text' | 'text-image' | 'two-column-text' | 'three-column-images' | 'two-column-cards';

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
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
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
    style: 'default' | 'minimalist';
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
  useGlobalButtonAccentColor: boolean;
  width: string;
  buttonFontWeight: 'normal' | 'bold';
  buttonFontFamily: string;
  useGlobalButtonFont: boolean;
  layout: 'image-top' | 'image-left' | 'image-right';
}

interface EmojiComponent extends BaseComponent {
  type: 'emoji';
  character: string;
  fontSize: string;
  alignment: 'left' | 'center' | 'right';
}

interface TableComponent extends BaseComponent {
    type: 'table';
    rows: number;
    cols: number;
    data: string[][];
    hasHeader: boolean;
    cellBorderWidth: string;
    headerFillColor: string;
    headerTextColor: string;
    useAutoHeaderTextColor: boolean;
    tableBackgroundColor: string;
    fontFamily: string;
    useGlobalFont: boolean;
    textColor: string;
    useGlobalTextColor: boolean;
    width: string;
    textAlign: 'left' | 'center' | 'right';
    verticalAlign: 'top' | 'middle' | 'bottom';
    fontSize: string;
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
    | CalendarButtonComponent
    | TableComponent;

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
const getContrastingTextColor = (hexColor: string): string => {
    if (!hexColor || hexColor.length < 4) {
        return '#000000'; // default to black for invalid colors
    }

    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hexColor = hexColor.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
    if (!result) {
        return '#000000';
    }

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
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
      setCurrentIndex(currentIndex - 1);
    }
  }, [canUndo, currentIndex]);

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
  { type: 'table', label: 'Table', icon: '▦' },
  { type: 'two-column', label: '2 Columns', icon: '||', isLayout: true },
  { type: 'three-column', label: '3 Columns', icon: '|||', isLayout: true },
  { type: 'image-text', label: 'Image + Text', icon: '🖼️ T', isLayout: true },
  { type: 'text-image', label: 'Text + Image', icon: 'T 🖼️', isLayout: true },
  { type: 'two-column-text', label: 'Two Column Text', icon: 'T | T', isLayout: true },
  { type: 'two-column-cards', label: 'Two Cards', icon: '🃏|🃏', isLayout: true },
  { type: 'three-column-images', label: 'Three Images', icon: '🖼️|🖼️|🖼️', isLayout: true },
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

const MINIMALIST_SOCIAL_ICONS: { [key in SocialLink['platform']]: string } = {
    facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    instagram: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z',
    linkedin: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-3.18V18.5h3.18v-5.9c0-.9.73-1.63 1.63-1.63s1.63.73 1.63 1.63v5.9h3.18M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m-1.55 9.94h3.1v-9h-3.1z',
    youtube: 'M21.58,7.19C21.36,6.45 20.81,5.82 20.07,5.6C18.6,5 12,5 12,5S5.4,5 3.93,5.6C3.19,5.82 2.65,6.45 2.42,7.19C2,8.64 2,12 2,12S2,15.36 2.42,16.81C2.65,17.55 3.19,18.18 3.93,18.4C5.4,19 12,19 12,19S18.6,19 20.07,18.4C20.81,18.18 21.36,17.55 21.58,16.81C22,15.36 22,12 22,12S22,8.64 21.58,7.19M9.54,15.58V8.42L15.82,12L9.54,15.58Z',
    website: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
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

const InlineEditor = ({ html, onUpdate, tagName = 'div', style, className, clickEvent }: {
    html: string;
    onUpdate: (newHtml: string) => void;
    tagName?: 'div' | 'p' | 'h4';
    style?: React.CSSProperties;
    className?: string;
    clickEvent?: { clientX: number, clientY: number };
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const initialHtml = useRef(html); // Store initial value for Escape key

    useEffect(() => {
        const editorNode = editorRef.current;
        if (!editorNode) return;

        editorNode.focus({ preventScroll: true });

        // If click coordinates are provided, try to set the cursor position.
        // We use a zero-delay setTimeout to defer this logic until after the browser
        // has processed the focus event, preventing a race condition where the
        // default focus behavior (cursor at start) overrides our range setting.
        if (clickEvent && typeof document.caretRangeFromPoint === 'function') {
            const timerId = setTimeout(() => {
                const range = document.caretRangeFromPoint(clickEvent.clientX, clickEvent.clientY);
                if (range) {
                    const selection = window.getSelection();
                    if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }, 0);
            return () => clearTimeout(timerId);
        }
    }, [clickEvent]);

    const handleBlur = () => {
        if (editorRef.current) {
            onUpdate(editorRef.current.innerHTML);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // On Escape, revert and blur
        if (e.key === 'Escape') {
            if (editorRef.current) {
                editorRef.current.innerHTML = initialHtml.current;
                editorRef.current.blur();
            }
        }
        
        // On Ctrl/Cmd + Enter, insert a line break
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            document.execCommand('insertHTML', false, '<br>');
            return;
        }

        // On Enter (without Shift), just blur to save
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            editorRef.current?.blur();
        }
    };

    const Tag = tagName;

    return (
        <Tag
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: html }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={style}
            className={`inline-editor ${className || ''}`}
        />
    );
};


const Canvas = ({ components, setComponents, selectedId, setSelectedId, emailSettings, draggingComponentType, setDraggingComponentType, onUpdate, onDuplicate, onDelete, onFavorite, componentList, editingField, setEditingField }) => {
  const [dragOverTarget, setDragOverTarget] = useState<DropTarget | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  const createNewComponent = (type: CreationComponentType): EmailComponent => {
    const uid = () => `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    const id = `comp_${uid()}`;
    const baseProps: Pick<BaseComponent, 'id' | 'isLocked'> = { id, isLocked: false };
    const transparentBg = { 
      backgroundColor: 'transparent', 
      paddingTop: '10', 
      paddingRight: '10', 
      paddingBottom: '10', 
      paddingLeft: '10' 
    };

    switch (type) {
      case 'text':
        return { ...baseProps, type, content: 'This is a new text block. Click to edit!', fontSize: '16', color: '#000000', fontFamily: 'Arial', textAlign: 'left', useGlobalFont: true, useGlobalTextColor: true, width: '100', containerStyle: { ...transparentBg } };
      case 'image':
        return { ...baseProps, type, src: '', alt: 'Placeholder', borderRadius: '0', width: '100', alignment: 'center', containerStyle: { ...transparentBg, paddingRight: '0', paddingLeft: '0' } };
      case 'button':
        return { ...baseProps, type, text: 'Click Me', href: '#', backgroundColor: '#0d6efd', textColor: '#ffffff', fontSize: '16', fontWeight: 'normal', useGlobalAccentColor: true, fontFamily: 'Arial', useGlobalFont: true, containerStyle: { ...transparentBg } };
      case 'calendar':
        const startDate = new Date();
        const endDate = new Date();
        endDate.setHours(startDate.getHours() + 1);
        return { ...baseProps, type, text: 'Add to Calendar', backgroundColor: '#0d6efd', textColor: '#ffffff', fontSize: '16', fontWeight: 'normal', useGlobalAccentColor: true, fontFamily: 'Arial', useGlobalFont: true, eventTitle: 'My Event', startTime: startDate.toISOString().slice(0, 16), endTime: endDate.toISOString().slice(0, 16), location: 'Online', description: 'This is an event description.', containerStyle: { ...transparentBg } };
      case 'spacer':
        return { ...baseProps, type, height: '20', containerStyle: { backgroundColor: 'transparent' } };
      case 'divider':
        return { ...baseProps, type, color: '#cccccc', height: '1', padding: '10', width: '100', useGlobalAccentColor: true, containerStyle: { backgroundColor: 'transparent' } };
      case 'social':
        return { ...baseProps, type, alignment: 'center', style: 'default', links: [
            { id: `social_${uid()}_1`, platform: 'facebook', url: '#' },
            { id: `social_${uid()}_2`, platform: 'twitter', url: '#' },
            { id: `social_${uid()}_3`, platform: 'instagram', url: '#' },
        ], containerStyle: { ...transparentBg }};
      case 'video':
        return { ...baseProps, type, videoUrl: '#', imageUrl: '', alt: 'Video thumbnail', width: '100', alignment: 'center', containerStyle: { ...transparentBg, paddingRight: '0', paddingLeft: '0' } };
      case 'card':
        return { ...baseProps, type, src: '', alt: 'Card Image', title: 'Card Title', content: 'This is some card content. Describe the item or feature here.', buttonText: 'Learn More', buttonHref: '#', backgroundColor: '#f8f9fa', textColor: '#212529', buttonBackgroundColor: '#0d6efd', buttonTextColor: '#ffffff', showImage: true, imageWidth: '100', showButton: true, fontFamily: 'Arial', useGlobalFont: true, useGlobalButtonAccentColor: true, width: '100', buttonFontWeight: 'bold', buttonFontFamily: 'Arial', useGlobalButtonFont: true, layout: 'image-top', containerStyle: { backgroundColor: 'transparent' } };
      case 'logo':
        return { ...baseProps, type, src: '', alt: 'Company Logo', width: '150', alignment: 'center', containerStyle: { ...transparentBg } };
      case 'footer':
        return { ...baseProps, type, content: 'Your Company Name<br>123 Street, City, State 12345<br><a href="#" style="color: #888888; text-decoration: underline;">Unsubscribe</a>', fontSize: '12', color: '#888888', fontFamily: 'Arial', textAlign: 'center', useGlobalFont: true, useGlobalTextColor: true, width: '100', containerStyle: { ...transparentBg } };
      case 'button-group':
        return { ...baseProps, type, alignment: 'center', fontFamily: 'Arial', useGlobalFont: true, buttons: [
            { id: `btn_${uid()}_1`, text: 'Button 1', href: '#', backgroundColor: '#0d6efd', textColor: '#ffffff' },
            { id: `btn_${uid()}_2`, text: 'Button 2', href: '#', backgroundColor: '#6c757d', textColor: '#ffffff' },
        ], containerStyle: { ...transparentBg }};
      case 'emoji':
        return { ...baseProps, type, character: '🎉', fontSize: '48', alignment: 'center', containerStyle: { ...transparentBg } };
      case 'table': {
        const rows = 3;
        const cols = 3;
        const data = Array(rows).fill(null).map((_, r) => 
            Array(cols).fill(null).map((_, c) => r === 0 ? `Header ${c + 1}` : 'Cell')
        );
        return {
          ...baseProps,
          type: 'table',
          rows,
          cols,
          data,
          hasHeader: true,
          cellBorderWidth: '1',
          headerFillColor: '#f0f0f0',
          headerTextColor: '#000000',
          useAutoHeaderTextColor: true,
          tableBackgroundColor: 'transparent',
          fontFamily: 'Arial',
          useGlobalFont: true,
          textColor: '#000000',
          useGlobalTextColor: true,
          width: '100',
          textAlign: 'left',
          verticalAlign: 'top',
          fontSize: '14',
          containerStyle: { ...transparentBg }
        };
      }
      case 'two-column':
        return { ...baseProps, id, type: 'layout', layoutType: 'two-column', columns: [{ id: `col_${uid()}_1`, components: [] }, { id: `col_${uid()}_2`, components: [] }], containerStyle: { backgroundColor: 'transparent' } };
      case 'three-column':
        return { ...baseProps, id, type: 'layout', layoutType: 'three-column', columns: [{ id: `col_${uid()}_1`, components: [] }, { id: `col_${uid()}_2`, components: [] }, { id: `col_${uid()}_3`, components: [] }], containerStyle: { backgroundColor: 'transparent' } };
      case 'image-text':
        return {
          ...baseProps,
          id,
          type: 'layout',
          layoutType: 'two-column',
          columns: [
            { id: `col_${uid()}_1`, components: [createNewComponent('image') as ContentComponent] },
            { id: `col_${uid()}_2`, components: [createNewComponent('text') as ContentComponent] },
          ],
          containerStyle: { backgroundColor: 'transparent' }
        };
      case 'text-image':
        return {
          ...baseProps,
          id,
          type: 'layout',
          layoutType: 'two-column',
          columns: [
            { id: `col_${uid()}_1`, components: [createNewComponent('text') as ContentComponent] },
            { id: `col_${uid()}_2`, components: [createNewComponent('image') as ContentComponent] },
          ],
          containerStyle: { backgroundColor: 'transparent' }
        };
      case 'two-column-text':
        return {
          ...baseProps,
          id,
          type: 'layout',
          layoutType: 'two-column',
          columns: [
            { id: `col_${uid()}_1`, components: [createNewComponent('text') as ContentComponent] },
            { id: `col_${uid()}_2`, components: [createNewComponent('text') as ContentComponent] },
          ],
          containerStyle: { backgroundColor: 'transparent' }
        };
      case 'two-column-cards':
        return {
          ...baseProps,
          id,
          type: 'layout',
          layoutType: 'two-column',
          columns: [
            { id: `col_${uid()}_1`, components: [createNewComponent('card') as ContentComponent] },
            { id: `col_${uid()}_2`, components: [createNewComponent('card') as ContentComponent] },
          ],
          containerStyle: { backgroundColor: 'transparent' }
        };
      case 'three-column-images':
        return {
          ...baseProps,
          id,
          type: 'layout',
          layoutType: 'three-column',
          columns: [
            { id: `col_${uid()}_1`, components: [createNewComponent('image') as ContentComponent] },
            { id: `col_${uid()}_2`, components: [createNewComponent('image') as ContentComponent] },
            { id: `col_${uid()}_3`, components: [createNewComponent('image') as ContentComponent] },
          ],
          containerStyle: { backgroundColor: 'transparent' }
        };
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
    const newComponent: EmailComponent = JSON.parse(JSON.stringify(component));
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
    setDraggingId(null);

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
      setEditingField(null);
      // Also blur any active element to ensure focus styles are removed,
      // especially when deselecting from an inline editor.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
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


  const renderContentComponent = (component: ContentComponent, targetPath?: DropLocation) => {
      switch (component.type) {
      case 'text':
      case 'footer': {
          const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
          const finalTextColor = component.useGlobalTextColor ? emailSettings.textColor : component.color;
          const isEditing = editingField?.componentId === component.id && editingField?.field === 'content';
          const textStyles: React.CSSProperties = { fontSize: `${component.fontSize}px`, color: finalTextColor, fontFamily: finalFontFamily, textAlign: component.textAlign, width: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' };
          
          const textContent = isEditing ? (
              <InlineEditor
                  html={component.content}
                  onUpdate={(newHtml) => {
                      onUpdate(component.id, { ...component, content: newHtml });
                      setEditingField(null);
                  }}
                  style={textStyles}
                  tagName="div"
                  clickEvent={editingField.clickEvent}
              />
          ) : (
              <div
                  dangerouslySetInnerHTML={{ __html: component.content }}
                  style={textStyles}
                  onDoubleClick={(e) => {
                      if (!component.isLocked) {
                          setSelectedId(component.id);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setEditingField({
                              componentId: component.id,
                              field: 'content',
                              clickEvent: { clientX: e.clientX, clientY: e.clientY },
                              position: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height }
                          });
                      }
                  }}
              />
          );
          return <div style={{ width: `${component.width}%`, margin: '0 auto' }}>{textContent}</div>;
      }
      case 'image': {
        const imageContainerStyle: React.CSSProperties = {
          textAlign: component.alignment,
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
              <div style={{ textAlign: component.alignment }}>
                <div className="empty-image-placeholder" style={{ width: `${component.width}px` }}>
                  <div className="icon">🏢</div>
                  <span>Logo</span>
                </div>
              </div>
            );
          }
          return <div style={{ textAlign: component.alignment }}><img src={component.previewSrc || component.src} alt={component.alt} style={{ width: `${component.width}px`, maxWidth: '100%', display: 'inline-block' }} /></div>;
      case 'button':
      case 'calendar':
          const finalButtonBgColor = component.useGlobalAccentColor ? emailSettings.accentColor : component.backgroundColor;
          const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
          const href = component.type === 'button' ? component.href : '#'; // Calendar link is handled in export
          return (
          <div style={{ textAlign: 'center' }}>
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
            <div style={{ textAlign: component.alignment }}>
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
          if (component.style === 'minimalist') {
              const finalAccentColor = emailSettings.accentColor;
              return (
                  <div style={{ textAlign: component.alignment }}>
                      {component.links.map(link => (
                          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0 5px' }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill={finalAccentColor} xmlns="http://www.w3.org/2000/svg">
                                  <path d={MINIMALIST_SOCIAL_ICONS[link.platform]} />
                              </svg>
                          </a>
                      ))}
                  </div>
              );
          }
          return (
            <div style={{ textAlign: component.alignment }}>
              {component.links.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0 5px' }}>
                      <img src={SOCIAL_ICONS[link.platform]} alt={link.platform} width="32" height="32" />
                  </a>
              ))}
            </div>
          );
       case 'video': {
            const videoContainerStyle: React.CSSProperties = { textAlign: component.alignment };
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
          const isInColumn = targetPath?.type === 'column';
          const finalCardButtonBgColor = component.useGlobalButtonAccentColor ? emailSettings.accentColor : component.buttonBackgroundColor;
          const finalCardFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
          const finalCardTextColor = component.textColor;
          const finalButtonFontFamily = component.useGlobalButtonFont ? emailSettings.fontFamily : component.buttonFontFamily;
          const isEditingTitle = editingField?.componentId === component.id && editingField?.field === 'title';
          const isEditingContent = editingField?.componentId === component.id && editingField?.field === 'content';
          const isHorizontal = component.layout === 'image-left' || component.layout === 'image-right';

          const cardOuterStyle: React.CSSProperties = {
              width: `${component.width}%`,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              ...(isInColumn && { height: '100%' }),
          };

          const cardInnerStyle: React.CSSProperties = {
              backgroundColor: component.backgroundColor,
              padding: '15px',
              borderRadius: '5px',
              fontFamily: finalCardFontFamily,
              display: 'flex',
              flexDirection: isHorizontal ? (component.layout === 'image-left' ? 'row' : 'row-reverse') : 'column',
              gap: isHorizontal ? '15px' : '0',
              ...(isInColumn && { flexGrow: 1 }),
              ...(isHorizontal && { alignItems: 'center' }),
          };
          
          const titleWrapperStyle: React.CSSProperties = {
              margin: '0 0 5px',
              ...(isInColumn && { minHeight: '3em' }), // Reserve space for ~2 lines of title text
          };

          const titleStyle: React.CSSProperties = {
              margin: 0,
              fontSize: '1.2em',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
          };

          const contentContainerStyle: React.CSSProperties = {
            color: finalCardTextColor,
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1, // Let this container grow
          };

          const paragraphStyle: React.CSSProperties = {
            margin: '0 0 10px',
            flexGrow: 1, // Let the paragraph itself grow
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          };

          const imageContainer = component.showImage ? (
            <div style={{
              flexShrink: 0,
              width: isHorizontal ? '40%' : `${component.imageWidth}%`,
              margin: isHorizontal ? '0' : '0 auto 15px',
              textAlign: 'center',
            }}>
              {(!component.previewSrc && !component.src) ? (
                  <div className="empty-image-placeholder" style={{ width: '100%' }}>
                      <div className="icon">🃏</div>
                      <span>Card Image</span>
                  </div>
              ) : (
                  <img 
                      src={component.previewSrc || component.src} 
                      alt={component.alt} 
                      style={{
                          width: '100%',
                          maxWidth: '100%',
                          height: 'auto',
                          display: 'block',
                          margin: '0 auto',
                          borderRadius: '4px',
                      }}
                  />
              )}
            </div>
          ) : null;
          
          const contentAndButtonContainer = (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
            }}>
              <div style={contentContainerStyle}>
                <div style={titleWrapperStyle}>
                  {isEditingTitle ? (
                    <InlineEditor
                      html={component.title}
                      onUpdate={(newHtml) => { onUpdate(component.id, { ...component, title: newHtml }); setEditingField(null); }}
                      tagName="h4"
                      style={titleStyle}
                      clickEvent={editingField.clickEvent}
                    />
                  ) : (
                    <h4
                      style={titleStyle}
                      onDoubleClick={(e) => {
                          if (!component.isLocked) {
                              setSelectedId(component.id);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setEditingField({ componentId: component.id, field: 'title', clickEvent: { clientX: e.clientX, clientY: e.clientY }, position: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height } });
                          }
                      }}
                      dangerouslySetInnerHTML={{ __html: component.title }}
                    />
                  )}
                </div>
                {isEditingContent ? (
                  <InlineEditor
                    html={component.content}
                    onUpdate={(newHtml) => { onUpdate(component.id, { ...component, content: newHtml }); setEditingField(null); }}
                    tagName="p"
                    style={paragraphStyle}
                    clickEvent={editingField.clickEvent}
                  />
                ) : (
                  <p
                    style={paragraphStyle}
                    onDoubleClick={(e) => {
                        if (!component.isLocked) {
                            setSelectedId(component.id);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setEditingField({ componentId: component.id, field: 'content', clickEvent: { clientX: e.clientX, clientY: e.clientY }, position: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height } });
                        }
                    }}
                    dangerouslySetInnerHTML={{ __html: component.content }}
                  />
                )}
              </div>
              {component.showButton && (
                <div style={{ textAlign: 'center', marginTop: 'auto' }}>
                  <a href={component.buttonHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: finalCardButtonBgColor, color: component.buttonTextColor, textDecoration: 'none', borderRadius: '5px', fontWeight: component.buttonFontWeight, fontFamily: finalButtonFontFamily }}>{component.buttonText}</a>
                </div>
              )}
            </div>
          );

          return (
              <div style={cardOuterStyle}>
                  <div style={cardInnerStyle}>
                      {imageContainer}
                      {contentAndButtonContainer}
                  </div>
              </div>
          );
      }
      case 'emoji':
          return (
            <div style={{ textAlign: component.alignment }}>
                <span style={{ fontSize: `${component.fontSize}px`, lineHeight: 1 }}>
                    {component.character}
                </span>
            </div>
          );
      case 'table': {
          const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
          const finalTextColor = component.useGlobalTextColor ? emailSettings.textColor : component.textColor;
          const finalHeaderTextColor = component.useAutoHeaderTextColor
            ? getContrastingTextColor(component.headerFillColor)
            : component.headerTextColor;

          const tableStyle: React.CSSProperties = {
            width: `${component.width}%`,
            margin: '0 auto',
            borderCollapse: 'collapse',
            fontFamily: finalFontFamily,
            color: finalTextColor,
            backgroundColor: component.tableBackgroundColor === 'transparent' ? undefined : component.tableBackgroundColor
          };

          const cellStyle: React.CSSProperties = {
            border: `${component.cellBorderWidth}px solid #ccc`,
            padding: '8px',
            textAlign: component.textAlign,
            verticalAlign: component.verticalAlign,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            fontSize: `${component.fontSize}px`,
          };
          
          const headerCellStyle: React.CSSProperties = {
            ...cellStyle,
            backgroundColor: component.headerFillColor,
            fontWeight: 'bold',
            color: finalHeaderTextColor,
          };

          const handleCellUpdate = (newHtml: string, r: number, c: number) => {
            const newData = component.data.map((row, rowIndex) =>
              row.map((cell, colIndex) => (rowIndex === r && colIndex === c ? newHtml : cell))
            );
            onUpdate(component.id, { ...component, data: newData });
            setEditingField(null);
          };

          const headerRowData = component.hasHeader ? component.data[0] : null;
          const bodyData = component.hasHeader ? component.data.slice(1) : component.data;

          return (
            <table style={tableStyle} className="canvas-table-component">
              {component.hasHeader && headerRowData && (
                <thead>
                  <tr>
                    {headerRowData.map((cellContent, c) => {
                      const isEditing = editingField?.componentId === component.id && editingField?.rowIndex === 0 && editingField?.colIndex === c;
                      return (
                        <th
                          key={`header-${c}`}
                          style={headerCellStyle}
                          onDoubleClick={(e) => {
                            if (!component.isLocked) {
                              setSelectedId(component.id);
                              const rect = e.currentTarget.getBoundingClientRect();
                              setEditingField({
                                  componentId: component.id,
                                  field: 'cell',
                                  rowIndex: 0,
                                  colIndex: c,
                                  clickEvent: { clientX: e.clientX, clientY: e.clientY },
                                  position: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height }
                              });
                            }
                          }}
                        >
                          {isEditing ? (
                            <InlineEditor
                              html={cellContent}
                              onUpdate={(newHtml) => handleCellUpdate(newHtml, 0, c)}
                              style={{ margin: '-8px', padding: '8px', minHeight: '1.2em' }}
                              clickEvent={editingField.clickEvent}
                            />
                          ) : (
                            <div dangerouslySetInnerHTML={{ __html: cellContent }} />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
              )}
              <tbody>
                {bodyData.map((rowData, r_idx) => {
                  const dataRowIndex = component.hasHeader ? r_idx + 1 : r_idx;
                  return (
                    <tr key={`row-${dataRowIndex}`}>
                      {rowData.map((cellContent, c) => {
                        const isEditing = editingField?.componentId === component.id && editingField?.rowIndex === dataRowIndex && editingField?.colIndex === c;
                        return (
                          <td
                            key={`cell-${dataRowIndex}-${c}`}
                            style={cellStyle}
                            onDoubleClick={(e) => {
                              if (!component.isLocked) {
                                setSelectedId(component.id);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setEditingField({
                                    componentId: component.id,
                                    field: 'cell',
                                    rowIndex: dataRowIndex,
                                    colIndex: c,
                                    clickEvent: { clientX: e.clientX, clientY: e.clientY },
                                    position: { top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height }
                                });
                              }
                            }}
                          >
                            {isEditing ? (
                              <InlineEditor
                                html={cellContent}
                                onUpdate={(newHtml) => handleCellUpdate(newHtml, dataRowIndex, c)}
                                style={{ margin: '-8px', padding: '8px', minHeight: '1.2em' }}
                                clickEvent={editingField.clickEvent}
                              />
                            ) : (
                              <div dangerouslySetInnerHTML={{ __html: cellContent }} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
      }
      default:
          return null;
      }
  };

  const getContainerInlineStyles = (component: EmailComponent): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (!component.containerStyle) return styles;

    const { backgroundColor, borderTop, borderRight, borderBottom, borderLeft, paddingTop, paddingRight, paddingBottom, paddingLeft } = component.containerStyle;

    if (backgroundColor && backgroundColor !== 'transparent') {
        styles.backgroundColor = backgroundColor;
    }
     if (paddingTop && parseInt(paddingTop) >= 0) {
        styles.paddingTop = `${paddingTop}px`;
    }
    if (paddingRight && parseInt(paddingRight) >= 0) {
        styles.paddingRight = `${paddingRight}px`;
    }
    if (paddingBottom && parseInt(paddingBottom) >= 0) {
        styles.paddingBottom = `${paddingBottom}px`;
    }
    if (paddingLeft && parseInt(paddingLeft) >= 0) {
        styles.paddingLeft = `${paddingLeft}px`;
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
    const isEditingInline = editingField?.componentId === component.id;

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
    
    const isCardInColumn = targetPath.type === 'column' && component.type === 'card';

    const classNames = [
        'canvas-component',
        isLayout ? 'layout-component-wrapper' : '',
        selectedId === component.id ? 'selected' : '',
        draggingId === component.id ? 'dragging' : '',
    ].filter(Boolean).join(' ');
    
    const renderItemStyles: React.CSSProperties = {};
    if (isCardInColumn) {
        renderItemStyles.display = 'flex';
        renderItemStyles.flexDirection = 'column';
        renderItemStyles.flexGrow = 1;
    }
    
    const containerStyles = getContainerInlineStyles(component);
    const containerWrapperStyles: React.CSSProperties = { ...containerStyles };
    if (isCardInColumn) {
        containerWrapperStyles.display = 'flex';
        containerWrapperStyles.flexDirection = 'column';
        containerWrapperStyles.flexGrow = 1;
    }
    
    return (
        <React.Fragment>
            {isDropTargetBefore && <DropPlaceholder componentType={draggingComponentType} />}
            <div
                className={classNames}
                onClick={!isLayout ? clickHandler : undefined}
                draggable={!component.isLocked && !isEditingInline}
                onDragStart={!component.isLocked ? handleDragStart : undefined}
                onDragEnd={handleDragEnd}
                onDragOver={!isLayout ? handleItemDragOver : undefined}
                onDrop={!isLayout ? (e) => handleDrop(e, dragOverTarget!) : undefined}
                style={renderItemStyles}
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
                    {selectedId === component.id && !isEditingInline && (
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
                    <div style={containerWrapperStyles}>
                        {renderContentComponent(component as ContentComponent, targetPath)}
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
    
    const handlePaddingChange = (side, value) => {
        const newStyle = {
            ...containerStyle,
            [side]: value
        };
        onUpdate(component.id, { ...component, containerStyle: newStyle });
    };

    const borderSides = ['borderTop', 'borderRight', 'borderBottom', 'borderLeft'];
    const paddingSides = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];

    return (
        <div className="container-style-editor-content">
            <div className="form-group">
                <label>Background Color</label>
                <div className="color-input-group">
                    <input
                        type="color"
                        value={(containerStyle.backgroundColor && containerStyle.backgroundColor !== 'transparent') ? containerStyle.backgroundColor : '#ffffff'}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    />
                    <input
                        type="text"
                        value={containerStyle.backgroundColor || ''}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        placeholder="transparent"
                    />
                    <button
                        className="transparent-btn"
                        onClick={() => handleStyleChange('backgroundColor', 'transparent')}
                        title="Set background to transparent"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    </button>
                </div>
            </div>

            <div className="padding-editor">
                <label>Padding</label>
                {paddingSides.map(side => (
                    <div key={side} className="padding-row">
                        <span>{side.replace('padding', '')}</span>
                        <div className="padding-inputs">
                            <input
                                type="number"
                                min="0"
                                value={containerStyle[side] || '0'}
                                onChange={(e) => handlePaddingChange(side, e.target.value)}
                            />
                            <span>px</span>
                        </div>
                    </div>
                ))}
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

const EMOJI_CATEGORIES = {
  'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '👩‍🦱', '👩‍🦳', '👩‍🦲', '👱‍♀️', '👱‍♂️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🧑‍⚕️', '👨‍⚕️', '👩‍⚕️', '🧑‍🎓', '👨‍🎓', '👩‍🎓', '🧑‍🏫', '👨‍🏫', '👩‍🏫', '🧑‍⚖️', '👨‍⚖️', '👩‍⚖️', '🧑‍🌾', '👨‍🌾', '👩‍🌾', '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🧑‍🔧', '👨‍🔧', '👩‍🔧', '🧑‍🏭', '👨‍🏭', '👩‍🏭', '🧑‍💼', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍💻', '👩‍💻', '🧑‍🎤', '👨‍🎤', '👩‍🎤', '🧑‍🎨', '👨‍🎨', '👩‍🎨', '🧑‍✈️', '👨‍✈️', '👩‍✈️', '🧑‍🚀', '👨‍🚀', '👩‍🚀', '🧑‍🚒', '👨‍🚒', '👩‍🚒', '👮', '👮‍♂️', '👮‍♀️', '🕵️', '🕵️‍♂️', '🕵️‍♀️', '💂', '💂‍♂️', '💂‍♀️', '👷', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '🧑‍🍼', '👨‍🍼', '👩‍🍼', '👼', '🎅', '🤶', '🦸', '🦸‍♂️', '🦸‍♀️', '🦹', '🦹‍♂️', '🦹‍♀️', '🧙', '🧙‍♂️', '🧙‍♀️', '🧚', '🧚‍♂️', '🧚‍♀️', '🧛', '🧛‍♂️', '🧛‍♀️', '🧜', '🧜‍♂️', '🧜‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧞', '🧞‍♂️', '🧞‍♀️', '🧟', '🧟‍♂️', '🧟‍♀️', '💆', '💆‍♂️', '💆‍♀️', '💇', '💇‍♂️', '💇‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🧑‍🦽', '👨‍🦽', '👩‍🦽', '🧑‍🦼', '👨‍🦼', '👩‍🦼', '🧑‍🦯', '👨‍🦯', '👩‍🦯', '🏃', '🏃‍♂️', '🏃‍♀️', '💃', '🕺', '🕴️', '👯', '👯‍♂️', '👯‍♀️', '🧖', '🧖‍♂️', '🧖‍♀️', '🧗', '🧗‍♂️', '🧗‍♀️', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏌️‍♂️', '🏌️‍♀️', '🏄', '🏄‍♂️', '🏄‍♀️', '🚣', '🚣‍♂️', '🚣‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '⛹️', '⛹️‍♂️', '⛹️‍♀️', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🚵', '🚵‍♂️', '🚵‍♀️', '🤸', '🤸‍♂️', '🤸‍♀️', '🤼', '🤼‍♂️', '🤼‍♀️', '🤽', '🤽‍♂️', '🤽‍♀️', '🤾', '🤾‍♂️', '🤾‍♀️', '🤹', '🤹‍♂️', '🤹‍♀️', '🧘', '🧘‍♂️', '🧘‍♀️', '🛀', '🛌', '🧑‍🤝‍🧑', '👭', '👫', '👬', '💏', '💑', '👪', '👨‍👩‍👦', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦', '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧', '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦', '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '🫂'],
  'Animals & Nature': ['🙈', '🙉', '🙊', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾', '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅', '🦆', '🦢', '🦉', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎', '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🐟', '🐠', '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🐞', '🦗', '🕷️', '🕸️', '🦂', '🦟', '🦠', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌍', '🌎', '🌏', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🌡️', '☀️', '🌝', '🌞', '🪐', '⭐', '🌟', '🌠', '🌌', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔', '⛱️', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊'],
  'Food & Drink': ['🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄', '🔪', '🏺'],
  'Activities': ['🕴️', '🧗', '🧗‍♀️', '🧗‍♂️', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏌️‍♀️', '🏌️‍♂️', '🏄', '🏄‍♀️', '🏄‍♂️', '🚣', '🚣‍♀️', '🚣‍♂️', '🏊', '🏊‍♀️', '🏊‍♂️', '⛹️', '⛹️‍♀️', '⛹️‍♂️', '🏋️', '🏋️‍♀️', '🏋️‍♂️', '🚴', '🚴‍♀️', '🚴‍♂️', '🚵', '🚵‍♀️', '🚵‍♂️', '🤸', '🤸‍♀️', '🤸‍♂️', '🤼', '🤼‍♀️', '🤼‍♂️', '🤽', '🤽‍♀️', '🤽‍♂️', '🤾', '🤾‍♀️', '🤾‍♂️', '🤹', '🤹‍♀️', '🤹‍♂️', '🧘', '🧘‍♀️', '🧘‍♂️', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '⛸️', '🎣', '🎽', '🎿', '🛷', '🥌', '🎯', '🎱', '🔮', '🧿', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅', '🪆', '♟️', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🪀', '🪁'],
  'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '🛢️', '⛽', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚆', '🚝', '🚄', '🚅', '🚈', '🚂', '✈️', '🛫', '🛬', '💺', '🚁', '🚟', '🛰️', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '🚧', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '🎠', '🎡', '🎢', '🎪', '🚂', '🏠', '🏡', '🏘️', '🏚️', '🏢', '🏬', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '🏟️', '🗿', '🗺️'],
  'Objects': ['💌', '🕳️', '💣', '🔫', '🔪', '🗡️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🧭', '🧱', '💈', '🛢️', '⚗️', '⚖️', '🦯', '🧰', '🔧', '🔨', '⚒️', '⛏️', '🔩', '⚙️', '⛓️', '🧲', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛗', ' gương', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑️', '💄', '💍', '💼'],
  'Symbols': ['☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '👁️‍🗨️', '🔚', '🔙', '🔛', '🔜', '🔝', '〰️', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫', '⬛', '⬜', '◼️', '◻️', '◾', '◽', '▪️', '▫️', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '🔲', '🔳', '💭', '🗯️', '💬', '🗨️', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'],
  'Flags': ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫', '🇧🇬', '🇧🇭', '🇧🇮', '🇧🇯', '🇧🇱', '🇧🇲', '🇧🇳', '🇧🇴', '🇧🇶', '🇧🇷', '🇧🇸', '🇧🇹', '🇧🇻', '🇧🇼', '🇧🇾', '🇧🇿', '🇨🇦', '🇨🇨', '🇨🇩', '🇨🇫', '🇨🇬', '🇨🇭', '🇨🇮', '🇨🇰', '🇨🇱', '🇨🇲', '🇨🇳', '🇨🇴', '🇨🇵', '🇨🇷', '🇨🇺', '🇨🇻', '🇨🇼', '🇨🇽', '🇨🇾', '🇨🇿', '🇩🇪', '🇩🇬', '🇩🇯', '🇩🇰', '🇩🇲', '🇩🇴', '🇩🇿', '🇪🇦', '🇪🇨', '🇪🇪', '🇪🇬', '🇪🇭', '🇪🇷', '🇪🇸', '🇪🇹', '🇪🇺', '🇫🇮', '🇫🇯', '🇫🇰', '🇫🇲', '🇫🇴', '🇫🇷', '🇬🇦', '🇬🇧', '🇬🇩', '🇬🇪', '🇬🇫', '🇬🇬', '🇬🇭', '🇬🇮', '🇬🇱', '🇬🇲', '🇬🇳', '🇬🇵', '🇬🇶', '🇬🇷', '🇬🇸', '🇬🇹', '🇬🇺', '🇬🇼', '🇬🇾', '🇭🇰', '🇭🇲', '🇭🇳', '🇭🇷', '🇭🇹', '🇭🇺', '🇮🇨', '🇮🇩', '🇮🇪', '🇮🇱', '🇮🇲', '🇮🇳', '🇮🇴', '🇮🇶', '🇮🇷', '🇮🇸', '🇮🇹', '🇯🇪', '🇯🇲', '🇯🇴', '🇯🇵', '🇰🇪', '🇰🇬', '🇰🇭', '🇰🇮', '🇰🇲', '🇰🇳', '🇰🇵', '🇰🇷', '🇰🇼', '🇰🇾', '🇰🇿', '🇱🇦', '🇱🇧', '🇱🇨', '🇱🇮', '🇱🇰', '🇱🇷', '🇱🇸', '🇱🇹', '🇱🇺', '🇱🇻', '🇱🇾', '🇲🇦', '🇲🇨', '🇲🇩', '🇲🇪', '🇲🇫', '🇲🇬', '🇲🇭', '🇲🇰', '🇲🇱', '🇲🇲', '🇲🇳', '🇲🇴', '🇲🇵', '🇲🇶', '🇲🇷', '🇲🇸', '🇲🇹', '🇲🇺', '🇲🇻', '🇲🇼', '🇲🇽', '🇲🇾', '🇲🇿', '🇳🇦', '🇳🇨', '🇳🇪', '🇳🇫', '🇳🇬', '🇳🇮', '🇳🇱', '🇳🇴', '🇳🇵', '🇳🇷', '🇳🇺', '🇳🇿', '🇴🇲', '🇵🇦', '🇵🇪', '🇵🇫', '🇵🇬', '🇵🇭', '🇵🇰', '🇵🇱', '🇵🇲', '🇵🇳', '🇵🇷', '🇵🇸', '🇵🇹', '🇵🇼', '🇵🇾', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇸', '🇷🇺', '🇷🇼', '🇸🇦', '🇸🇧', '🇸🇨', '🇸🇩', '🇸🇪', '🇸🇬', '🇸🇭', '🇸🇮', '🇸🇯', '🇸🇰', '🇸🇱', '🇸🇲', '🇸🇳', '🇸🇴', '🇸🇷', '🇸🇸', '🇸🇹', '🇸🇻', '🇸🇽', '🇸🇾', '🇸🇿', '🇹🇦', '🇹🇨', '🇹🇩', '🇹🇫', '🇹🇬', '🇹🇭', '🇹🇯', '🇹🇰', '🇹🇱', '🇹🇲', '🇹🇳', '🇹🇴', '🇹🇷', '🇹🇹', '🇹🇻', '🇹🇼', '🇹🇿', '🇺🇦', '🇺🇬', '🇺🇲', '🇺🇳', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇦', '🇻🇨', '🇻🇪', '🇻🇬', '🇻🇮', '🇻🇳', '🇻🇺', '🇼🇫', '🇼🇸', '🇽🇰', '🇾🇪', '🇾🇹', '🇿🇦', '🇿🇲', '🇿🇼', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿']
};


const EmojiPicker = ({ onSelect, onClose, position }) => {
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    const style: React.CSSProperties = {
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1003
    };

    return createPortal(
        <div ref={pickerRef} className="emoji-picker-popover" style={style}>
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                <div key={category}>
                    <div className="emoji-category">{category}</div>
                    <div className="emoji-grid">
                        {emojis.map(emoji => (
                            <button
                                key={emoji}
                                className="emoji-picker-button"
                                onClick={() => {
                                    onSelect(emoji);
                                    onClose();
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>,
        document.body
    );
};

const Tab: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    className={`tab-button ${isActive ? 'active' : ''}`}
    onClick={onClick}
    role="tab"
    aria-selected={isActive}
  >
    {label}
  </button>
);

const TabPanel: React.FC<{
  isActive: boolean;
  children: React.ReactNode;
}> = ({ isActive, children }) => (
  isActive ? <div className="tab-panel" role="tabpanel">{children}</div> : null
);

const Tabs: React.FC<{
    tabs: string[];
    children: React.ReactNode[];
}> = ({ tabs, children }) => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="properties-tabs">
            <div className="tab-list" role="tablist">
                {tabs.map((tab, index) => (
                    <Tab key={tab} label={tab} isActive={index === activeTab} onClick={() => setActiveTab(index)} />
                ))}
            </div>
            {children.map((child, index) => (
                <TabPanel key={index} isActive={index === activeTab}>
                    {child}
                </TabPanel>
            ))}
        </div>
    );
};


const PropertiesPanel = ({ component, onUpdate, emailSettings, onUpdateSettings }) => {
    const FONT_FAMILIES = ['Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Brush Script MT'];
    const SOCIAL_PLATFORMS = Object.keys(SOCIAL_ICONS) as SocialLink['platform'][];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    
    // Reset editing state when the selected component changes
    useEffect(() => {
        setShowEmojiPicker(false);
    }, [component?.id]);


    if (!component) {
        return (
            <div className="properties-panel">
                <h3>Email Settings</h3>
                <div className="property-group">
                    <h4>Canvas Colors</h4>
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
                <div className="property-group">
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
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu.be\/)([a-zA-Z0-9_-]{11})/;
            const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/;

            const youtubeMatch = videoUrl.match(youtubeRegex);
            if (youtubeMatch && youtubeMatch[1]) {
                const videoId = youtubeMatch[1];
                // Use the high-quality default thumbnail as it's the most reliable option for good quality.
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                return { thumbnailUrl, title: null }; // We can't get the title this way, so we return null.
            }

            // For Vimeo, the oEmbed approach is still necessary.
            if (vimeoRegex.test(videoUrl)) {
                 try {
                    const response = await fetch(`https://jsonlink.io/oembed?url=${encodeURIComponent(videoUrl)}`);
                    if (!response.ok) throw new Error(`oEmbed proxy fetch failed with status: ${response.status}`);
                    
                    const data = await response.json();
                    if (data.error || !data.thumbnail_url) throw new Error(data.error || 'Thumbnail URL not found in oEmbed response.');

                    return { thumbnailUrl: data.thumbnail_url, title: data.title || null };
                } catch (error) {
                    console.error("Failed to fetch Vimeo thumbnail:", error);
                    return { thumbnailUrl: null, title: null };
                }
            }

            // Not a supported URL
            return { thumbnailUrl: null, title: null };
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
                <Tabs tabs={['Style', 'Container']}>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Typography & Style</h4>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Use Global Font</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
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
                                    <div className="global-toggle-group" style={{ marginBottom: '8px' }}>
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
                        </div>
                        <div className="property-group">
                            <h4>Dimensions</h4>
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
                        </div>
                    </div>
                    {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'image': return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Source & Link</h4>
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
                        </div>
                    </div>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Appearance</h4>
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
                        </div>
                    </div>
                    {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'logo': return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Source</h4>
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
                        </div>
                    </div>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Appearance</h4>
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
                        </div>
                    </div>
                    {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'button': return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Content & Link</h4>
                            <div className="form-group">
                                <label>Button Text</label>
                                <input type="text" value={component.text} onChange={(e) => handleChange('text', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>URL</label>
                                <input type="url" value={component.href} onChange={(e) => handleChange('href', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Typography</h4>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Use Global Font</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
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
                        </div>
                        <div className="property-group">
                            <h4>Colors</h4>
                             <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Use Global Accent Color</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.useGlobalAccentColor} onChange={(e) => handleChange('useGlobalAccentColor', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
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
                        </div>
                    </div>
                    {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'calendar': return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
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
                        </div>
                        <div className="property-group">
                            <h4>Button</h4>
                            <div className="form-group">
                                <label>Button Text</label>
                                <input type="text" value={component.text} onChange={(e) => handleChange('text', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Typography</h4>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Use Global Font</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
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
                        </div>
                        <div className="property-group">
                            <h4>Colors</h4>
                             <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Use Global Accent Color</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.useGlobalAccentColor} onChange={(e) => handleChange('useGlobalAccentColor', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
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
                        </div>
                    </div>
                     {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'button-group': return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Buttons</h4>
                            <div className="form-group">
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
                        </div>
                    </div>
                     {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Layout & Style</h4>
                            <div className="form-group">
                                <label>Alignment</label>
                                <div className="text-align-group">
                                    <button className={component.alignment === 'left' ? 'active' : ''} onClick={() => handleChange('alignment', 'left')}>L</button>
                                    <button className={component.alignment === 'center' ? 'active' : ''} onClick={() => handleChange('alignment', 'center')}>C</button>
                                    <button className={component.alignment === 'right' ? 'active' : ''} onClick={() => handleChange('alignment', 'right')}>R</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Use Global Font</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Font Family</label>
                                <select value={component.fontFamily} disabled={component.useGlobalFont} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                                    {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                     {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'spacer': return (
                <Tabs tabs={['Style', 'Container']}>
                     {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Dimensions</h4>
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
                        </div>
                    </div>
                     {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'divider': return (
                <Tabs tabs={['Style', 'Container']}>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Styling</h4>
                             <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Use Global Accent Color</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.useGlobalAccentColor} onChange={(e) => handleChange('useGlobalAccentColor', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
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
                        </div>
                    </div>
                     {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
             case 'social': return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Links</h4>
                            <div className="form-group">
                                <div className="social-link-editor">
                                    {component.links.map((link, index) => (
                                        <div key={link.id} className="social-link-item">
                                            <select value={link.platform} onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value as SocialLink['platform'])}>
                                                {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                            </select>
                                            <input type="url" value={link.url} onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)} placeholder="https://example.com" />
                                            <button onClick={() => removeSocialLink(index)} className="remove-btn">🗑️</button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addSocialLink} className="add-btn">Add Social Link</button>
                            </div>
                        </div>
                    </div>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Layout & Style</h4>
                            <div className="form-group">
                                <label>Alignment</label>
                                <div className="text-align-group">
                                    <button className={component.alignment === 'left' ? 'active' : ''} onClick={() => handleChange('alignment', 'left')}>L</button>
                                    <button className={component.alignment === 'center' ? 'active' : ''} onClick={() => handleChange('alignment', 'center')}>C</button>
                                    <button className={component.alignment === 'right' ? 'active' : ''} onClick={() => handleChange('alignment', 'right')}>R</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Icon Style</label>
                                <div className="button-toggle-group">
                                    <button className={component.style === 'default' ? 'active' : ''} onClick={() => handleChange('style', 'default')}>Default</button>
                                    <button className={component.style === 'minimalist' ? 'active' : ''} onClick={() => handleChange('style', 'minimalist')}>Minimalist</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'video': return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Source</h4>
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
                        </div>
                    </div>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Appearance</h4>
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
                        </div>
                    </div>
                    {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'card': return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Image</h4>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Show Image</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.showImage} onChange={(e) => handleChange('showImage', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
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
                                        <label>Alt Text</label>
                                        <input type="text" value={component.alt} onChange={(e) => handleChange('alt', e.target.value)} />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="property-group">
                            <h4>Button</h4>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Show Button</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.showButton} onChange={(e) => handleChange('showButton', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
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
                                </>
                            )}
                        </div>
                    </div>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Layout</h4>
                            <div className="form-group">
                                <div className="layout-selector-group">
                                    <button
                                        className={component.layout === 'image-top' ? 'active' : ''}
                                        onClick={() => handleChange('layout', 'image-top')}
                                        title="Image on Top"
                                    >
                                        <div className="layout-icon icon-top">
                                            <div className="img"></div>
                                            <div className="txt"></div>
                                        </div>
                                    </button>
                                    <button
                                        className={component.layout === 'image-left' ? 'active' : ''}
                                        onClick={() => handleChange('layout', 'image-left')}
                                        title="Image on Left"
                                    >
                                        <div className="layout-icon icon-left">
                                            <div className="img"></div>
                                            <div className="txt"></div>
                                        </div>
                                    </button>
                                    <button
                                        className={component.layout === 'image-right' ? 'active' : ''}
                                        onClick={() => handleChange('layout', 'image-right')}
                                        title="Image on Right"
                                    >
                                         <div className="layout-icon icon-right">
                                            <div className="img"></div>
                                            <div className="txt"></div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                             <div className="form-group">
                                <label>Card Width (%)</label>
                                <div className="slider-group">
                                    <input type="range" min="10" max="100" value={component.width} onChange={(e) => handleChange('width', e.target.value)}/>
                                    <input type="number" min="10" max="100" className="slider-value-input" value={component.width} onChange={(e) => handleChange('width', e.target.value)} />
                                </div>
                            </div>
                             {component.showImage && (
                                <div className="form-group">
                                    <label>Image Width (%)</label>
                                    <div className="slider-group">
                                        <input type="range" min="10" max="100" value={component.imageWidth} onChange={(e) => handleChange('imageWidth', e.target.value)}/>
                                        <input type="number" min="10" max="100" className="slider-value-input" value={component.imageWidth} onChange={(e) => handleChange('imageWidth', e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="property-group">
                            <h4>Content Style</h4>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                    <label>Use Global Font</label>
                                    <label className="switch">
                                        <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Font Family</label>
                                <select value={component.fontFamily} disabled={component.useGlobalFont} onChange={(e) => handleChange('fontFamily', e.target.value)}>
                                    {FONT_FAMILIES.map(font => <option key={font} value={font}>{font}</option>)}
                                </select>
                            </div>
                             <div className="form-group">
                                <label>Text Color</label>
                                 <div className="color-input-group">
                                     <input type="color" value={component.textColor} onChange={(e) => handleChange('textColor', e.target.value)} />
                                     <input type="text" value={component.textColor} onChange={(e) => handleChange('textColor', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        {component.showButton && (
                            <div className="property-group">
                                <h4>Button Style</h4>
                                <div className="form-group">
                                    <div className="global-toggle-group">
                                        <label>Use Global Font</label>
                                        <label className="switch">
                                            <input type="checkbox" checked={component.useGlobalButtonFont} onChange={(e) => handleChange('useGlobalButtonFont', e.target.checked)} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
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
                                 <div className="form-group">
                                    <div className="global-toggle-group">
                                        <label>Use Global Button Color</label>
                                        <label className="switch">
                                            <input type="checkbox" checked={component.useGlobalButtonAccentColor} onChange={(e) => handleChange('useGlobalButtonAccentColor', e.target.checked)} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>
                                 <div className="form-group">
                                    <label>Button Background</label>
                                     <div className="color-input-group">
                                         <input type="color" value={component.buttonBackgroundColor} disabled={component.useGlobalButtonAccentColor} onChange={(e) => handleChange('buttonBackgroundColor', e.target.value)} />
                                         <input type="text" value={component.buttonBackgroundColor} disabled={component.useGlobalButtonAccentColor} onChange={(e) => handleChange('buttonBackgroundColor', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                         <div className="property-group">
                            <h4>Card Style</h4>
                            <div className="form-group">
                                <label>Card Background</label>
                                 <div className="color-input-group">
                                     <input type="color" value={component.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                                     <input type="text" value={component.backgroundColor} onChange={(e) => handleChange('backgroundColor', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
            );
            case 'emoji': 
                const buttonRect = emojiButtonRef.current?.getBoundingClientRect();
                const pickerPosition = buttonRect ? { top: buttonRect.bottom + 8, left: buttonRect.left } : { top: 0, left: 0 };
            
                return (
                    <>
                        <Tabs tabs={['Style', 'Container']}>
                            {/* Style Tab */}
                            <div>
                                <div className="property-group">
                                    <h4>Content & Appearance</h4>
                                    <div className="form-group">
                                        <label>Emoji Character</label>
                                        <button
                                            ref={emojiButtonRef}
                                            className="emoji-display-button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        >
                                            {component.character}
                                        </button>
                                    </div>
                                    <div className="form-group">
                                        <label>Size (px)</label>
                                        <div className="slider-group">
                                            <input type="range" min="16" max="200" value={component.fontSize} onChange={(e) => handleChange('fontSize', e.target.value)} />
                                            <input type="number" min="1" className="slider-value-input" value={component.fontSize} onChange={(e) => handleChange('fontSize', e.target.value)} />
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
                                </div>
                            </div>
                            {/* Container Tab */}
                            <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                        </Tabs>
                        {showEmojiPicker && (
                            <EmojiPicker
                                onSelect={(emoji) => handleChange('character', emoji)}
                                onClose={() => setShowEmojiPicker(false)}
                                position={pickerPosition}
                            />
                        )}
                    </>
                );
            case 'table':
              const handleTableResize = (newRowsStr: string, newColsStr: string) => {
                const newRows = Math.max(1, parseInt(newRowsStr, 10) || 1);
                const newCols = Math.max(1, parseInt(newColsStr, 10) || 1);
                const oldData = component.data;
                const newData = Array(newRows).fill(null).map((_, r) =>
                  Array(newCols).fill(null).map((_, c) => {
                    const isHeaderRow = component.hasHeader && r === 0;
                    const defaultText = isHeaderRow ? `Header ${c + 1}` : 'Cell';
                    return oldData[r] && oldData[r][c] ? oldData[r][c] : defaultText;
                  })
                );
                onUpdate(component.id, { ...component, data: newData, rows: newRows, cols: newCols });
              };

              return (
                <Tabs tabs={['Content', 'Style', 'Container']}>
                    {/* Content Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Structure</h4>
                            <div className="form-group-row">
                              <div className="form-group">
                                <label>Rows</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={component.rows}
                                  onChange={(e) => handleTableResize(e.target.value, String(component.cols))}
                                />
                              </div>
                              <div className="form-group">
                                <label>Columns</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={component.cols}
                                  onChange={(e) => handleTableResize(String(component.rows), e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                  <label>Enable Header Row</label>
                                  <label className="switch">
                                    <input
                                      type="checkbox"
                                      checked={component.hasHeader}
                                      onChange={(e) => handleChange('hasHeader', e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                  </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Style Tab */}
                    <div>
                        <div className="property-group">
                            <h4>Table Style</h4>
                            <div className="form-group">
                              <label>Cell Border (px)</label>
                              <input
                                type="number"
                                min="0"
                                value={component.cellBorderWidth}
                                onChange={(e) => handleChange('cellBorderWidth', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label>Table Background Color</label>
                              <div className="color-input-group">
                                <input type="color" value={component.tableBackgroundColor === 'transparent' ? '#ffffff' : component.tableBackgroundColor} onChange={(e) => handleChange('tableBackgroundColor', e.target.value)} />
                                <input type="text" value={component.tableBackgroundColor} onChange={(e) => handleChange('tableBackgroundColor', e.target.value)} placeholder="transparent" />
                                <button className="transparent-btn" onClick={() => handleChange('tableBackgroundColor', 'transparent')} title="Set transparent">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                                </button>
                              </div>
                            </div>
                             <div className="form-group">
                              <label>Table Width (%)</label>
                              <div className="slider-group">
                                <input type="range" min="10" max="100" value={component.width} onChange={(e) => handleChange('width', e.target.value)}/>
                                <input type="number" min="10" max="100" className="slider-value-input" value={component.width} onChange={(e) => handleChange('width', e.target.value)} />
                              </div>
                            </div>
                        </div>
                          {component.hasHeader && (
                            <div className="property-group">
                                <h4>Header Style</h4>
                                <div className="form-group">
                                    <label>Header Fill Color</label>
                                    <div className="color-input-group">
                                      <input type="color" value={component.headerFillColor} onChange={(e) => handleChange('headerFillColor', e.target.value)} />
                                      <input type="text" value={component.headerFillColor} onChange={(e) => handleChange('headerFillColor', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="global-toggle-group">
                                      <label>Auto-contrast text color</label>
                                      <label className="switch">
                                        <input type="checkbox" checked={component.useAutoHeaderTextColor} onChange={(e) => handleChange('useAutoHeaderTextColor', e.target.checked)} />
                                        <span className="slider round"></span>
                                      </label>
                                    </div>
                                </div>
                                {!component.useAutoHeaderTextColor && (
                                    <div className="form-group">
                                      <label>Header Text Color</label>
                                      <div className="color-input-group">
                                        <input type="color" value={component.headerTextColor} onChange={(e) => handleChange('headerTextColor', e.target.value)} />
                                        <input type="text" value={component.headerTextColor} onChange={(e) => handleChange('headerTextColor', e.target.value)} />
                                      </div>
                                    </div>
                                )}
                            </div>
                          )}
                        <div className="property-group">
                            <h4>Body Typography</h4>
                            <div className="form-group">
                                <div className="global-toggle-group">
                                  <label>Use Global Font</label>
                                  <label className="switch">
                                    <input type="checkbox" checked={component.useGlobalFont} onChange={(e) => handleChange('useGlobalFont', e.target.checked)} />
                                    <span className="slider round"></span>
                                  </label>
                                </div>
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
                              <label>Text Color</label>
                              <div className="global-toggle-group" style={{ marginBottom: '8px' }}>
                                <label>Use Global</label>
                                <label className="switch">
                                  <input type="checkbox" checked={component.useGlobalTextColor} onChange={(e) => handleChange('useGlobalTextColor', e.target.checked)} />
                                  <span className="slider round"></span>
                                </label>
                              </div>
                              <div className="color-input-group">
                                <input type="color" value={component.textColor} disabled={component.useGlobalTextColor} onChange={(e) => handleChange('textColor', e.target.value)} />
                                <input type="text" value={component.textColor} disabled={component.useGlobalTextColor} onChange={(e) => handleChange('textColor', e.target.value)} />
                              </div>
                            </div>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Horizontal Align</label>
                                    <div className="text-align-group">
                                        <button className={component.textAlign === 'left' ? 'active' : ''} onClick={() => handleChange('textAlign', 'left')}>L</button>
                                        <button className={component.textAlign === 'center' ? 'active' : ''} onClick={() => handleChange('textAlign', 'center')}>C</button>
                                        <button className={component.textAlign === 'right' ? 'active' : ''} onClick={() => handleChange('textAlign', 'right')}>R</button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Vertical Align</label>
                                    <div className="button-toggle-group">
                                        <button className={component.verticalAlign === 'top' ? 'active' : ''} onClick={() => handleChange('verticalAlign', 'top')}>Top</button>
                                        <button className={component.verticalAlign === 'middle' ? 'active' : ''} onClick={() => handleChange('verticalAlign', 'middle')}>Middle</button>
                                        <button className={component.verticalAlign === 'bottom' ? 'active' : ''} onClick={() => handleChange('verticalAlign', 'bottom')}>Bottom</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                     {/* Container Tab */}
                    <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                </Tabs>
              );
            case 'layout': 
                const layoutComponent = component as ColumnLayoutComponent;
                const widths = layoutComponent.columnWidths || layoutComponent.columns.map(() => 100 / layoutComponent.columns.length);
                return (
                    <Tabs tabs={['Style', 'Container']}>
                        {/* Style Tab */}
                        <div>
                            <div className="property-group">
                                <h4>Columns</h4>
                                <p>You can move or delete this layout, or style its container.</p>
                                <div className="column-widths-info">
                                    <label>Column Widths</label>
                                    <div className="column-widths-display">
                                        {widths.map(w => w.toFixed(1)).join('% / ')}%
                                    </div>
                                    <button onClick={() => handleChange('columnWidths', undefined)} className="reset-button">Reset Column Sizes</button>
                                </div>
                            </div>
                        </div>
                        {/* Container Tab */}
                        <ContainerStyleEditor component={component} onUpdate={onUpdate} />
                    </Tabs>
                );
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
interface AppState {
    components: EmailComponent[];
    emailSettings: EmailSettings;
}

interface EmailTemplate {
    id: string;
    name: string;
    state: AppState;
}

const TemplatesModal = ({ templates, onClose, onSave, onLoadState, onDelete, onRename, onOverwrite, setConfirmation }) => {
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

  const handleOverwrite = (id: string) => {
    setConfirmation({
        message: 'This will overwrite the template with your current design. Are you sure?',
        onConfirm: () => onOverwrite(id)
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
                    <button onClick={() => handleOverwrite(template.id)} className="overwrite-btn">Overwrite</button>
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

const PreviewMode = ({ html, onExit }) => {
    const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const deviceWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    };

    // Use a Blob URL to set iframe content for better cross-origin and deployment compatibility
    useEffect(() => {
        if (iframeRef.current && html) {
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            iframeRef.current.src = url;

            // Clean up the object URL when the component unmounts or HTML changes
            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [html]);
    
    // Handle Escape key to exit preview
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onExit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onExit]);


    return createPortal(
        <div className="preview-overlay">
            <header className="preview-header">
                <div className="preview-header-left">
                    <h2>Preview</h2>
                </div>
                <div className="device-toggle-buttons">
                    <button 
                        className={device === 'desktop' ? 'active' : ''} 
                        onClick={() => setDevice('desktop')}
                        title="Desktop"
                    >
                        🖥️
                    </button>
                    <button 
                        className={device === 'tablet' ? 'active' : ''} 
                        onClick={() => setDevice('tablet')}
                        title="Tablet"
                    >
                        💻
                    </button>
                    <button 
                        className={device === 'mobile' ? 'active' : ''} 
                        onClick={() => setDevice('mobile')}
                        title="Mobile"
                    >
                        📱
                    </button>
                </div>
                <div className="preview-header-right">
                    <button onClick={onExit}>Back to Editor</button>
                </div>
            </header>
            <main className="preview-content">
                <div className="preview-iframe-wrapper" style={{ maxWidth: deviceWidths[device] }}>
                    <iframe ref={iframeRef} src="about:blank" title="Email Preview" frameBorder="0" />
                </div>
            </main>
        </div>,
        document.body
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

const defaultAppState: AppState = {
    components: [],
    emailSettings: {
      backgroundColor: '#f8f9fa',
      contentBackgroundColor: '#ffffff',
      fontFamily: 'Arial',
      accentColor: '#0d6efd',
      textColor: '#212529',
    }
};

const getInitialState = (): AppState => {
    try {
      const autosavedStateJSON = localStorage.getItem('emailEditorAutosave');
      if (autosavedStateJSON) {
        const parsedState = JSON.parse(autosavedStateJSON);
        // Basic validation to ensure the loaded state has the expected structure
        if (parsedState && Array.isArray(parsedState.components) && parsedState.emailSettings) {
             return parsedState;
        }
      }
    } catch (e) {
      console.error("Failed to parse autosaved state from localStorage", e);
    }
    return defaultAppState;
};

const InlineRichTextToolbar = ({ position, onFormat }) => {
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!position) return;

        const checkSelectionFormats = () => {
            const newActiveFormats = new Set<string>();
            const commands = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];
            commands.forEach(cmd => {
                if (document.queryCommandState(cmd)) {
                    newActiveFormats.add(cmd);
                }
            });

            const selection = window.getSelection();
            if (selection?.anchorNode) {
                let node: Node | null = selection.anchorNode;
                // Traverse up the DOM tree from the anchor node
                while (node && node.nodeName !== 'BODY') {
                    if (node.nodeName === 'A') {
                        newActiveFormats.add('link');
                        break;
                    }
                    if ((node as HTMLElement).isContentEditable) {
                        // Stop if we reach the editor boundary and haven't found a link
                        break;
                    }
                    node = node.parentNode;
                }
            }
            
            setActiveFormats(newActiveFormats);
        };

        // Delay the initial check slightly to ensure selection is updated after click
        const timeoutId = setTimeout(checkSelectionFormats, 0);
        document.addEventListener('selectionchange', checkSelectionFormats);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('selectionchange', checkSelectionFormats);
        };
    }, [position]);


    if (!position) return null;

    const style: React.CSSProperties = {
        position: 'absolute',
        top: `${position.top - 45}px`, // Position it above the element
        left: `${position.left + position.width / 2}px`,
        transform: 'translateX(-50%)', // Center it horizontally
        zIndex: 1002,
    };

    const handleMouseDown = (e: React.MouseEvent, command: string) => {
        // Prevent the editor from losing focus
        e.preventDefault();
        onFormat(command);
    };
    
    return createPortal(
        <div className="inline-rich-text-toolbar" style={style}>
            <button className={activeFormats.has('bold') ? 'active' : ''} onMouseDown={(e) => handleMouseDown(e, 'bold')} title="Bold"><b>B</b></button>
            <button className={activeFormats.has('italic') ? 'active' : ''} onMouseDown={(e) => handleMouseDown(e, 'italic')} title="Italic"><i>I</i></button>
            <button className={activeFormats.has('underline') ? 'active' : ''} onMouseDown={(e) => handleMouseDown(e, 'underline')} title="Underline"><u>U</u></button>
            <div className="toolbar-separator"></div>
            <button className={activeFormats.has('link') ? 'active' : ''} onMouseDown={(e) => handleMouseDown(e, 'createLink')} title="Link">🔗</button>
            <button onMouseDown={(e) => handleMouseDown(e, 'unlink')} title="Unlink" disabled={!activeFormats.has('link')}>🚫</button>
            <div className="toolbar-separator"></div>
            <button className={activeFormats.has('insertUnorderedList') ? 'active' : ''} onMouseDown={(e) => handleMouseDown(e, 'insertUnorderedList')} title="Unordered List">●</button>
            <button className={activeFormats.has('insertOrderedList') ? 'active' : ''} onMouseDown={(e) => handleMouseDown(e, 'insertOrderedList')} title="Ordered List">1.</button>
        </div>,
        document.body
    );
};


const App = () => {
  const { state, setState, undo, redo, canUndo, canRedo } = useHistory<AppState>(getInitialState());
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
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [editingField, setEditingField] = useState<{
      componentId: string;
      field: string;
      rowIndex?: number;
      colIndex?: number;
      clickEvent?: { clientX: number, clientY: number };
      position?: { top: number, left: number, width: number, height: number };
  } | null>(null);

  
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

  // Autosave current state to localStorage with a debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        // Prevent saving the initial blank state on first load
        if (state.components.length > 0 || JSON.stringify(state.emailSettings) !== JSON.stringify(defaultAppState.emailSettings)) {
          localStorage.setItem('emailEditorAutosave', JSON.stringify(state));
        }
      } catch (error) {
        console.error("Failed to autosave state to localStorage:", error);
      }
    }, 500); // Debounce time in ms

    return () => {
      clearTimeout(handler);
    };
  }, [state]);

  // Prompt user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.components.length > 0) {
        event.preventDefault();
        event.returnValue = ''; // Required for legacy browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.components]);

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
        if (isPreviewing) return; // Disable shortcuts in preview mode
        
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
  }, [undo, redo, isPreviewing]);

  useEffect(() => {
      if (selectedId) {
        const selectedComponent = findComponent(selectedId, components);
        const isTextEditable = selectedComponent && ['text', 'footer', 'card', 'table'].includes(selectedComponent.type);
        if (!isTextEditable) {
           setEditingField(null);
        }
      } else {
        setEditingField(null);
      }
  }, [selectedId, components]);


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
      const newComponent: EmailComponent = JSON.parse(JSON.stringify(component));
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

  const handleOverwriteTemplate = (id: string) => {
    const currentAppState = {
      components: JSON.parse(JSON.stringify(components)),
      emailSettings: JSON.parse(JSON.stringify(emailSettings)),
    };
    setTemplates(prev => prev.map(t => (t.id === id ? { ...t, state: currentAppState } : t)));
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

  const handleFormat = (command: string) => {
    if (command === 'createLink') {
        const url = prompt('Enter the link URL:', 'https://');
        if (url) {
            document.execCommand(command, false, url);
        }
    } else {
        document.execCommand(command, false);
    }
  };


  const selectedComponent = findComponent(selectedId, components);
  
  const getContainerStyleString = (component: EmailComponent): string => {
    if (!component.containerStyle) return '';

    const { backgroundColor, borderTop, borderRight, borderBottom, borderLeft, paddingTop, paddingRight, paddingBottom, paddingLeft } = component.containerStyle;
    let style = '';

    if (backgroundColor && backgroundColor !== 'transparent') {
        style += `background-color:${backgroundColor};`;
    }
    if (paddingTop && parseInt(paddingTop) >= 0) {
        style += `padding-top:${paddingTop}px;`;
    }
    if (paddingRight && parseInt(paddingRight) >= 0) {
        style += `padding-right:${paddingRight}px;`;
    }
    if (paddingBottom && parseInt(paddingBottom) >= 0) {
        style += `padding-bottom:${paddingBottom}px;`;
    }
    if (paddingLeft && parseInt(paddingLeft) >= 0) {
        style += `padding-left:${paddingLeft}px;`;
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
        const textContent = `<div style="font-family:${finalFontFamily}, sans-serif; font-size:${component.fontSize}px; color:${finalTextColor}; text-align:${component.textAlign}; line-height: 1.5; word-break: break-word; overflow-wrap: break-word;">${component.content}</div>`;
        const textWrapper = `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="width:${component.width}%;">
                <tr><td>${textContent}</td></tr>
            </table>
        `;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="center" style="${containerStyles}">${textWrapper}</td></tr></table>`;
      }
      case 'image':
        const imgTag = `<img src="${component.src || getPlaceholderSrc(component)}" alt="${component.alt}" style="width:${component.width}%; max-width:100%; display:block; border:0; border-radius:${component.borderRadius}px;">`;
        const imageTdStyle = containerStyles;
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
        const logoTdStyle = containerStyles;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${logoTdStyle}"><img src="${placeholderSrc}" alt="${component.alt}" width="${component.width}" style="display:block; max-width: 100%;"></td></tr></table>`;
      case 'button':
        const finalButtonBgColor = component.useGlobalAccentColor ? emailSettings.accentColor : component.backgroundColor;
        const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const buttonContent = `<table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" bgcolor="${finalButtonBgColor}" style="padding:10px 20px; border-radius:5px;"><a href="${component.href}" target="_blank" style="color:${component.textColor}; text-decoration:none; font-weight:${component.fontWeight}; font-family: ${finalFontFamily}, sans-serif; font-size: ${component.fontSize}px; display: block;">${component.text}</a></td></tr></table>`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="center" style="${containerStyles}">${buttonContent}</td></tr></table>`;

      case 'calendar':
        const finalCalButtonBgColor = component.useGlobalAccentColor ? emailSettings.accentColor : component.backgroundColor;
        const finalCalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const icsContent = generateIcsContent(component);
        const dataUri = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;
        const calButtonContent = `<table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" bgcolor="${finalCalButtonBgColor}" style="padding:10px 20px; border-radius:5px;"><a href="${dataUri}" download="event.ics" target="_blank" style="color:${component.textColor}; text-decoration:none; font-weight:${component.fontWeight}; font-family: ${finalCalFontFamily}, sans-serif; font-size: ${component.fontSize}px;">${component.text}</a></td></tr></table>`;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="center" style="${containerStyles}">${calButtonContent}</td></tr></table>`;
      
      case 'button-group': {
        const finalGroupFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const buttonsHtml = component.buttons.map(btn => 
            `<td class="button-group-cell" align="center" style="padding: 5px;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td align="center" bgcolor="${btn.backgroundColor}" style="padding:10px 20px; border-radius:5px;">
                            <a href="${btn.href}" target="_blank" style="color:${btn.textColor}; text-decoration:none; font-family: ${finalGroupFontFamily}, sans-serif; font-weight: bold; display: block;">${btn.text}</a>
                        </td>
                    </tr>
                </table>
            </td>`
        ).join('');
        const buttonGroupTdStyle = containerStyles;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${buttonGroupTdStyle}"><table border="0" cellpadding="0" cellspacing="0" role="presentation" class="button-group-inner-table" style="margin: 0 auto;"><tr>${buttonsHtml}</tr></table></td></tr></table>`;
      }
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
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="center" style="${wrapperTdStyle}">${dividerItself}</td></tr></table>`;
      case 'social': {
        const socialTdStyle = containerStyles;
        let linksHtml = '';
        if (component.style === 'minimalist') {
            const finalAccentColor = emailSettings.accentColor;
            linksHtml = component.links.map(link => {
                const svg = `<svg width="32" height="32" viewBox="0 0 24 24" fill="${finalAccentColor}" xmlns="http://www.w3.org/2000/svg"><path d="${MINIMALIST_SOCIAL_ICONS[link.platform]}" /></svg>`;
                return `<td style="padding: 0 5px;"><a href="${link.url}" target="_blank">${svg}</a></td>`
            }).join('');
        } else {
             linksHtml = component.links.map(link => 
                `<td style="padding: 0 5px;"><a href="${link.url}" target="_blank"><img src="${SOCIAL_ICONS[link.platform]}" alt="${link.platform}" width="32" height="32" style="display: block;"></a></td>`
            ).join('');
        }
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${socialTdStyle}"><table border="0" cellpadding="0" cellspacing="0" role="presentation"><tr>${linksHtml}</tr></table></td></tr></table>`;
      }
      case 'video':
        const videoTdStyle = containerStyles;
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${videoTdStyle}"><a href="${component.videoUrl}" target="_blank" style="display:inline-block; width:${component.width}%;"><img src="${component.imageUrl || getPlaceholderSrc(component)}" alt="${component.alt}" width="100%" style="max-width:100%; display:block;"></a></td></tr></table>`;
      case 'card': {
        const finalCardButtonBgColor = component.useGlobalButtonAccentColor ? emailSettings.accentColor : component.buttonBackgroundColor;
        const finalCardFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const finalCardTextColor = component.textColor;
        const finalButtonFontFamily = component.useGlobalButtonFont ? emailSettings.fontFamily : component.buttonFontFamily;

        // Common parts
        const titleHtml = `<h4 style="margin:0; font-size: 18px; line-height: 1.3; min-height: 2.6em; color: ${finalCardTextColor}; font-family: ${finalCardFontFamily}, sans-serif; word-break: break-word; overflow-wrap: break-word;">${component.title}</h4>`;
        const contentHtml = `<p style="margin:0; font-size: 14px; color: ${finalCardTextColor}; font-family: ${finalCardFontFamily}, sans-serif; word-break: break-word; overflow-wrap: break-word;">${component.content}</p>`;
        const buttonHtml = component.showButton ? `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 15px;">
                <tr>
                    <td align="center" bgcolor="${finalCardButtonBgColor}" style="padding:10px 20px; border-radius:5px;">
                        <a href="${component.buttonHref}" target="_blank" style="color:${component.buttonTextColor}; text-decoration:none; font-weight:${component.buttonFontWeight}; font-size: 16px; font-family: ${finalButtonFontFamily}, sans-serif;">${component.buttonText}</a>
                    </td>
                </tr>
            </table>
        ` : '';
        const imageHtml = component.showImage ? 
            `<img src="${component.src || getPlaceholderSrc(component, 600, 400)}" alt="${component.alt}" style="max-width:100%; display:block; width: 100%; height: auto; border-radius: 4px;" width="100%">` 
            : '';

        let cardContentTable: string;

        if (component.layout === 'image-top') {
            cardContentTable = `
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" height="100%" style="background-color:${component.backgroundColor}; border-radius: 5px;">
                    ${component.showImage ? `<tr><td align="center" style="padding: 15px 15px 0;">${imageHtml}</td></tr>` : ''}
                    <tr><td style="padding: 15px 15px 5px;">${titleHtml}</td></tr>
                    <tr><td style="padding: 0 15px 15px;">${contentHtml}</td></tr>
                    <tr height="100%"><td height="100%">&nbsp;</td></tr>
                    ${component.showButton ? `<tr><td align="center" style="padding: 0 15px 15px;">${buttonHtml}</td></tr>` : ''}
                </table>
            `;
        } else { // Horizontal layouts
            const imageColumn = component.showImage ? 
                `<td valign="middle" width="40%" style="padding-right: 15px;">${imageHtml}</td>` 
                : '';

            const contentColumn = `
                <td valign="middle" width="${component.showImage ? '60%' : '100%'}">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                        <tr><td style="padding-bottom: 5px;">${titleHtml}</td></tr>
                        <tr><td style="padding-bottom: 15px;">${contentHtml}</td></tr>
                        ${component.showButton ? `<tr><td align="center">${buttonHtml}</td></tr>` : ''}
                    </table>
                </td>`;
            
            const columns = component.layout === 'image-left' ? [imageColumn, contentColumn] : [contentColumn, imageColumn];
            
            cardContentTable = `
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="background-color:${component.backgroundColor}; border-radius: 5px; padding: 15px;">
                    <tr>
                       ${columns.join('')}
                    </tr>
                </table>`;
        }
        
        const cardWrapper = `
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" height="100%" style="width:${component.width}%;">
              <tr>
                <td valign="top" height="100%" style="${containerStyles}">
                    ${cardContentTable}
                </td>
              </tr>
            </table>
        `;
        
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" height="100%"><tr><td align="center" valign="top" height="100%">${cardWrapper}</td></tr></table>`;
      }
      case 'emoji':
          const emojiTdStyle = `font-size: ${component.fontSize}px; line-height: 1; text-align: ${component.alignment}; ${containerStyles}`;
          return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="${component.alignment}" style="${emojiTdStyle}"><span style="font-size: ${component.fontSize}px; line-height: 1;">${component.character}</span></td></tr></table>`;
      case 'table': {
        const finalFontFamily = component.useGlobalFont ? emailSettings.fontFamily : component.fontFamily;
        const finalTextColor = component.useGlobalTextColor ? emailSettings.textColor : component.textColor;
        const borderColor = '#cccccc'; // Hardcode a reasonable border color for email clients
        const finalHeaderTextColor = component.useAutoHeaderTextColor
            ? getContrastingTextColor(component.headerFillColor)
            : component.headerTextColor;
        
        const tableStyles = `width:${component.width}%; border-collapse:collapse; background-color:${component.tableBackgroundColor === 'transparent' ? '' : component.tableBackgroundColor};`;
        const cellStyles = `border:${component.cellBorderWidth}px solid ${borderColor}; padding: 8px; font-family:${finalFontFamily}, sans-serif; color:${finalTextColor}; word-break: break-word; overflow-wrap: break-word; text-align:${component.textAlign}; vertical-align:${component.verticalAlign}; font-size:${component.fontSize}px;`;
        const headerCellStyles = `${cellStyles} background-color:${component.headerFillColor}; font-weight:bold; color:${finalHeaderTextColor};`;
        
        const headerRowData = component.hasHeader ? component.data[0] : null;
        const bodyRowsData = component.hasHeader ? component.data.slice(1) : component.data;

        const header = component.hasHeader && headerRowData ? `
            <thead>
                <tr>
                    ${headerRowData.map(cell => `<th align="${component.textAlign}" valign="${component.verticalAlign}" style="${headerCellStyles}">${cell}</th>`).join('')}
                </tr>
            </thead>
        ` : '';

        const bodyRows = bodyRowsData.map(row => `
            <tr>
                ${row.map(cell => `<td align="${component.textAlign}" valign="${component.verticalAlign}" style="${cellStyles}">${cell}</td>`).join('')}
            </tr>
        `).join('');

        const body = `<tbody>${bodyRows}</tbody>`;

        const tableHtml = `
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="${tableStyles}">
                ${header}
                ${body}
            </table>
        `;
        
        return `<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="center" style="${containerStyles}">${tableHtml}</td></tr></table>`;
      }
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
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Your Email</title>
<!--[if mso]>
<style>
  table {border-collapse:collapse;border-spacing:0;border:none;margin:0;}
  div, td {padding:0;}
  div {margin:0 !important;}
</style>
<noscript>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
</noscript>
<![endif]-->
<style>
body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; word-spacing: normal; }
table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }

@media screen and (max-width: 600px) {
    .email-container {
        width: 100% !important;
        max-width: 100% !important;
    }
    .column-wrapper {
        display: block !important;
        width: 100% !important;
        padding: 10px 0 !important;
        box-sizing: border-box !important;
    }
    .button-group-inner-table {
        width: 100% !important;
    }
    .button-group-inner-table tr,
    .button-group-cell {
        display: block !important;
        width: 100% !important;
    }
    .button-group-cell {
        padding: 5px 0 !important;
    }
}
</style>
</head>
<body style="margin:0; padding:0; background-color:${emailSettings.backgroundColor};">
  <div role="article" aria-roledescription="email" lang="en" style="background-color:${emailSettings.backgroundColor};">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 0;">
          <!--[if (gte mso 9)|(IE)]>
          <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
          <tr>
          <td>
          <![endif]-->
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="background-color:${emailSettings.contentBackgroundColor}; max-width: 600px;">
            <tr>
              <td>
                ${body}
              </td>
            </tr>
          </table>
          <!--[if (gte mso 9)|(IE)]>
          </td>
          </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </div>
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
          <button className="header-button" onClick={() => setIsPreviewing(true)}>Preview</button>
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
          editingField={editingField}
          setEditingField={setEditingField}
        />
        <PropertiesPanel
          component={selectedComponent}
          onUpdate={handleUpdateComponent}
          emailSettings={emailSettings}
          onUpdateSettings={handleUpdateEmailSettings}
        />
      </main>
      <InlineRichTextToolbar position={editingField?.position} onFormat={handleFormat} />
      {isPreviewing && <PreviewMode html={generateEmailHtml()} onExit={() => setIsPreviewing(false)} />}
      {showExportModal && <ExportModal html={generateEmailHtml()} onClose={() => setShowExportModal(false)} />}
      {showTemplatesModal && 
        <TemplatesModal 
            templates={templates}
            onClose={() => setShowTemplatesModal(false)}
            onSave={handleSaveTemplate}
            onLoadState={handleLoadState}
            onDelete={handleDeleteTemplate}
            onRename={handleRenameTemplate}
            onOverwrite={handleOverwriteTemplate}
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