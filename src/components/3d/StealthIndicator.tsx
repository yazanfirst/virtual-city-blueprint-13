import { useMemo } from 'react';
import { usePlayerStore } from '@/stores/playerStore';

interface StealthIndicatorProps {
  detectionLevel: number;
}

export default function StealthIndicator({ detectionLevel }: StealthIndicatorProps) {
  const position = usePlayerStore((state) => state.position);
  const fill = useMemo(() => Math.min(1, Math.max(0, detectionLevel / 100)), [detectionLevel]);

  return (
    <group position={[position[0], position[1] + 2.2, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.45, 32, 1, 0, Math.PI * 2]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.45, 32, 1, 0, Math.PI * 2 * fill]} />
        <meshBasicMaterial color={fill > 0.7 ? '#ef4444' : '#f97316'} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}
