/**
 * 人格头型 + 能量档位：双缓冲交叉淡入，避免换档时头像断层
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getEnergyRingClass, getEnergyTier } from '../utils/energyPersona';
import {
  buildLocalCompositeUrlForLevel,
  buildPersonaFaceUrlForLevel,
  LOCAL_PERSONA_BY_TYPE,
  PERSONA_FACE_FALLBACK,
  preloadPersonaFaces,
} from '../utils/personaAvatar';
import { normalizePersonalityLetter } from '../utils/personalityHead';

interface PersonaAvatarProps {
  energyLevel: number;
  dominantType?: string | null;
  personaName?: string | null;
  userId?: string;
  className?: string;
}

async function resolveAvatarSrc(
  targetSrc: string,
  dominant: ReturnType<typeof normalizePersonalityLetter>,
  energyLevel: number,
): Promise<string> {
  if (await preloadImage(targetSrc)) return targetSrc;
  const headSrc = LOCAL_PERSONA_BY_TYPE[dominant];
  if (await preloadImage(headSrc)) return headSrc;
  return buildPersonaFaceUrlForLevel(energyLevel);
}

function preloadImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

export default function PersonaAvatar({
  energyLevel,
  dominantType,
  personaName,
  className = '',
}: PersonaAvatarProps) {
  const tier = getEnergyTier(energyLevel);
  const ring = getEnergyRingClass(energyLevel);
  const dominant = normalizePersonalityLetter(dominantType);

  const targetSrc = useMemo(
    () =>
      buildLocalCompositeUrlForLevel(energyLevel, dominantType, personaName),
    [energyLevel, dominantType, personaName],
  );

  const [bottomSrc, setBottomSrc] = useState(targetSrc);
  const [topSrc, setTopSrc] = useState<string | null>(null);
  const [topVisible, setTopVisible] = useState(false);
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    preloadPersonaFaces(dominantType, personaName);
  }, [dominantType, personaName]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const reqId = ++requestRef.current;
    let cancelled = false;

    void (async () => {
      const resolved = await resolveAvatarSrc(targetSrc, dominant, energyLevel);
      if (cancelled || !mountedRef.current || requestRef.current !== reqId) return;

      setTopSrc((prev) => {
        if (prev === resolved) return prev;
        return resolved;
      });
      setTopVisible(false);
      requestAnimationFrame(() => {
        if (cancelled || !mountedRef.current || requestRef.current !== reqId) return;
        setTopVisible(true);
      });

      window.setTimeout(() => {
        if (cancelled || !mountedRef.current || requestRef.current !== reqId) return;
        setBottomSrc(resolved);
        setTopSrc(null);
        setTopVisible(false);
      }, 320);
    })();

    return () => {
      cancelled = true;
    };
  }, [targetSrc, dominant, energyLevel]);

  const onImgError = (layer: 'bottom' | 'top') => {
    const fallback = LOCAL_PERSONA_BY_TYPE[dominant] ?? PERSONA_FACE_FALLBACK;
    if (layer === 'bottom') setBottomSrc(fallback);
    else setTopSrc(fallback);
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative w-24 h-24 bg-primary-container rounded-2xl border-2 border-outline-variant/50 shadow-neo overflow-hidden ring-4 ring-offset-2 ring-offset-white transition-[box-shadow] duration-300 ${ring}`}
      >
        <img
          src={bottomSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => onImgError('bottom')}
        />
        {topSrc && (
          <img
            src={topSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out"
            style={{ opacity: topVisible ? 1 : 0 }}
            onError={() => onImgError('top')}
          />
        )}
      </div>
      <span className="sr-only">{tier.label}</span>
    </div>
  );
}
