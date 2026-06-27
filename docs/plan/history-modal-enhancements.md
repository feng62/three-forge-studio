# Project History Modal Enhancements

## Step 1 — Fix Theme Modal Visibility
Resolve the CSS or z-index issue causing the Project History Modal to not display when the default theme is active.

## Step 2 — Prompt for Project Name on Creation
Update the new project creation flow in `EditorHeader.vue` and `ProjectHistoryModal.vue` to prompt the user (e.g. via `ElMessageBox.prompt` or a custom dialog) for a project name rather than hardcoding "Untitled Project".

## Step 3 — Implement Advanced CRUD in History Modal
Enhance the `ProjectHistoryModal.vue` to support renaming existing projects and updating their data, completing the CRUD lifecycle alongside existing create, read, and delete functions.

## Step 4 — Add Batch Processing Capabilities
Introduce multi-select functionality in the `ProjectHistoryModal.vue` to allow users to select multiple projects and perform batch operations, specifically batch deletion.
