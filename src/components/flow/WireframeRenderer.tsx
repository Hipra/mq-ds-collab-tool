'use client';

import type { ComponentNode, PropEntry } from '@/lib/ast-inspector';

// ---- Colour palette ----
const C = {
  textH: '#9e9e9e',
  textBody: '#c0c0c0',
  textCaption: '#d4d4d4',
  box: '#ebebeb',
  boxBorder: '#ddd',
  card: '#f9f9f9',
  cardBorder: '#e0e0e0',
  btn: '#c5cae9',
  btnBg: '#e8eaf6',
  chip: '#e4e4e4',
  avatar: '#c0c0c0',
  divider: '#e4e4e4',
  progress: '#c5cae9',
  progressBg: '#eeeeee',
  alert: { info: '#b3e5fc', success: '#c8e6c9', warning: '#ffe0b2', error: '#ffcdd2' },
  toggle: '#c5cae9',
  input: '#f5f5f5',
  inputBorder: '#e0e0e0',
};

// ---- Helpers ----

function getProp(props: PropEntry[], name: string): string | undefined {
  return props.find((p) => p.name === name)?.value?.replace(/^"|"$/g, '');
}

function getStackDirection(props: PropEntry[]): 'row' | 'column' {
  return getProp(props, 'direction') === 'row' ? 'row' : 'column';
}

// ---- Component sets ----

const LAYOUT_SET = new Set([
  'Box', 'Stack', 'Container', 'Grid', 'Grid2',
  'Card', 'CardContent', 'CardActions', 'CardHeader',
  'Paper', 'TableContainer', 'Table', 'TableHead', 'TableBody', 'TableRow',
  'List', 'ListItem', 'ListItemButton',
  'Accordion', 'AccordionDetails',
  'FormControl', 'RadioGroup', 'FormGroup',
  'DialogContent', 'DialogTitle', 'DialogActions',
]);

const SKIP_SET = new Set([
  'Tooltip', 'Portal', 'Popper', 'Fragment',
  'DndContext', 'SortableContext',
  'ThemeProvider', 'CacheProvider',
  'ErrorBoundary', 'Suspense',
]);

const MAX_DEPTH = 5;

// ---- Leaf renderers ----

function TypographyWire({ props }: { props: PropEntry[] }) {
  const variant = getProp(props, 'variant') ?? 'body1';
  const heightMap: Record<string, number> = {
    h1: 18, h2: 16, h3: 14, h4: 12, h5: 11, h6: 10,
    subtitle1: 9, subtitle2: 8, body1: 7, body2: 6, caption: 5, overline: 4,
  };
  const widthMap: Record<string, string> = {
    h1: '55%', h2: '60%', h3: '65%', h4: '70%', h5: '75%', h6: '80%',
    subtitle1: '85%', subtitle2: '80%', body1: '95%', body2: '90%', caption: '60%', overline: '50%',
  };
  const isHeader = /^h[1-6]|subtitle/.test(variant);
  return (
    <div style={{
      height: heightMap[variant] ?? 7,
      width: widthMap[variant] ?? '90%',
      borderRadius: 2,
      backgroundColor: isHeader ? C.textH : C.textBody,
      flexShrink: 0,
      marginBottom: 2,
    }} />
  );
}

function ButtonWire({ props }: { props: PropEntry[] }) {
  const variant = getProp(props, 'variant') ?? 'text';
  const size = getProp(props, 'size') ?? 'medium';
  const h = size === 'small' ? 18 : 24;
  const w = size === 'small' ? 44 : 60;
  return (
    <div style={{
      height: h, width: w, borderRadius: 4, flexShrink: 0,
      backgroundColor: variant === 'contained' ? C.btn : 'transparent',
      border: variant === 'outlined' ? `1.5px solid ${C.btn}` : variant === 'contained' ? 'none' : 'none',
    }} />
  );
}

function AlertWire({ props }: { props: PropEntry[] }) {
  const severity = (getProp(props, 'severity') ?? 'info') as keyof typeof C.alert;
  return (
    <div style={{
      height: 24, width: '100%', borderRadius: 4, flexShrink: 0,
      backgroundColor: C.alert[severity] ?? C.alert.info,
      display: 'flex', alignItems: 'center', paddingLeft: 6, gap: 4,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.2)' }} />
      <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)' }} />
    </div>
  );
}

function LinearProgressWire() {
  return (
    <div style={{ height: 6, width: '100%', borderRadius: 3, backgroundColor: C.progressBg, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ width: '65%', height: '100%', backgroundColor: C.progress, borderRadius: 3 }} />
    </div>
  );
}

function SliderWire() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: 16, flexShrink: 0, paddingLeft: 2, paddingRight: 2 }}>
      <div style={{ flex: 1, height: 2, backgroundColor: C.progressBg, borderRadius: 1, position: 'relative' }}>
        <div style={{ width: '60%', height: '100%', backgroundColor: C.progress, borderRadius: 1 }} />
        <div style={{ position: 'absolute', left: '60%', top: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', backgroundColor: C.btn }} />
      </div>
    </div>
  );
}

function FormControlLabelWire({ node }: { node: ComponentNode }) {
  const control = node.children.find((c) => ['Checkbox', 'Switch', 'Radio'].includes(c.componentName));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 16, flexShrink: 0 }}>
      {control?.componentName === 'Switch'
        ? <div style={{ width: 26, height: 14, borderRadius: 7, backgroundColor: C.toggle, flexShrink: 0 }} />
        : control?.componentName === 'Radio'
        ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${C.toggle}`, flexShrink: 0 }} />
        : <div style={{ width: 12, height: 12, borderRadius: 2, border: `1.5px solid ${C.toggle}`, flexShrink: 0 }} />
      }
      <div style={{ flex: 1, height: 5, borderRadius: 2, backgroundColor: C.textBody }} />
    </div>
  );
}

function ListItemTextWire() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <div style={{ height: 7, width: '70%', borderRadius: 2, backgroundColor: C.textH }} />
      <div style={{ height: 5, width: '90%', borderRadius: 2, backgroundColor: C.textCaption }} />
    </div>
  );
}

const SIMPLE_LEAVES: Record<string, React.CSSProperties> = {
  IconButton: { width: 20, height: 20, borderRadius: '50%', backgroundColor: C.box },
  Chip:       { width: 36, height: 14, borderRadius: 7, backgroundColor: C.chip, border: `1px solid ${C.cardBorder}` },
  Avatar:     { width: 20, height: 20, borderRadius: '50%', backgroundColor: C.avatar },
  Divider:    { height: 1, width: '100%', backgroundColor: C.divider, margin: '2px 0' },
  TextField:  { height: 26, width: '100%', borderRadius: 4, backgroundColor: C.input, border: `1px solid ${C.inputBorder}` },
  Select:     { height: 26, width: '100%', borderRadius: 4, backgroundColor: C.input, border: `1px solid ${C.inputBorder}` },
  Checkbox:   { width: 12, height: 12, borderRadius: 2, border: `1.5px solid ${C.toggle}` },
  Radio:      { width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${C.toggle}` },
  Switch:     { width: 26, height: 14, borderRadius: 7, backgroundColor: C.toggle },
  Badge:      { width: 20, height: 20, borderRadius: 2, backgroundColor: C.box },
  MqIcon:     { width: 14, height: 14, borderRadius: 2, backgroundColor: C.box },
  CircularProgress: { width: 22, height: 22, borderRadius: '50%', border: `2px solid ${C.progress}` },
  AccordionSummary: { height: 28, width: '100%', borderRadius: 3, backgroundColor: C.box },
};

// ---- Main recursive renderer ----

export function WireframeNode({ node, depth = 0 }: { node: ComponentNode; depth?: number }) {
  if (SKIP_SET.has(node.componentName)) return null;
  if (depth > MAX_DEPTH) return null;

  const { componentName, props, children } = node;

  // Special multi-child wrappers that need custom treatment
  if (componentName === 'FormControlLabel') return <FormControlLabelWire node={node} />;
  if (componentName === 'ListItemText') return <ListItemTextWire />;
  if (componentName === 'Typography') return <TypographyWire props={props} />;
  if (componentName === 'Button') return <ButtonWire props={props} />;
  if (componentName === 'Alert') return <AlertWire props={props} />;
  if (componentName === 'LinearProgress') return <LinearProgressWire />;
  if (componentName === 'Slider') return <SliderWire />;

  // Simple leaf shapes
  if (SIMPLE_LEAVES[componentName]) {
    return <div style={{ ...SIMPLE_LEAVES[componentName], flexShrink: 0 }} />;
  }

  // Table structure: render as rows
  if (componentName === 'Table' || componentName === 'TableContainer') {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 2, height: 12 }}>
            {[1, 2, 3].map((j) => (
              <div key={j} style={{ flex: 1, backgroundColor: i === 0 ? C.textH : (i % 2 === 0 ? C.box : C.card), borderRadius: 1 }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Layout containers: recurse into children
  if (LAYOUT_SET.has(componentName)) {
    const isStack = componentName === 'Stack';
    const direction = isStack ? getStackDirection(props) : 'column';
    const isCard = componentName === 'Card' || componentName === 'Paper';
    const isCardContent = componentName === 'CardContent';

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: direction === 'row' ? 'row' : 'column',
      gap: direction === 'row' ? 4 : 3,
      width: '100%',
      flexWrap: direction === 'row' ? 'wrap' : 'nowrap',
      flexShrink: 0,
      ...(isCard ? {
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 4,
        backgroundColor: C.card,
        padding: 4,
      } : {}),
      ...(isCardContent ? { padding: '2px 4px' } : {}),
    };

    const visibleChildren = children.filter((c) => !SKIP_SET.has(c.componentName));
    if (visibleChildren.length === 0) {
      // Empty container: render a faint placeholder
      return <div style={{ height: 14, width: '100%', borderRadius: 3, backgroundColor: C.box, flexShrink: 0, opacity: 0.5 }} />;
    }

    return (
      <div style={containerStyle}>
        {visibleChildren.map((child, i) => (
          <WireframeNode key={child.id ?? i} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  // Fallback: unknown component → generic gray box
  const hasChildren = children.filter((c) => !SKIP_SET.has(c.componentName)).length > 0;
  if (hasChildren) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', flexShrink: 0 }}>
        {children.filter((c) => !SKIP_SET.has(c.componentName)).map((child, i) => (
          <WireframeNode key={child.id ?? i} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return <div style={{ height: 10, width: '80%', borderRadius: 2, backgroundColor: C.box, flexShrink: 0 }} />;
}

export function WireframeTree({ tree }: { tree: ComponentNode[] }) {
  const visible = tree.filter((n) => !SKIP_SET.has(n.componentName));
  if (visible.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 11 }}>
        No components
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {visible.map((node, i) => (
        <WireframeNode key={node.id ?? i} node={node} depth={0} />
      ))}
    </div>
  );
}
