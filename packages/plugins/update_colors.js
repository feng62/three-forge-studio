const fs = require('fs');
const path = require('path');

const colorMap = [
  { file: 'packages/plugins/src/interaction/nodes/CustomInteractionNode.vue', colorName: 'rose', hex: '#FF3B30', rgb: '255,59,48' },
  { file: 'packages/plugins/src/camera-animation/nodes/CustomCameraNode.vue', colorName: 'purple', hex: '#AF52DE', rgb: '175,82,222' },
  { file: 'packages/plugins/src/label/nodes/CustomLabelNode.vue', colorName: 'sky', hex: '#5AC8FA', rgb: '90,200,250' },
  { file: 'packages/plugins/src/visual-logic/engine/nodes/system-action/CustomSystemNode.vue', colorName: 'blue', hex: '#007AFF', rgb: '0,122,255' },
  { file: 'packages/plugins/src/visual-logic/engine/nodes/business-action/CustomBusinessNode.vue', colorName: 'blue', hex: '#007AFF', rgb: '0,122,255' },
  { file: 'packages/plugins/src/visual-logic/engine/nodes/delay/CustomDelayNode.vue', colorName: 'amber', hex: '#FF9500', rgb: '255,149,0' },
  { file: 'packages/plugins/src/visual-logic/engine/nodes/variables/CustomVariableNode.vue', colorName: 'emerald', hex: '#34C759', rgb: '52,199,89' },
  { file: 'packages/plugins/src/visual-logic/engine/nodes/logic/CustomLogicNode.vue', colorName: 'indigo', hex: '#5856D6', rgb: '88,86,214' },
  { file: 'packages/plugins/src/visual-logic/engine/nodes/condition/CustomConditionNode.vue', colorName: 'slate', hex: '#8E8E93', rgb: '142,142,147' }
];

colorMap.forEach(item => {
  let content = fs.readFileSync(item.file, 'utf8');
  
  // Replace text-color-X
  content = content.replace(new RegExp(`text-${item.colorName}-\\d+`, 'g'), `text-[${item.hex}]`);
  
  // Replace border-color-X
  content = content.replace(new RegExp(`border-${item.colorName}-\\d+`, 'g'), `border-[${item.hex}]`);
  
  // Replace from-color-X
  content = content.replace(new RegExp(`from-${item.colorName}-\\d+`, 'g'), `from-[${item.hex}]`);
  
  // Replace to-color-X
  content = content.replace(new RegExp(`to-${item.colorName}-\\d+`, 'g'), `to-[${item.hex}]`);

  // Fix !border 
  content = content.replace(new RegExp(`!border-${item.colorName}`, 'g'), `!border-[${item.hex}]`);
  
  // Replace rgba for shadows
  const rgbPattern = /(rgba\()\d+,\s*\d+,\s*\d+(,\s*[\d.]+\))/g;
  content = content.replace(rgbPattern, `$1${item.rgb}$2`);
  
  fs.writeFileSync(item.file, content);
  console.log('Updated ' + item.file);
});
