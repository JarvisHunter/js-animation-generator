export interface AnimationData {
  general_instruction: string;
  elements: string;
  animation_details: string;
  timing_easing: string;
  triggering: string;
  repeat_behavior: string;
  html_structure?: string;
  responsive_behavior?: string;
  animation_sequence?: string;
  additional_effects?: string;
  debugging_logging?: string;
  fallbacks?: string;
  user_controls?: string;
  transitions_states?: string;
  style_constraints?: string;
  techConstraints: {
    framework: 'vanilla' | 'react';
    rendering: 'dom' | 'svg' | 'canvas';
    physics: {
      motionType: 'spring' | 'easing' | 'frame';
      coordinateSystem: 'screen' | 'relative';
    };
  };
}