import './style.css';
import { Engine } from './core/Engine.ts';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (!container) return;

  const engine = new Engine(container);
  engine.run();
});
