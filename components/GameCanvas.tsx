import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { Html, OrbitControls, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { MessageCircle } from 'lucide-react';
// @ts-ignore
import { joinRoom } from 'trystero';
import Scene, { Coin } from './World/Scene';
import Avatar from './Avatar';
import { UserState, NPCData, ChatMessage, Collider, PlayerSyncData, CoinData, BroadcastMessage, FireworkData } from '../types';
import { NPC_LIST } from '../constants';

// ... [Keep usePlayerControls, Loader, VoiceIndicator, AudioListenerController as they were] ...
function usePlayerControls() {
  const [movement, setMovement] = useState({ forward: false, backward: false, left: false, right: false, shift: false, jump: false });
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLElement && 
         (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setMovement((m) => ({ ...m, forward: true })); break;
        case 'KeyS': case 'ArrowDown': setMovement((m) => ({ ...m, backward: true })); break;
        case 'KeyA': case 'ArrowLeft': setMovement((m) => ({ ...m, left: true })); break;
        case 'KeyD': case 'ArrowRight': setMovement((m) => ({ ...m, right: true })); break;
        case 'ShiftLeft': case 'ShiftRight': setMovement((m) => ({ ...m, shift: true })); break;
        case 'Space': setMovement((m) => ({ ...m, jump: true })); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setMovement((m) => ({ ...m, forward: false })); break;
        case 'KeyS': case 'ArrowDown': setMovement((m) => ({ ...m, backward: false })); break;
        case 'KeyA': case 'ArrowLeft': setMovement((m) => ({ ...m, left: false })); break;
        case 'KeyD': case 'ArrowRight': setMovement((m) => ({ ...m, right: false })); break;
        case 'ShiftLeft': case 'ShiftRight': setMovement((m) => ({ ...m, shift: false })); break;
        case 'Space': setMovement((m) => ({ ...m, jump: false })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  return movement;
}

const Loader = () => {
  const { progress, item } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 w-80 p-4">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-white font-bold text-xl drop-shadow-md tracking-wide">Entering Community...</div>
        <div className="w-full bg-black/20 h-4 rounded-full overflow-hidden backdrop-blur-sm border border-white/30 shadow-inner">
            <div 
                className="h-full bg-gradient-to-r from-garden-300 to-garden-500 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                style={{ width: `${Math.max(5, progress)}%` }}
            />
        </div>
        <div className="flex justify-between w-full px-1 mt-1">
            <span className="text-white/90 text-xs font-mono truncate max-w-[70%] opacity-80">{item}</span>
            <span className="text-white font-bold text-sm drop-shadow">{Math.floor(progress)}%</span>
        </div>
      </div>
    </Html>
  );
};

const VoiceIndicator = () => (
  <Html position={[0, 1.2, 0]} center transform={false}>
     <div className="flex gap-0.5 items-end h-3 bg-white/80 p-1 rounded-md shadow-sm">
        <div className="w-1 bg-garden-500 animate-[bounce_0.8s_infinite] h-1.5" style={{animationDelay:'0ms'}}></div>
        <div className="w-1 bg-garden-500 animate-[bounce_0.8s_infinite] h-3" style={{animationDelay:'150ms'}}></div>
        <div className="w-1 bg-garden-500 animate-[bounce_0.8s_infinite] h-1.5" style={{animationDelay:'300ms'}}></div>
     </div>
  </Html>
);

const AudioListenerController = ({ setListener }: { setListener: (l: THREE.AudioListener) => void }) => {
    const { camera } = useThree();
    useEffect(() => {
        const listener = new THREE.AudioListener();
        camera.add(listener);
        setListener(listener);
        return () => {
            camera.remove(listener);
        };
    }, [camera, setListener]);
    return null;
};

// Improved StreamAudio to handle autoplay policies
const StreamAudio = ({ stream, listener }: { stream: MediaStream, listener: THREE.AudioListener }) => {
    const sound = useRef<THREE.PositionalAudio>(null);
    
    useEffect(() => {
        if (sound.current && stream && listener) {
            // Ensure context is running
            if (listener.context.state === 'suspended') {
                listener.context.resume().catch(e => console.warn("Audio resume failed", e));
            }
            // @ts-ignore
            sound.current.setMediaStreamSource(stream);
            sound.current.setRefDistance(2);
            sound.current.setRolloffFactor(1.5);
            sound.current.setVolume(1);
        }
    }, [stream, listener]);

    if (!listener) return null;
    return <positionalAudio ref={sound} args={[listener]} />
};

interface KickableBallProps {
    playerPosRef: React.MutableRefObject<THREE.Vector3>;
    onKick?: (velocity: number[], position: number[]) => void;
    remoteBallState?: { velocity: number[], position: number[], timestamp: number } | null;
}

const KickableBall = ({ playerPosRef, onKick, remoteBallState }: KickableBallProps) => {
    const ballRef = useRef<THREE.Mesh>(null);
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    const lastKickTime = useRef(0);
    const lastSyncTime = useRef(0);
    
    useFrame((state, delta) => {
        if (!ballRef.current || !playerPosRef.current) return;
        const ballPos = ballRef.current.position;
        
        // Sync Logic
        if (remoteBallState && remoteBallState.timestamp > lastSyncTime.current) {
            ballPos.set(remoteBallState.position[0], remoteBallState.position[1], remoteBallState.position[2]);
            velocity.current.set(remoteBallState.velocity[0], remoteBallState.velocity[1], remoteBallState.velocity[2]);
            lastSyncTime.current = remoteBallState.timestamp;
        }

        // Physics Logic
        const playerPos = playerPosRef.current;
        const dist = ballPos.distanceTo(playerPos);
        const KICK_RADIUS = 1.2;
        const KICK_FORCE = 10;
        const now = Date.now();
        
        if (dist < KICK_RADIUS) {
            const direction = new THREE.Vector3().subVectors(ballPos, playerPos).normalize();
            direction.y = 0;
            velocity.current.add(direction.multiplyScalar(KICK_FORCE * delta));
            if (onKick && (now - lastKickTime.current > 100)) {
                onKick(velocity.current.toArray(), ballPos.toArray());
                lastKickTime.current = now;
            }
        }

        ballPos.add(velocity.current.clone().multiplyScalar(delta * 5));
        velocity.current.multiplyScalar(0.95);
        ballRef.current.rotation.x += velocity.current.z * 0.1;
        ballRef.current.rotation.z -= velocity.current.x * 0.1;
        
        if (ballPos.x > 40) { ballPos.x = 40; velocity.current.x *= -0.5; }
        if (ballPos.x < -40) { ballPos.x = -40; velocity.current.x *= -0.5; }
        if (ballPos.z > 40) { ballPos.z = 40; velocity.current.z *= -0.5; }
        if (ballPos.z < -40) { ballPos.z = -40; velocity.current.z *= -0.5; }
    });
    
    return (
        <mesh ref={ballRef} position={[25, 0.5, 20]} castShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="white" />
            <mesh position={[0.4, 0, 0]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="black" /></mesh>
            <mesh position={[-0.4, 0, 0]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="black" /></mesh>
            <mesh position={[0, 0, 0.4]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="black" /></mesh>
            <mesh position={[0, 0, -0.4]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="black" /></mesh>
            <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.15]} /><meshStandardMaterial color="black" /></mesh>
        </mesh>
    )
}

const PlayerController = ({ 
    user, 
    messages,
    playerPosRef,
    colliders,
    onUpdateState,
    isMicOn
}: { 
    user: UserState, 
    messages: ChatMessage[],
    playerPosRef: React.MutableRefObject<THREE.Vector3>,
    colliders: Collider[],
    onUpdateState?: (rot: number, isMoving: boolean) => void,
    isMicOn: boolean
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<any>(null);
  const { camera, scene } = useThree();
  const { forward, backward, left, right, shift, jump } = usePlayerControls();
  const [isMoving, setIsMoving] = useState(false);
  const prevPos = useRef(new THREE.Vector3(0, 0, 0));
  const velocityY = useRef(0);
  
  const myLatestMsg = messages.filter(m => m.sender === user.name).pop();
  const [displayedMsg, setDisplayedMsg] = useState<string | null>(null);
  
  useEffect(() => {
      if (myLatestMsg) {
          setDisplayedMsg(myLatestMsg.text);
          const t = setTimeout(() => setDisplayedMsg(null), 5000);
          return () => clearTimeout(t);
      }
  }, [myLatestMsg]);

  const checkCollision = (pos: THREE.Vector3) => {
      const PLAYER_RADIUS = 0.5;
      for (const collider of colliders) {
          const dx = pos.x - collider.position[0];
          const dz = pos.z - collider.position[2];
          const dist = Math.sqrt(dx*dx + dz*dz);
          if (dist < (PLAYER_RADIUS + collider.radius)) {
              return true;
          }
      }
      return false;
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const speed = shift ? 7 : 4;
    const moveDir = new THREE.Vector3(0, 0, 0);
    
    if (forward || backward || left || right) {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();
        const camRight = new THREE.Vector3();
        camRight.crossVectors(camera.up, camDir).normalize();
        
        if (forward) moveDir.add(camDir);
        if (backward) moveDir.sub(camDir);
        if (right) moveDir.sub(camRight); 
        if (left) moveDir.add(camRight);
        
        if (moveDir.length() > 0) {
            moveDir.normalize().multiplyScalar(speed * delta);
            const currentPos = groupRef.current.position.clone();
            const potentialPos = currentPos.clone().add(moveDir);
            
            if (!checkCollision(potentialPos)) {
                groupRef.current.position.add(moveDir);
            } else {
                const tryX = currentPos.clone().add(new THREE.Vector3(moveDir.x, 0, 0));
                if (!checkCollision(tryX)) {
                    groupRef.current.position.add(new THREE.Vector3(moveDir.x, 0, 0));
                } else {
                    const tryZ = currentPos.clone().add(new THREE.Vector3(0, 0, moveDir.z));
                    if (!checkCollision(tryZ)) {
                        groupRef.current.position.add(new THREE.Vector3(0, 0, moveDir.z));
                    }
                }
            }
            
            const angle = Math.atan2(moveDir.x, moveDir.z);
            groupRef.current.rotation.y = angle; 
            setIsMoving(true);
        }
    } else {
        setIsMoving(false);
    }

    const raycaster = new THREE.Raycaster();
    const rayOrigin = groupRef.current.position.clone().add(new THREE.Vector3(0, 20, 0));
    raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
    const intersects = raycaster.intersectObjects(scene.children, true);
    let groundHeight = 0;
    for (let hit of intersects) {
        if (hit.object.userData.walkable) {
            groundHeight = hit.point.y;
            break; 
        }
    }

    const GRAVITY = 20;
    const JUMP_FORCE = 8;
    
    velocityY.current -= GRAVITY * delta;
    groupRef.current.position.y += velocityY.current * delta;

    if (groupRef.current.position.y <= groundHeight) {
        groupRef.current.position.y = groundHeight;
        velocityY.current = 0;
        if (jump) velocityY.current = JUMP_FORCE;
    }

    playerPosRef.current.copy(groupRef.current.position);
    if (onUpdateState) onUpdateState(groupRef.current.rotation.y, isMoving);

    if (shadowRef.current) {
        shadowRef.current.position.x = groupRef.current.position.x;
        shadowRef.current.position.z = groupRef.current.position.z;
        shadowRef.current.position.y = groundHeight + 0.02;
        const heightDiff = groupRef.current.position.y - groundHeight;
        const scale = Math.max(0.5, 1 - heightDiff * 0.2); 
        shadowRef.current.scale.setScalar(scale);
        const opacity = Math.max(0.05, 0.15 - heightDiff * 0.05);
        (shadowRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }

    const currentPos = groupRef.current.position;
    const displacement = currentPos.clone().sub(prevPos.current);
    if (displacement.lengthSq() > 0) {
        camera.position.add(displacement);
        if (controlsRef.current) controlsRef.current.target.add(displacement);
    }
    prevPos.current.copy(currentPos);
  });

  const isGrounded = groupRef.current ? (groupRef.current.position.y - 0.05) <= (playerPosRef.current.y) : true;

  return (
    <group>
        <group ref={groupRef}>
            <Avatar 
                type={user.characterType} 
                color={user.color} 
                accessory={user.accessory}
                isMoving={isMoving && isGrounded} 
                withShadow={false} 
            />
            {isMicOn && <VoiceIndicator />}
            <Html position={[0, 2, 0]} center style={{ pointerEvents: 'none' }}>
                <div className="flex flex-col items-center w-48">
                    {displayedMsg && (
                        <div className="mb-2 bg-white text-gray-900 px-4 py-2 rounded-2xl shadow-xl border-2 border-garden-400 text-center font-medium text-sm relative animate-in fade-in zoom-in duration-200">
                            {displayedMsg}
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-garden-400"></div>
                        </div>
                    )}
                    <div className="bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm border border-white/20">
                        {user.name}
                    </div>
                </div>
            </Html>
        </group>
        <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[0.45, 32]} />
            <meshBasicMaterial color="black" opacity={0.15} transparent />
        </mesh>
        <OrbitControls 
            ref={controlsRef}
            enableDamping={false} 
            minDistance={3}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2 - 0.05} 
            enablePan={false} 
        />
    </group>
  );
};

interface RemotePeerProps {
  data: PlayerSyncData;
  chatHistory: ChatMessage[];
  stream?: MediaStream;
  audioListener: THREE.AudioListener | null;
}

const RemotePeer: React.FC<RemotePeerProps> = ({ 
    data, 
    chatHistory, 
    stream, 
    audioListener 
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const targetPos = useRef(new THREE.Vector3(...data.position));
    
    const latestMsg = chatHistory.filter(m => m.sender === data.user.name).pop();
    const [displayedMsg, setDisplayedMsg] = useState<string | null>(null);

    useEffect(() => {
        targetPos.current.set(...data.position);
    }, [data.position]);

    useEffect(() => {
        if (latestMsg && (Date.now() - latestMsg.timestamp) < 8000) {
            setDisplayedMsg(latestMsg.text);
            const t = setTimeout(() => setDisplayedMsg(null), 8000);
            return () => clearTimeout(t);
        }
    }, [latestMsg]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.position.lerp(targetPos.current, delta * 10);
        groupRef.current.rotation.y = data.rotation;
    });

    return (
        <group ref={groupRef} position={new THREE.Vector3(...data.position)}>
            <Avatar 
                type={data.user.characterType} 
                color={data.user.color} 
                accessory={data.user.accessory}
                isMoving={data.isMoving} 
            />
            {data.isMicOn && <VoiceIndicator />}
            {stream && audioListener && <StreamAudio stream={stream} listener={audioListener} />}
            <Html position={[0, 2, 0]} center style={{ pointerEvents: 'none' }}>
                <div className="flex flex-col items-center w-48">
                    {displayedMsg && (
                        <div className="mb-2 bg-white text-gray-900 px-4 py-2 rounded-2xl shadow-xl border-2 border-gray-300 text-center font-medium text-sm relative animate-in fade-in zoom-in duration-200">
                            {displayedMsg}
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-300"></div>
                        </div>
                    )}
                    <div className="bg-garden-800/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm border border-white/20">
                        {data.user.name}
                    </div>
                </div>
            </Html>
        </group>
    );
}

interface NPCProps {
    data: NPCData;
    chatHistory: ChatMessage[];
    nearbyNPC: string | null;
    setNearbyNPC: (name: string | null) => void;
    playerPosRef: React.MutableRefObject<THREE.Vector3>;
}

const NPC: React.FC<NPCProps> = ({ 
    data, 
    chatHistory,
    nearbyNPC,
    setNearbyNPC,
    playerPosRef
}) => {
    const latestMsg = chatHistory.filter(m => m.sender === data.name).pop();
    const [displayedMsg, setDisplayedMsg] = useState<string | null>(null);
    const groupRef = useRef<THREE.Group>(null);
    const isInteracting = nearbyNPC === data.name;

    useEffect(() => {
        if (latestMsg && (Date.now() - latestMsg.timestamp) < 8000) { 
            setDisplayedMsg(latestMsg.text);
            const t = setTimeout(() => setDisplayedMsg(null), 8000);
            return () => clearTimeout(t);
        }
    }, [latestMsg]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const myPos = groupRef.current.position;
        const distToPlayer = myPos.distanceTo(playerPosRef.current);
        const isClose = distToPlayer < 3.5;

        if (isClose && nearbyNPC !== data.name) {
            setNearbyNPC(data.name);
        } else if (!isClose && nearbyNPC === data.name) {
            setNearbyNPC(null);
        }
        
        if (isClose) {
             groupRef.current.lookAt(playerPosRef.current.x, groupRef.current.position.y, playerPosRef.current.z);
        }
    });

    return (
        <group ref={groupRef} position={new THREE.Vector3(...data.position)}>
             <Avatar 
                type={data.characterType} 
                color={data.color} 
                accessory={data.accessory}
                isMoving={false} 
             />
             <Html position={[0, 2, 0]} center style={{ pointerEvents: 'none' }}>
                 <div className="flex flex-col items-center w-48 gap-1">
                     {isInteracting && !displayedMsg && (
                        <div className="animate-bounce bg-white text-garden-600 p-1.5 rounded-full shadow-md border-2 border-garden-400 mb-1">
                            <MessageCircle size={20} strokeWidth={2.5} fill="currentColor" className="text-garden-100" />
                        </div>
                     )}
                    {displayedMsg && (
                        <div className="mb-2 bg-white text-gray-900 px-4 py-2 rounded-2xl shadow-xl border-2 border-gray-200 text-center font-medium text-sm relative animate-in fade-in zoom-in duration-200">
                            {displayedMsg}
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-200"></div>
                        </div>
                    )}
                     <div className={`backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm transition-colors duration-300 ${isInteracting ? 'bg-garden-600 ring-2 ring-white' : 'bg-garden-700/80'}`}>
                        {data.name}
                     </div>
                 </div>
             </Html>
        </group>
    );
}

const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

// Generate initial deterministic coins
const INITIAL_COINS: CoinData[] = Array.from({ length: 40 }).map((_, i) => {
    const r1 = seededRandom(i * 77.7);
    const r2 = seededRandom(i * 33.3);
    const x = (r1 - 0.5) * 80; 
    const z = (r2 - 0.5) * 80;
    // Skip center spawn
    if (Math.abs(x) < 5 && Math.abs(z) < 5) return { id: `init-${i}`, position: [20, 1, 20] }; // fallback
    return { id: `init-${i}`, position: [x, 1, z] };
});

interface GameCanvasProps {
    user: UserState;
    chatHistory: ChatMessage[];
    nearbyNPC: string | null;
    setNearbyNPC: (name: string | null) => void;
    broadcastMessage: BroadcastMessage | null;
    onRemoteChat: (sender: string, text: string) => void;
    micStream: MediaStream | null;
    onPlayerListUpdate?: (players: string[]) => void;
    onCoinCollected?: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
    user, 
    chatHistory, 
    nearbyNPC, 
    setNearbyNPC,
    broadcastMessage,
    onRemoteChat,
    micStream,
    onPlayerListUpdate,
    onCoinCollected
}) => {
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const isMovingRef = useRef(false); 
  const rotationRef = useRef(0);
  const [colliders, setColliders] = useState<Collider[]>([]);
  const [remotePeers, setRemotePeers] = useState<Record<string, PlayerSyncData>>({});
  const [peerStreams, setPeerStreams] = useState<Record<string, MediaStream>>({});
  const [ballState, setBallState] = useState<{ velocity: number[], position: number[], timestamp: number } | null>(null);
  
  // Synced Game State
  const [coins, setCoins] = useState<CoinData[]>(INITIAL_COINS);
  const [fireworks, setFireworks] = useState<FireworkData[]>([]);

  const roomRef = useRef<any>(null);
  const [audioListener, setAudioListener] = useState<THREE.AudioListener | null>(null);
  
  useEffect(() => {
      const config = { appId: 'ixdf-garden-v2-sync' };
      const room = joinRoom(config, 'playground');
      roomRef.current = room;
      
      const [sendState, getState] = room.makeAction('state');
      const [sendChat, getChat] = room.makeAction('chat');
      const [sendBall, getBall] = room.makeAction('ball');
      const [sendFirework, getFirework] = room.makeAction('firework');
      const [sendCoin, getCoin] = room.makeAction('coin');
      
      getState((data: PlayerSyncData, peerId: string) => {
          setRemotePeers(prev => ({ ...prev, [peerId]: { ...data, id: peerId } }));
      });
      
      getChat((data: { text: string, sender: string }, peerId: string) => {
          onRemoteChat(data.sender, data.text);
      });

      getBall((data: { velocity: number[], position: number[], timestamp: number }, peerId: string) => {
          setBallState(data);
      });
      
      // Handle Firework Launch Event
      getFirework((data: FireworkData, peerId: string) => {
          setFireworks(prev => [...prev, data]);
      });

      // Handle Coin Events (Collect & Spawn)
      getCoin((data: { type: 'collect'|'spawn', id?: string, coin?: CoinData }, peerId: string) => {
          if (data.type === 'collect' && data.id) {
              setCoins(prev => prev.filter(c => c.id !== data.id));
          } else if (data.type === 'spawn' && data.coin) {
              setCoins(prev => [...prev, data.coin!]);
          }
      });
      
      room.onPeerStream((stream: MediaStream, peerId: string) => {
          setPeerStreams(prev => ({ ...prev, [peerId]: stream }));
      });
      
      room.onPeerLeave((peerId: string) => {
          setRemotePeers(prev => { const next = { ...prev }; delete next[peerId]; return next; });
          setPeerStreams(prev => { const next = { ...prev }; delete next[peerId]; return next; });
      });
      
      const interval = setInterval(() => {
          const myData: PlayerSyncData = {
              id: 'me',
              user: user,
              position: [playerPosRef.current.x, playerPosRef.current.y, playerPosRef.current.z],
              rotation: rotationRef.current,
              isMoving: isMovingRef.current,
              isMicOn: !!micStream,
              timestamp: Date.now()
          };
          sendState(myData);
      }, 50);
      
      (window as any).__sendChat = sendChat;
      (window as any).__sendBall = sendBall;
      (window as any).__sendFirework = sendFirework;
      (window as any).__sendCoin = sendCoin;

      return () => {
          clearInterval(interval);
          room.leave();
      }
  }, []); 

  useEffect(() => {
      if (roomRef.current && micStream) {
          try {
              roomRef.current.addStream(micStream);
              // Force resume audio context when we start streaming to ensure we can hear others
              if (audioListener && audioListener.context.state === 'suspended') {
                  audioListener.context.resume();
              }
          } catch(e) {
              console.warn("Stream error", e);
          }
          return () => {
              try { roomRef.current.removeStream(micStream); } catch(e) {}
          };
      }
  }, [micStream, audioListener]);

  useEffect(() => {
      if (broadcastMessage && (window as any).__sendChat) {
          // Broadcast as the specific sender (User or NPC)
          (window as any).__sendChat({
              text: broadcastMessage.text,
              sender: broadcastMessage.sender
          });
      }
  }, [broadcastMessage]);

  useEffect(() => {
      if (onPlayerListUpdate) {
          const names = Object.values(remotePeers).map(p => p.user.name);
          onPlayerListUpdate(names);
      }
  }, [remotePeers, onPlayerListUpdate]);

  // --- Coin Collection Logic (Hostless) ---
  useFrame(() => {
      if (!playerPosRef.current) return;
      const playerPos = playerPosRef.current;
      const COLLECT_RADIUS = 1.5;

      setCoins(currentCoins => {
          let collectedCoinId: string | null = null;
          
          const remaining = currentCoins.filter(c => {
              const dx = playerPos.x - c.position[0];
              const dy = playerPos.y - c.position[1];
              const dz = playerPos.z - c.position[2];
              if (Math.sqrt(dx*dx + dy*dy + dz*dz) < COLLECT_RADIUS) {
                  collectedCoinId = c.id;
                  return false;
              }
              return true;
          });

          if (collectedCoinId) {
              if (onCoinCollected) onCoinCollected();
              
              // 1. Tell everyone to remove it
              if ((window as any).__sendCoin) {
                  (window as any).__sendCoin({ type: 'collect', id: collectedCoinId });
              }

              // 2. Wait and Respawn (Hostless responsibility)
              setTimeout(() => {
                  const x = (Math.random() - 0.5) * 80;
                  const z = (Math.random() - 0.5) * 80;
                  if (Math.abs(x) > 5 || Math.abs(z) > 5) {
                    const newCoin: CoinData = {
                        id: Date.now().toString() + Math.random(),
                        position: [x, 1, z]
                    };
                    if ((window as any).__sendCoin) {
                        (window as any).__sendCoin({ type: 'spawn', coin: newCoin });
                        // Also add locally for the spawner
                        setCoins(prev => [...prev, newCoin]);
                    }
                  }
              }, 3000);

              return remaining;
          }
          return currentCoins;
      });
  });

  const handleLocalUpdate = (rotation: number, moving: boolean) => {
      rotationRef.current = rotation;
      isMovingRef.current = moving;
      // Resume AudioContext on movement interaction to fix autoplay policies
      if (audioListener && audioListener.context.state === 'suspended') {
          audioListener.context.resume();
      }
  }
  
  const handleBallKick = (velocity: number[], position: number[]) => {
      if ((window as any).__sendBall) {
          (window as any).__sendBall({ velocity, position, timestamp: Date.now() });
      }
  };

  const handleLaunchFirework = () => {
      const colors = ['#ef4444', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#22c55e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newFirework: FireworkData = {
          id: Date.now(),
          color: randomColor,
          position: [4.5, 0, -4] // Launcher pos
      };
      
      // Add locally
      setFireworks(prev => [...prev, newFirework]);
      
      // Broadcast
      if ((window as any).__sendFirework) {
          (window as any).__sendFirework(newFirework);
      }
  };

  return (
    <div className="w-full h-full absolute inset-0 bg-sky-300">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
         <AudioListenerController setListener={setAudioListener} />
         <fog attach="fog" args={['#e0f2fe', 10, 50]} />
         <Suspense fallback={<Loader />}>
           <Scene 
                setColliders={setColliders} 
                playerPosRef={playerPosRef}
                fireworks={fireworks}
                onLaunchFirework={handleLaunchFirework}
                onRemoveFirework={(id) => setFireworks(prev => prev.filter(fw => fw.id !== id))}
           >
               {/* Render Coins inside Scene so they share the coordinate space */}
               {coins.map(c => <Coin key={c.id} position={c.position} />)}
           </Scene>
           
           <PlayerController 
              user={user} 
              messages={chatHistory}
              playerPosRef={playerPosRef}
              colliders={colliders}
              onUpdateState={handleLocalUpdate}
              isMicOn={!!micStream}
           />
           
            <KickableBall 
                playerPosRef={playerPosRef} 
                onKick={handleBallKick}
                remoteBallState={ballState}
            />
           {NPC_LIST.map(npc => (
               <NPC 
                 key={npc.id} 
                 data={npc} 
                 chatHistory={chatHistory} 
                 nearbyNPC={nearbyNPC}
                 setNearbyNPC={setNearbyNPC}
                 playerPosRef={playerPosRef}
               />
           ))}
           {(Object.values(remotePeers) as PlayerSyncData[]).map((peer) => (
               <RemotePeer 
                    key={peer.id} 
                    data={peer} 
                    chatHistory={chatHistory} 
                    stream={peerStreams[peer.id]}
                    audioListener={audioListener}
                />
           ))}
         </Suspense>
      </Canvas>
    </div>
  );
};

export default GameCanvas;