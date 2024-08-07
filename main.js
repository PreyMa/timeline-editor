
import './components/branch-line.js';
import './components/drop-down.js';
import './components/time-board.js';
import './components/time-branch.js';
import './components/time-item.js';
import './components/time-line.js';
import './components/menu-bar.js'
import './components/category-panel.js';


import { Editor } from './editor.js';
import { ColorDialog } from './components/color-dialog.js';
import { CategoryDialog } from './components/category-dialog.js';
import { defineElements } from './components/base-component.js';
import { SettingsDialog } from './components/settings-dialog.js';

defineElements();

ColorDialog.init();
CategoryDialog.init();
SettingsDialog.init();

Editor.init();
