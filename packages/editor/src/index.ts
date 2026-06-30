import './index.css';
import './config/properties/index';
import ForgeEditor from './components/layout/EditorLayout.vue';
import { db } from './db/database';
import { db as assetDb } from './db/db';
import { useProjectStore } from './stores/projectStore';

export { ForgeEditor, db, assetDb, useProjectStore };
