import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import LowPolyCharacter from './LowPolyCharacter';
import { usePlayerStore } from '@/stores/playerStore';

// Building collision boxes
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
  // Fountain/roundabout center
  { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
  // District gates
  { minX: 73, maxX: 83, minZ: -6, maxZ: 6 },
  { minX: -83, maxX: -73, minZ: -6, maxZ: 6 },
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

  const attemptJump = useCallback(() => {
    const groundHeight = 0.25;
    const onGround = positionRef.current.y <= groundHeight + 0.001;

    if (!isJumping && onGround) {
      verticalVelocityRef.current = 0.28;
      setIsJumping(true);
    }
  }, [isJumping]);

  // Trigger jump when jump counter increments (keyboard or UI)
  useEffect(() => {
    if (jumpCounter > lastJumpCounterRef.current) {
      attemptJump();
    }
    lastJumpCounterRef.current = jumpCounter;
  }, [attemptJump, jumpCounter]);

  // Camera settings - PUBG style
  const cameraDistance = viewMode === "firstPerson" ? 0 : 10;
  const cameraHeight = viewMode === "firstPerson" ? 2.5 : 4;

  // Check collision with buildings
  const checkCollision = (x: number, z: number, radius: number = 0.5): boolean => {
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
    return false;
  };

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
    const groundHeight = 0.25;
    if (isJumping || positionRef.current.y > groundHeight) {
      const gravity = 0.02;
      verticalVelocityRef.current -= gravity;
      positionRef.current.y = Math.max(groundHeight, positionRef.current.y + verticalVelocityRef.current);
      positionChanged = true;

      if (positionRef.current.y <= groundHeight && verticalVelocityRef.current <= 0) {
        positionRef.current.y = groundHeight;
        verticalVelocityRef.current = 0;
        setIsJumping(false);
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
