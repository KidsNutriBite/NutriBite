"use client";

import React from 'react';
import { useSceneManager } from '../scene/useSceneManager';
import { SCENE_IDS } from '../scene/sceneManifest';
import Scene0_Splash from './Scene0_Splash';
import Scene1_HiddenReality from './Scene1_HiddenReality';
import Scene2_GrowthIntelligence from './Scene2_GrowthIntelligence';
import Scene3_PediatricAI from './Scene3_PediatricAI';
import Scene4_MedicalTrust from './Scene4_MedicalTrust';
import Scene5_KidsUniverse from './Scene5_KidsUniverse';
import Scene6_LandingReveal from './Scene6_LandingReveal';

export function SceneContainer() {
  const { activeScene } = useSceneManager();

  switch (activeScene?.id) {
    case SCENE_IDS.SPLASH:
      return <Scene0_Splash />;
    case SCENE_IDS.HIDDEN_REALITY:
      return <Scene1_HiddenReality />;
    case SCENE_IDS.GROWTH_INTELLIGENCE:
      return <Scene2_GrowthIntelligence />;
    case SCENE_IDS.PEDIATRIC_AI:
      return <Scene3_PediatricAI />;
    case SCENE_IDS.MEDICAL_TRUST:
      return <Scene4_MedicalTrust />;
    case SCENE_IDS.KIDS_UNIVERSE:
      return <Scene5_KidsUniverse />;
    case SCENE_IDS.LANDING_REVEAL:
      return <Scene6_LandingReveal />;
    default:
      return <Scene6_LandingReveal />;
  }
}
