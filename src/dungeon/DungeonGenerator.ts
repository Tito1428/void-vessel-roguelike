import * as THREE from 'three';
import { RoomType, Direction, DIRECTION_OFFSETS, OPPOSITE_DIRECTION } from '../core/Types.ts';
import { Room } from './Room.ts';

export interface DungeonFloor {
  rooms: Map<string, Room>;
  startRoom: Room;
  bossRoom: Room;
  treasureRoom: Room;
}

export class DungeonGenerator {
  public static generate(scene: THREE.Scene, targetRoomCount = 10): DungeonFloor {
    const roomsMap: Map<string, Room> = new Map();
    const gridPositions: { x: number; y: number }[] = [];

    // Step 1: Start Room at (0,0)
    gridPositions.push({ x: 0, y: 0 });

    // Step 2: Random Walker to generate connected rooms
    const directions = [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST];

    while (gridPositions.length < targetRoomCount) {
      // Pick random existing room to branch from
      const basePos = gridPositions[Math.floor(Math.random() * gridPositions.length)];
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const offset = DIRECTION_OFFSETS[dir];
      const newPos = { x: basePos.x + offset.x, y: basePos.y + offset.y };

      const key = `${newPos.x},${newPos.y}`;
      if (!gridPositions.some((p) => p.x === newPos.x && p.y === newPos.y)) {
        // Check neighbor count (avoid tight 2x2 blobs, keep branching like Isaac)
        let neighborCount = 0;
        for (const d of directions) {
          const checkOffset = DIRECTION_OFFSETS[d];
          const checkKey = `${newPos.x + checkOffset.x},${newPos.y + checkOffset.y}`;
          if (gridPositions.some((p) => p.x === newPos.x + checkOffset.x && p.y === newPos.y + checkOffset.y)) {
            neighborCount++;
          }
        }

        if (neighborCount <= 2) {
          gridPositions.push(newPos);
        }
      }
    }

    // Step 3: Classify Rooms (Spawn, Boss, Treasure, Combat)
    // Find distances from spawn (0,0)
    const deadEnds: { x: number; y: number; dist: number }[] = [];

    gridPositions.forEach((pos) => {
      if (pos.x === 0 && pos.y === 0) return;

      let neighbors = 0;
      directions.forEach((d) => {
        const off = DIRECTION_OFFSETS[d];
        if (gridPositions.some((p) => p.x === pos.x + off.x && p.y === pos.y + off.y)) {
          neighbors++;
        }
      });

      if (neighbors === 1) {
        const dist = Math.abs(pos.x) + Math.abs(pos.y);
        deadEnds.push({ ...pos, dist });
      }
    });

    // Sort dead-ends by distance descending
    deadEnds.sort((a, b) => b.dist - a.dist);

    // Furthest dead-end is Boss Room
    const bossCoord = deadEnds.length > 0 ? deadEnds[0] : gridPositions[gridPositions.length - 1];

    // Second furthest dead-end is Treasure Room
    const treasureCoord = deadEnds.length > 1 ? deadEnds[1] : gridPositions[gridPositions.length - 2];

    // Instantiate Rooms
    let startRoom!: Room;
    let bossRoom!: Room;
    let treasureRoom!: Room;

    gridPositions.forEach((pos) => {
      const key = `${pos.x},${pos.y}`;
      let type = RoomType.COMBAT;

      if (pos.x === 0 && pos.y === 0) {
        type = RoomType.SPAWN;
      } else if (pos.x === bossCoord.x && pos.y === bossCoord.y) {
        type = RoomType.BOSS;
      } else if (pos.x === treasureCoord.x && pos.y === treasureCoord.y) {
        type = RoomType.TREASURE;
      }

      const room = new Room(scene, pos.x, pos.y, type);
      roomsMap.set(key, room);

      if (type === RoomType.SPAWN) startRoom = room;
      if (type === RoomType.BOSS) bossRoom = room;
      if (type === RoomType.TREASURE) treasureRoom = room;
    });

    // Step 4: Connect Doors between adjacent rooms
    roomsMap.forEach((room, key) => {
      directions.forEach((dir) => {
        const off = DIRECTION_OFFSETS[dir];
        const neighborKey = `${room.gridX + off.x},${room.gridY + off.y}`;
        if (roomsMap.has(neighborKey)) {
          room.addDoor(dir);
        }
      });
    });

    // Mark spawn room as visited & discovered
    startRoom.isVisited = true;
    startRoom.isDiscovered = true;

    // Discover neighbors of spawn room
    directions.forEach((dir) => {
      const off = DIRECTION_OFFSETS[dir];
      const neighbor = roomsMap.get(`${startRoom.gridX + off.x},${startRoom.gridY + off.y}`);
      if (neighbor) {
        neighbor.isDiscovered = true;
      }
    });

    return {
      rooms: roomsMap,
      startRoom,
      bossRoom,
      treasureRoom
    };
  }
}
