const fs = require('fs');
const path = require('path');
const base = fs.readFileSync('d:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/system-action/CustomSystemNode.vue', 'utf8');

const components = [
  {
    path: 'd:/Project/Three/three-forge-studio/packages/plugins/src/interaction/nodes/CustomInteractionNode.vue',
    colorFrom: 'sky',
    colorTo: 'rose',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>',
    anim: 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]'
  },
  {
    path: 'd:/Project/Three/three-forge-studio/packages/plugins/src/label/nodes/CustomLabelNode.vue',
    colorFrom: 'sky',
    colorTo: 'teal',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin=\"round" class="w-full h-full drop-shadow-[0_0_4px_rgba(45,212,191,0.6)]"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
    anim: ''
  },
  {
    path: 'd:/Project/Three/three-forge-studio/packages/plugins/src/camera-animation/nodes/CustomCameraNode.vue',
    colorFrom: 'sky',
    colorTo: 'blue',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_4px_rgba(96,165,250,0.6)]"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
    anim: ''
  },
  {
    path: 'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/business-action/CustomBusinessNode.vue',
    colorFrom: 'sky',
    colorTo: 'indigo',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_4px_rgba(129,140,248,0.6)]"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    anim: ''
  },
  {
    path: 'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/condition/CustomConditionNode.vue',
    colorFrom: 'sky',
    colorTo: 'cyan',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    anim: ''
  },
  {
    path: 'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/delay/CustomDelayNode.vue',
    colorFrom: 'sky',
    colorTo: 'fuchsia',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_4px_rgba(232,121,249,0.6)]"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    anim: ''
  },
  {
    path: 'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/logic/CustomLogicNode.vue',
    colorFrom: 'sky',
    colorTo: 'cyan',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_4px_rgba(34,211,238,0.6)]"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    anim: ''
  },
  {
    path: 'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/variables/CustomVariableNode.vue',
    colorFrom: 'sky',
    colorTo: 'emerald',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
    anim: ''
  }
];

components.forEach(comp => {
  let content = base;
  
  content = content.replace(/sky/g, comp.colorTo);
  
  if (comp.colorTo === 'rose') {
    content = content.replace(/rgba\(56,189,248/g, 'rgba(244,63,94');
  } else if (comp.colorTo === 'teal') {
    content = content.replace(/rgba\(56,189,248/g, 'rgba(45,212,191');
  } else if (comp.colorTo === 'blue') {
    content = content.replace(/rgba\(56,189,248/g, 'rgba(96,165,250');
  } else if (comp.colorTo === 'indigo') {
    content = content.replace(/rgba\(56,189,248/g, 'rgba(129,140,248');
  } else if (comp.colorTo === 'cyan') {
    content = content.replace(/rgba\(56,189,248/g, 'rgba(34,211,238');
  } else if (comp.colorTo === 'fuchsia') {
    content = content.replace(/rgba\(56,189,248/g, 'rgba(232,121,249');
  } else if (comp.colorTo === 'emerald') {
    content = content.replace(/rgba\(56,189,248/g, 'rgba(52,211,153');
  }

  content = content.replace(/<svg[\s\S]*?<\/svg>/, comp.icon);
  
  if (comp.anim) {
    content = content.replace(/animate-\[spin_8s_linear_infinite\]/, comp.anim);
  } else {
    content = content.replace(/ animate-\[spin_8s_linear_infinite\]/g, '');
    content = content.replace(/animate-\[spin_8s_linear_infinite\]/g, '');
  }

  fs.mkdirSync(path.dirname(comp.path), { recursive: true });
  fs.writeFileSync(comp.path, content);
  console.log(`Created ${comp.path}`);
});
