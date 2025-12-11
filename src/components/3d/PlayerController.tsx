import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import LowPolyCharacter from './LowPolyCharacter';
import { usePlayerStore } from '@/stores/playerStore';

const PLAYER_RADIUS = 0.45;
const STEP_HEIGHT = 0.28;
const JUMP_VELOCITY = 0.35;
const GRAVITY = 0.026;
const BENCH_PLATFORM_HEIGHT = 0.65;

// Tree and lamp locations are shared with the scene layout
const TREE_COLLIDERS = [
  { x: 10, z: 45 }, { x: 10, z: 33 }, { x: 10, z: 21 },
  { x: 10, z: -21 }, { x: 10, z: -33 }, { x: 10, z: -45 },
  { x: -10, z: 45 }, { x: -10, z: 33 }, { x: -10, z: 21 },
  { x: -10, z: -21 }, { x: -10, z: -33 }, { x: -10, z: -45 },
  { x: 28, z: 15 }, { x: 40, z: 15 }, { x: 52, z: 15 },
  { x: -28, z: 15 }, { x: -40, z: 15 }, { x: -52, z: 15 },
  { x: 45, z: 40 }, { x: 48, z: 43 }, { x: 42, z: 38 },
  { x: -45, z: 40 }, { x: -48, z: 43 }, { x: -42, z: 38 },
  { x: -55, z: -45 }, { x: -58, z: -42 },
  { x: 58, z: 45 }, { x: 55, z: 48 },
];

const LAMP_COLLIDERS = [
  { x: -10, z: 38 }, { x: 10, z: 38 }, { x: -10, z: 24 }, { x: 10, z: 24 },
  { x: -10, z: -24 }, { x: 10, z: -24 }, { x: -10, z: -38 }, { x: 10, z: -38 },
  { x: -10, z: -50 }, { x: 10, z: -50 },
  { x: 30, z: 10 }, { x: 42, z: 10 }, { x: 54, z: 10 },
  { x: -30, z: 10 }, { x: -42, z: 10 }, { x: -54, z: 10 },
  { x: 30, z: -10 }, { x: 42, z: -10 }, { x: 54, z: -10 },
  { x: -30, z: -10 }, { x: -42, z: -10 }, { x: -54, z: -10 },
];

const BENCH_COLLIDERS = [
  { minX: 8, maxX: 10, minZ: 39, maxZ: 41 },
  { minX: -10, maxX: -8, minZ: 39, maxZ: 41 },
  { minX: 8, maxX: 10, minZ: -49, maxZ: -47 },
  { minX: -10, maxX: -8, minZ: -49, maxZ: -47 },
  { minX: 43, maxX: 47, minZ: 37, maxZ: 39 },
  { minX: -47, maxX: -43, minZ: 37, maxZ: 39 },
];

type CircularPlatform = {
  type: 'circle';
  x: number;
  z: number;
  radius: number;
  height: number;
  requiresJump?: boolean;
};

type BoxPlatform = {
  type: 'box';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  requiresJump?: boolean;
};

type PlatformSurface = CircularPlatform | BoxPlatform;

const PLATFORM_SURFACES: PlatformSurface[] = [
  // Fountain base - low platform players can jump onto
  { type: 'circle', x: 0, z: 0, radius: 4.6, height: 0.82, requiresJump: true },
  // Benches can be landed on but shouldn't auto-step when walking
  ...BENCH_COLLIDERS.map((bench) => ({
    type: 'box',
    ...bench,
    height: BENCH_PLATFORM_HEIGHT,
    requiresJump: true,
  } as PlatformSurface)),
];

const CYLINDER_COLLIDERS = [
  ...TREE_COLLIDERS.map(({ x, z }) => ({ x, z, radius: 1.2, height: 6 })),
  ...LAMP_COLLIDERS.map(({ x, z }) => ({ x, z, radius: 0.6, height: 5 })),
  // Fountain pillar blocks the center so players stand on the rim, not inside
  { x: 0, z: 0, radius: 1.2, height: 4.5 },
];

// Building collision boxes and props with rectangular footprints
const COLLISION_BOXES = [
  // Main Boulevard East shops (x=18)
  ...[-52, -40, -28, -16, 16, 28, 40].map(z => ({ minX: 14, maxX: 22, minZ: z - 4, maxZ: z + 4 })),
  // Main Boulevard West shops (x=-18)
  ...[-52, -40, -28, -16, 16, 28, 40].map(z => ({ minX: -22, maxX: -14, minZ: z - 4, maxZ: z + 4 })),
  // Cross Street North shops (z=18)
  ...[35, 47, 59, -35, -47, -59].map(x => ({ minX: x - 4, maxX: x + 4, minZ: 14, maxZ: 22 })),
  // Cross Street South shops (z=-18)
  ...[35, 47, 59, -35, -47, -59].map(x => ({ minX: x - 4, maxX: x + 4, minZ: -22, maxZ: -14 })),
  // Tall buildings
  { minX: 27, maxX: 37, minZ: 40, maxZ: 50 },
  { minX: 27, maxX: 37, minZ: 15, maxZ: 25 },
  { minX: 27, maxX: 37, minZ: -40, maxZ: -30 },
  { minX: 27, maxX: 37, minZ: -60, maxZ: -50 },
  { minX: -37, maxX: -27, minZ: 40, maxZ: 50 },
  { minX: -37, maxX: -27, minZ: 15, maxZ: 25 },
  { minX: -37, maxX: -27, minZ: -40, maxZ: -30 },
  { minX: -37, maxX: -27, minZ: -60, maxZ: -50 },
  // District gates
  { minX: 73, maxX: 83, minZ: -6, maxZ: 6 },
  { minX: -83, maxX: -73, minZ: -6, maxZ: 6 },
  // Lakes use simple rectangles to block the player from walking through geometry
  { minX: -64, maxX: -46, minZ: -52, maxZ: -44 },
  { minX: 50, maxX: 66, minZ: 44, maxZ: 52 },
];

type PlayerControllerProps = {
  isNight: boolean;
  speed?: number;
  joystickInput?: { x: number; y: number };
  viewMode?: "thirdPerson" | "firstPerson";
  cameraRotation?: { azimuth: number; polar: number };
};

const PlayerController = ({
  isNight,
  speed = 0.15,
  joystickInput = { x: 0, y: 0 },
  viewMode = "thirdPerson",
  cameraRotation = { azimuth: 0, polar: Math.PI / 4 },
}: PlayerControllerProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const verticalVelocityRef = useRef(0);
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const [characterRotation, setCharacterRotation] = useState(0);
  const [isJumping, setIsJumping] = useState(false);

  // Use store for position to persist across game mode changes
  const { position, setPosition, jumpCounter, incrementJump } = usePlayerStore();
  const positionRef = useRef(new THREE.Vector3(...position));
  const lastJumpCounterRef = useRef(jumpCounter);

  const { camera } = useThree();

  // Keep position in sync if store updates externally
  useEffect(() => {
    positionRef.current.set(...position);
  }, [position]);

  // Camera settings - PUBG style
  const cameraDistance = viewMode === "firstPerson" ? 0 : 10;
  const cameraHeight = viewMode === "firstPerson" ? 2.5 : 4;

  // Check collision with buildings and props
  const checkCollision = (
    x: number,
    z: number,
    y: number = positionRef.current.y,
    radius: number = PLAYER_RADIUS,
  ): boolean => {
    for (const box of COLLISION_BOXES) {
      if (
        x + radius > box.minX &&
        x - radius < box.maxX &&
        z + radius > box.minZ &&
        z - radius < box.maxZ
      ) {
        return true;
      }
    }

    for (const collider of CYLINDER_COLLIDERS) {
      const dx = x - collider.x;
      const dz = z - collider.z;
      const distanceSq = dx * dx + dz * dz;
      const combinedRadius = collider.radius + radius;

      if (distanceSq < combinedRadius * combinedRadius) {
        return true;
      }
    }

    for (const bench of BENCH_COLLIDERS) {
      if (
        x + radius > bench.minX &&
        x - radius < bench.maxX &&
        z + radius > bench.minZ &&
        z - radius < bench.maxZ
      ) {
        // Block if the player is at ground height; allow movement when already elevated on top
        if (y < BENCH_PLATFORM_HEIGHT - 0.05) {
          return true;
        }
      }
    }

    return false;
  };

  const getSurfaceHeight = useCallback((x: number, z: number): { height: number; requiresJump: boolean } => {
    let surface = { height: 0.25, requiresJump: false };

    for (const platform of PLATFORM_SURFACES) {
      if (platform.type === 'circle') {
        const dx = x - platform.x;
        const dz = z - platform.z;
        if (dx * dx + dz * dz <= platform.radius * platform.radius && platform.height > surface.height) {
          surface = { height: platform.height, requiresJump: Boolean(platform.requiresJump) };
        }
      } else if (
        platform.type === 'box' &&
        x >= platform.minX &&
        x <= platform.maxX &&
        z >= platform.minZ &&
        z <= platform.maxZ &&
        platform.height > surface.height
      ) {
        surface = { height: platform.height, requiresJump: Boolean(platform.requiresJump) };
      }
    }

    return surface;
  }, []);

  const attemptJump = useCallback(() => {
    const groundInfo = getSurfaceHeight(positionRef.current.x, positionRef.current.z);
    const onGround = positionRef.current.y <= groundInfo.height + 0.001 && verticalVelocityRef.current === 0;

    if (!isJumping && onGround) {
      verticalVelocityRef.current = JUMP_VELOCITY;
      setIsJumping(true);
    }
  }, [getSurfaceHeight, isJumping]);

  // Trigger jump when jump counter increments (keyboard or UI)
  useEffect(() => {
    if (jumpCounter > lastJumpCounterRef.current) {
      attemptJump();
    }
    lastJumpCounterRef.current = jumpCounter;
  }, [attemptJump, jumpCounter]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: true }));
          break;
        case 'Space':
          e.preventDefault();
          incrementJump();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [incrementJump]);

  const isWalking = keys.forward || keys.backward || keys.left || keys.right ||
    Math.abs(joystickInput.x) > 0.1 || Math.abs(joystickInput.y) > 0.1;

  // Movement and camera logic
  useFrame(() => {
    if (!groupRef.current) return;

    const direction = new THREE.Vector3();

    // PUBG-style camera-relative movement
    // Camera is BEHIND player looking AT player
    // So "forward" = direction FROM camera TO player = opposite of camera offset direction
    const cameraAzimuth = cameraRotation.azimuth;
    
    // Forward direction: where the player should move when joystick is pushed UP
    // This is the direction the camera is looking (from camera toward player)
    const forward = new THREE.Vector3(
      -Math.sin(cameraAzimuth),
      0,
      -Math.cos(cameraAzimuth)
    );
    
    // Right direction: perpendicular to forward, 90 degrees clockwise
    const right = new THREE.Vector3(
      Math.cos(cameraAzimuth),
      0,
      -Math.sin(cameraAzimuth)
    );

    // Keyboard movement (desktop)
    if (keys.forward) direction.add(forward);
    if (keys.backward) direction.sub(forward);
    if (keys.left) direction.sub(right);
    if (keys.right) direction.add(right);

    // Joystick movement (mobile) - PUBG style
    // Y positive (stick up) = move forward (toward where camera looks)
    // X positive (stick right) = move right relative to camera
    const joyX = joystickInput.x;
    const joyY = joystickInput.y;
    
    if (Math.abs(joyX) > 0.05 || Math.abs(joyY) > 0.05) {
      // Forward/backward based on Y
      direction.add(forward.clone().multiplyScalar(joyY));
      // Left/right based on X
      direction.add(right.clone().multiplyScalar(joyX));
    }

    let positionChanged = false;

    if (direction.length() > 0) {
      direction.normalize();

      // Calculate new position
      const newX = positionRef.current.x + direction.x * speed;
      const newZ = positionRef.current.z + direction.z * speed;

      // Check collision before moving
      if (!checkCollision(newX, newZ)) {
        positionRef.current.x = THREE.MathUtils.clamp(newX, -70, 70);
        positionRef.current.z = THREE.MathUtils.clamp(newZ, -60, 55);
        positionChanged = true;
      }

      // Update character rotation to face movement direction
      const targetRotation = Math.atan2(direction.x, direction.z);
      setCharacterRotation(targetRotation);
    }

    // Apply jump/gravity
    const groundInfo = getSurfaceHeight(positionRef.current.x, positionRef.current.z);
    const groundHeight = groundInfo.height;

    if (isJumping || positionRef.current.y > groundHeight) {
      verticalVelocityRef.current -= GRAVITY;
      positionRef.current.y = Math.max(groundHeight, positionRef.current.y + verticalVelocityRef.current);
      positionChanged = true;

      if (positionRef.current.y <= groundHeight && verticalVelocityRef.current <= 0) {
        positionRef.current.y = groundHeight;
        verticalVelocityRef.current = 0;
        setIsJumping(false);
      }
    } else if (positionRef.current.y < groundHeight) {
      // Step up onto low platforms smoothly without pulling the player onto benches/fountain unless jumped
      const heightDelta = groundHeight - positionRef.current.y;
      if (heightDelta <= STEP_HEIGHT && !groundInfo.requiresJump) {
        positionRef.current.y = groundHeight;
        verticalVelocityRef.current = 0;
        positionChanged = true;
      }
    }

    // Apply position to group
    groupRef.current.position.copy(positionRef.current);

    if (positionChanged) {
      setPosition([positionRef.current.x, positionRef.current.y, positionRef.current.z]);
    }

    // Update camera position based on view mode
    const playerPos = positionRef.current;

    if (viewMode === "firstPerson") {
      // First person - camera at eye level, slightly in front
      const eyeHeight = 2.5;
      camera.position.set(
        playerPos.x,
        playerPos.y + eyeHeight,
        playerPos.z
      );
      
      // Calculate look direction from polar and azimuth
      const verticalAngle = cameraRotation.polar - Math.PI / 2;
      const lookDistance = 20;
      const lookX = playerPos.x - Math.sin(cameraRotation.azimuth) * lookDistance * Math.cos(verticalAngle);
      const lookY = playerPos.y + eyeHeight + Math.sin(verticalAngle) * lookDistance;
      const lookZ = playerPos.z - Math.cos(cameraRotation.azimuth) * lookDistance * Math.cos(verticalAngle);
      camera.lookAt(lookX, lookY, lookZ);
    } else {
      // Third person - PUBG/GTA style camera behind player
      const verticalAngle = cameraRotation.polar;
      const horizontalDist = cameraDistance * Math.cos(verticalAngle * 0.5);
      const verticalDist = cameraHeight + cameraDistance * Math.sin(verticalAngle);
      
      const offsetX = Math.sin(cameraRotation.azimuth) * horizontalDist;
      const offsetZ = Math.cos(cameraRotation.azimuth) * horizontalDist;

      camera.position.set(
        playerPos.x + offsetX,
        playerPos.y + verticalDist,
        playerPos.z + offsetZ
      );
      // Look at player upper body, not feet
      camera.lookAt(playerPos.x, playerPos.y + 1.8, playerPos.z);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {viewMode !== "firstPerson" && (
        <LowPolyCharacter
          position={[0, 0, 0]}
          rotation={characterRotation}
          clothingColor="#4a5568"
          isNight={isNight}
          isWalking={isWalking}
        />
      )}
    </group>
  );
};

export default PlayerController;
