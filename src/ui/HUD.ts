import { PlayerStats, RelicDef } from '../core/Types.ts';

export class HUD {
  private container: HTMLElement;
  private heartsContainer: HTMLElement;
  private statsContainer: HTMLElement;
  private bossBarContainer: HTMLElement;
  private bossFill: HTMLElement;
  private bossTitle: HTMLElement;
  private itemBanner: HTMLElement;
  private titleOverlay: HTMLElement;
  private gameOverOverlay: HTMLElement;
  private victoryOverlay: HTMLElement;

  private onStartCallback?: () => void;
  private onRestartCallback?: () => void;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.pointerEvents = 'none';
    this.container.style.fontFamily = "'Cinzel', 'Trajan Pro', 'Georgia', serif, monospace";
    this.container.style.userSelect = 'none';
    this.container.style.zIndex = '100';
    document.body.appendChild(this.container);

    // Hearts at Top-Left
    this.heartsContainer = document.createElement('div');
    this.heartsContainer.style.position = 'absolute';
    this.heartsContainer.style.top = '16px';
    this.heartsContainer.style.left = '16px';
    this.heartsContainer.style.display = 'flex';
    this.heartsContainer.style.flexWrap = 'wrap';
    this.heartsContainer.style.gap = '6px';
    this.heartsContainer.style.maxWidth = '260px';
    this.container.appendChild(this.heartsContainer);

    // Stats Counters (Coins, Bombs, Keys)
    this.statsContainer = document.createElement('div');
    this.statsContainer.style.position = 'absolute';
    this.statsContainer.style.top = '60px';
    this.statsContainer.style.left = '16px';
    this.statsContainer.style.display = 'flex';
    this.statsContainer.style.flexDirection = 'column';
    this.statsContainer.style.gap = '4px';
    this.statsContainer.style.color = '#e2e8f0';
    this.statsContainer.style.fontSize = '18px';
    this.statsContainer.style.fontWeight = 'bold';
    this.statsContainer.style.textShadow = '0 2px 4px #000, 0 0 8px rgba(0,0,0,0.8)';
    this.container.appendChild(this.statsContainer);

    // Boss Health Bar at Bottom
    this.bossBarContainer = document.createElement('div');
    this.bossBarContainer.style.position = 'absolute';
    this.bossBarContainer.style.bottom = '24px';
    this.bossBarContainer.style.left = '50%';
    this.bossBarContainer.style.transform = 'translateX(-50%)';
    this.bossBarContainer.style.width = '460px';
    this.bossBarContainer.style.maxWidth = '90vw';
    this.bossBarContainer.style.display = 'none';
    this.bossBarContainer.style.flexDirection = 'column';
    this.bossBarContainer.style.alignItems = 'center';
    this.bossBarContainer.style.gap = '6px';

    this.bossTitle = document.createElement('div');
    this.bossTitle.innerText = 'MALAKOR, THE WEEPING TITAN';
    this.bossTitle.style.color = '#f87171';
    this.bossTitle.style.fontSize = '16px';
    this.bossTitle.style.letterSpacing = '3px';
    this.bossTitle.style.fontWeight = 'bold';
    this.bossTitle.style.textShadow = '0 0 10px rgba(239, 68, 68, 0.7)';

    const barBg = document.createElement('div');
    barBg.style.width = '100%';
    barBg.style.height = '18px';
    barBg.style.background = 'rgba(15, 10, 20, 0.85)';
    barBg.style.border = '2px solid #991b1b';
    barBg.style.borderRadius = '4px';
    barBg.style.overflow = 'hidden';
    barBg.style.boxShadow = '0 0 15px rgba(220, 38, 38, 0.4)';

    this.bossFill = document.createElement('div');
    this.bossFill.style.width = '100%';
    this.bossFill.style.height = '100%';
    this.bossFill.style.background = 'linear-gradient(90deg, #b91c1c, #ef4444)';
    this.bossFill.style.transition = 'width 0.2s ease-out';
    barBg.appendChild(this.bossFill);

    this.bossBarContainer.appendChild(this.bossTitle);
    this.bossBarContainer.appendChild(barBg);
    this.container.appendChild(this.bossBarContainer);

    // Item Pickup Banner in Center
    this.itemBanner = document.createElement('div');
    this.itemBanner.style.position = 'absolute';
    this.itemBanner.style.top = '22%';
    this.itemBanner.style.left = '50%';
    this.itemBanner.style.transform = 'translate(-50%, -50%)';
    this.itemBanner.style.display = 'none';
    this.itemBanner.style.flexDirection = 'column';
    this.itemBanner.style.alignItems = 'center';
    this.itemBanner.style.background = 'radial-gradient(ellipse at center, rgba(15, 12, 25, 0.95), rgba(5, 5, 10, 0.85))';
    this.itemBanner.style.border = '2px solid #38bdf8';
    this.itemBanner.style.boxShadow = '0 0 30px rgba(56, 189, 248, 0.5)';
    this.itemBanner.style.padding = '16px 36px';
    this.itemBanner.style.borderRadius = '12px';
    this.itemBanner.style.textAlign = 'center';
    this.container.appendChild(this.itemBanner);

    // Title Screen Overlay
    this.titleOverlay = this.createTitleScreen();
    this.container.appendChild(this.titleOverlay);

    // Game Over Overlay
    this.gameOverOverlay = this.createGameOverScreen();
    this.container.appendChild(this.gameOverOverlay);

    // Victory Overlay
    this.victoryOverlay = this.createVictoryScreen();
    this.container.appendChild(this.victoryOverlay);
  }

  public setCallbacks(onStart: () => void, onRestart: () => void) {
    this.onStartCallback = onStart;
    this.onRestartCallback = onRestart;
  }

  public updateStats(stats: PlayerStats) {
    // Render Hearts
    this.heartsContainer.innerHTML = '';
    const maxContainers = Math.ceil(stats.maxHealth / 2);

    for (let i = 0; i < maxContainers; i++) {
      const heartVal = stats.health - i * 2;
      const heart = document.createElement('div');
      heart.style.width = '24px';
      heart.style.height = '24px';
      heart.style.display = 'flex';
      heart.style.alignItems = 'center';
      heart.style.justifyContent = 'center';
      heart.style.fontSize = '22px';
      heart.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))';

      if (heartVal >= 2) {
        heart.innerHTML = '❤️';
      } else if (heartVal === 1) {
        heart.innerHTML = '💔';
      } else {
        heart.innerHTML = '🖤';
        heart.style.opacity = '0.4';
      }
      this.heartsContainer.appendChild(heart);
    }

    // Render Coins, Keys, Bombs
    this.statsContainer.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="color:#fbbf24;">🪙</span> <span>${stats.coins}</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="color:#cbd5e1;">🔑</span> <span>${stats.keys}</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="color:#f97316;">💣</span> <span>${stats.bombs}</span>
      </div>
    `;
  }

  public showBossBar(health: number, maxHealth: number) {
    this.bossBarContainer.style.display = 'flex';
    const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    this.bossFill.style.width = `${pct}%`;
  }

  public hideBossBar() {
    this.bossBarContainer.style.display = 'none';
  }

  public showItemPickup(relic: RelicDef) {
    this.itemBanner.innerHTML = `
      <div style="font-size: 24px; font-weight: bold; color: #${relic.color.toString(16).padStart(6, '0')}; text-shadow: 0 0 10px currentColor;">
        ${relic.name.toUpperCase()}
      </div>
      <div style="font-size: 16px; color: #cbd5e1; font-style: italic; margin-top: 4px;">
        "${relic.tagline}"
      </div>
      <div style="font-size: 14px; color: #94a3b8; margin-top: 6px;">
        ${relic.description}
      </div>
    `;
    this.itemBanner.style.display = 'flex';

    setTimeout(() => {
      this.itemBanner.style.display = 'none';
    }, 2800);
  }

  private createTitleScreen(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = 'radial-gradient(circle at center, rgba(15, 12, 28, 0.95), rgba(5, 5, 12, 0.98))';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.pointerEvents = 'auto';
    overlay.style.zIndex = '200';

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 680px; padding: 24px;">
        <div style="position: relative; margin-bottom: 16px; border-radius: 12px; overflow: hidden; box-shadow: 0 0 35px rgba(168, 85, 247, 0.4); border: 2px solid rgba(168, 85, 247, 0.5);">
          <img src="assets/banner.jpg" style="width: 100%; max-height: 280px; object-fit: cover; display: block;" alt="Void Vessel Banner" />
        </div>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Despiertas como el <strong>Archimago del Vacío</strong> en las catacumbas del Santuario Hundido.
          Purifica cada sala canalizando tu poder arcano, lanza devastadores hechizos mágicos, recolecta reliquias legendarias y derrota al Titán Malakor.
        </p>
        <div style="background: rgba(30, 27, 45, 0.8); border: 1px solid #475569; border-radius: 8px; padding: 14px; margin-bottom: 24px; color: #94a3b8; font-size: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left;">
          <div>⌨️ <strong>WASD</strong>: Moverse</div>
          <div>🔮 <strong>Flechas / Ratón</strong>: Lanzar Hechizos Mágicos</div>
          <div>⚡ <strong>Espacio</strong>: Dash evasivo</div>
          <div>💣 <strong>Shift / Q</strong>: Bomba</div>
        </div>
        <button id="btn-start" style="background: linear-gradient(135deg, #7c3aed, #2563eb); color: white; border: none; padding: 14px 42px; font-size: 18px; font-weight: bold; border-radius: 8px; cursor: pointer; letter-spacing: 2px; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.6); transition: transform 0.15s, box-shadow 0.15s;">
          DESCENDER AL SANTUARIO
        </button>
      </div>
    `;

    const startBtn = overlay.querySelector('#btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        if (this.onStartCallback) this.onStartCallback();
      });
    }

    return overlay;
  }

  private createGameOverScreen(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(10, 5, 8, 0.94)';
    overlay.style.display = 'none';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.pointerEvents = 'auto';
    overlay.style.zIndex = '200';

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 24px;">
        <div style="font-size: 48px; font-weight: bold; color: #ef4444; letter-spacing: 4px; text-shadow: 0 0 20px rgba(239, 68, 68, 0.8);">
          HAS SIDO DESTRUIDO
        </div>
        <p style="color: #94a3b8; font-size: 16px; margin: 18px 0 28px 0;">
          Tu esencia se disuelve en las sombras de las catacumbas...
        </p>
        <button id="btn-restart-gameover" style="background: linear-gradient(135deg, #dc2626, #991b1b); color: white; border: none; padding: 12px 36px; font-size: 17px; font-weight: bold; border-radius: 8px; cursor: pointer; letter-spacing: 2px; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.6);">
          REINTENTAR EXPEDICIÓN
        </button>
      </div>
    `;

    const restartBtn = overlay.querySelector('#btn-restart-gameover');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        if (this.onRestartCallback) this.onRestartCallback();
      });
    }

    return overlay;
  }

  private createVictoryScreen(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(8, 12, 24, 0.94)';
    overlay.style.display = 'none';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.pointerEvents = 'auto';
    overlay.style.zIndex = '200';

    overlay.innerHTML = `
      <div style="text-align: center; max-width: 520px; padding: 24px;">
        <div style="font-size: 44px; font-weight: bold; color: #38bdf8; letter-spacing: 3px; text-shadow: 0 0 25px rgba(56, 189, 248, 0.8);">
          ¡SANTUARIO PURIFICADO!
        </div>
        <p style="color: #cbd5e1; font-size: 17px; line-height: 1.6; margin: 18px 0 28px 0;">
          El Titán Malakor ha caído. Has reclamado la esencia primordial y tu leyenda resonará en los confines del vacío.
        </p>
        <button id="btn-restart-victory" style="background: linear-gradient(135deg, #0284c7, #0d9488); color: white; border: none; padding: 14px 40px; font-size: 17px; font-weight: bold; border-radius: 8px; cursor: pointer; letter-spacing: 2px; box-shadow: 0 4px 20px rgba(2, 132, 199, 0.6);">
          NUEVA EXPEDICIÓN
        </button>
      </div>
    `;

    const victoryBtn = overlay.querySelector('#btn-restart-victory');
    if (victoryBtn) {
      victoryBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        if (this.onRestartCallback) this.onRestartCallback();
      });
    }

    return overlay;
  }

  public showGameOver() {
    this.gameOverOverlay.style.display = 'flex';
  }

  public showVictory() {
    this.victoryOverlay.style.display = 'flex';
  }

  public resetScreens() {
    this.gameOverOverlay.style.display = 'none';
    this.victoryOverlay.style.display = 'none';
  }
}
