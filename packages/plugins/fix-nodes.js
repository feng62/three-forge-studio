const fs = require('fs');
const path = require('path');

const files = [
  'd:/Project/Three/three-forge-studio/packages/plugins/src/interaction/nodes/CustomInteractionNode.vue',
  'd:/Project/Three/three-forge-studio/packages/plugins/src/label/nodes/CustomLabelNode.vue',
  'd:/Project/Three/three-forge-studio/packages/plugins/src/camera-animation/nodes/CustomCameraNode.vue',
  'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/business-action/CustomBusinessNode.vue',
  'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/condition/CustomConditionNode.vue',
  'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/delay/CustomDelayNode.vue',
  'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/logic/CustomLogicNode.vue',
  'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/variables/CustomVariableNode.vue',
  'd:/Project/Three/three-forge-studio/packages/plugins/src/visual-logic/engine/nodes/system-action/CustomSystemNode.vue'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove overflow-hidden
  content = content.replace(/ overflow-hidden /g, ' ');
  content = content.replace(/'!border-[^']+ overflow-hidden/, match => match.replace(' overflow-hidden', ''));
  content = content.replace(/overflow-hidden hover:/, 'hover:');

  // Add rounded-t-xl to the header
  content = content.replace(/(<div class="flex items-center bg-gradient-to-r [^"]+)(">)/, '$1 rounded-t-xl$2');
  
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
