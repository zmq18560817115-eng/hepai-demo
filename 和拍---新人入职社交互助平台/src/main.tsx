import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import DesignShowcasePage from './showcase/DesignShowcasePage.tsx';
import './index.css';

/** 仅 ?showcase=1 时打开设计导航；默认进入和拍原型 */
function shouldShowDesignShowcase(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('showcase') === '1') return true;
  return window.location.pathname.includes('showcase.html');
}

const Root = shouldShowDesignShowcase() ? DesignShowcasePage : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
