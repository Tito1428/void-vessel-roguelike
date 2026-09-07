import { Room } from './Room.ts';
import { RoomType, Direction, DIRECTION_OFFSETS } from '../core/Types.ts';

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 22;
  private gap: number = 4;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 160;
    this.canvas.height = 130;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '16px';
    this.canvas.style.right = '16px';
    this.canvas.style.background = 'rgba(10, 10, 18, 0.75)';
    this.canvas.style.border = '2px solid rgba(80, 70, 100, 0.8)';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.6)';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '50';

    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  public render(rooms: Map<string, Room>, currentRoom: Room) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    rooms.forEach((room) => {
      if (!room.isDiscovered && !room.isVisited) return;

      // Position relative to current room (so current room is always centered)
      const relX = room.gridX - currentRoom.gridX;
      const relY = room.gridY - currentRoom.gridY;

      const px = centerX + relX * (this.cellSize + this.gap) - this.cellSize / 2;
      const py = centerY + relY * (this.cellSize + this.gap) - this.cellSize / 2;

      // Draw door connections
      room.doors.forEach((door, dir) => {
        if (!door.isConnected) return;
        const off = DIRECTION_OFFSETS[dir];
        const neighborKey = `${room.gridX + off.x},${room.gridY + off.y}`;
        const neighbor = rooms.get(neighborKey);
        if (neighbor && (neighbor.isVisited || neighbor.isDiscovered)) {
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + this.cellSize / 2, py + this.cellSize / 2);
          ctx.lineTo(
            px + this.cellSize / 2 + off.x * (this.cellSize + this.gap),
            py + this.cellSize / 2 + off.y * (this.cellSize + this.gap)
          );
          ctx.stroke();
        }
      });

      // Room box
      if (room.isVisited) {
        ctx.fillStyle = room === currentRoom ? '#2563eb' : '#1f2937';
      } else {
        ctx.fillStyle = '#111827';
      }

      ctx.fillRect(px, py, this.cellSize, this.cellSize);

      // Border
      if (room === currentRoom) {
        // Pulsing active room outline
        const pulse = Math.sin(performance.now() * 0.008) * 0.4 + 0.6;
        ctx.strokeStyle = `rgba(56, 189, 248, ${pulse})`;
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = room.isVisited ? '#4b5563' : '#374151';
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(px, py, this.cellSize, this.cellSize);

      // Room Type Icons
      if (room.type === RoomType.BOSS && (room.isVisited || room.isDiscovered)) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', px + this.cellSize / 2, py + this.cellSize / 2);
      } else if (room.type === RoomType.TREASURE && (room.isVisited || room.isDiscovered)) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', px + this.cellSize / 2, py + this.cellSize / 2);
      }
    });
  }
}
