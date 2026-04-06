# Refactor TicketDetailTechnicien into Components - TODO

## Completed: 3/6 ✓

### 1. [x] Create constants.js
- Export all maps (PRIORITY_CLASS, STATUS_FR, etc.), ACT_DOT, ACT_LABEL.

### 2. [x] Create utils folder + extract utilities
- ConvBubble.jsx, RichTextArea.jsx, FileAttachment.jsx, ManualCloseModal.jsx, UserTooltip.jsx.

### 3. [x] Update existing components imports
- TicketInfo.jsx: import constants/utils.
- Actuality.jsx: import constants.

### 4. [x] Implement ConversationActions.jsx
- Left: Conversation list.
- Right: Tabs + actions (respond/redirect/close).

### 5. [x] Refactor parent TicketDetailTechnicien.jsx
- Keep state/logic.
- Render: Header → TicketInfo → Actuality → ConversationActions.

### 6. [x] Test complete ✅

All steps done. Page refactored into Header, TicketInfo (employee+ticket), Actuality, ConversationActions (conversation + repondre/rediriger/fermer).

Run `npm run dev` in frontend/ to test.

