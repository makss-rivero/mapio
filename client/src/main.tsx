import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'ol/ol.css';
import App from './App';
import './styles.scss';

const root = document.getElementById('root');

if (!root) {
    throw new Error('Mapio root element is missing');
}

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
