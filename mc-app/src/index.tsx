/// <reference types="@commercetools-frontend/application-config/client" />
import { createRoot } from 'react-dom/client';
import EntryPoint from './components/entry-point';

const container = document.getElementById('app');
if (!container) {
  throw new Error(
    'Could not find the DOM element with id "app" to mount the application.'
  );
}

createRoot(container).render(<EntryPoint />);
