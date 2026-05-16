'use client';
import { useCallback } from 'react';
import * as sounds from '@/lib/sounds';

type SoundName = 'pointAdd' | 'pointDeduct' | 'exchange' | 'click' | 'toast' | 'modalOpen' | 'toggle' | 'milestone';

export function useSound() {
  const play = useCallback((name: SoundName) => {
    switch (name) {
      case 'pointAdd': sounds.playPointAdd(); break;
      case 'pointDeduct': sounds.playPointDeduct(); break;
      case 'exchange': sounds.playExchange(); break;
      case 'click': sounds.playClick(); break;
      case 'toast': sounds.playToast(); break;
      case 'modalOpen': sounds.playModalOpen(); break;
      case 'toggle': sounds.playToggle(); break;
      case 'milestone': sounds.playMilestone(); break;
    }
  }, []);

  return { play };
}
