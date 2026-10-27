import { EXAMPLES } from '../examples';
import './styles/demo.css';
import * as s from './styles/demo.css';

const exampleId =
  new URLSearchParams(location.search).get('example') ?? 'checkout';
const example = EXAMPLES.find((item) => item.id === exampleId);
const navigation = document.getElementById('examples');
if (navigation) {
  const label = document.createElement('span');
  label.textContent = 'Examples';
  navigation.append(label);
  for (const item of EXAMPLES) {
    const link = document.createElement('a');
    link.href = `?example=${item.id}`;
    link.textContent = item.name;
    link.className = item.id === exampleId ? s.exampleActive : s.exampleLink;
    if (item.id === exampleId) link.setAttribute('aria-current', 'page');
    navigation.append(link);
  }
}

if (!example) {
  const root = document.getElementById('root');
  if (root)
    root.textContent = `Unknown example: ${exampleId}. Choose an example above.`;
} else {
  const sd = example.create();
  const header = document.createElement('h1');
  header.className = s.exampleHeading;
  header.textContent = example.name;
  const mount = await sd.render('root', {
    initialNodeId: example.selectedNode,
    header,
  });
  if (mount.status === 'error') {
    console.error(mount.message);
    const root = document.getElementById('root');
    if (root) root.textContent = mount.message;
  } else if (import.meta.hot) {
    import.meta.hot.dispose(() => mount.unmount());
  }
}
