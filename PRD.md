# Planning Guide

A conversational AI interface that provides a ChatGPT-like experience while allowing users to connect to different backend LLM providers through configurable API endpoints.

**Experience Qualities**:
1. **Conversational** - The interface should feel like a natural back-and-forth dialogue, with clear message threading and smooth conversation flow
2. **Professional** - A clean, focused design that prioritizes content readability and minimizes distractions during extended chat sessions
3. **Flexible** - Easy model switching and configuration without interrupting the user's workflow

**Complexity Level**: Light Application (multiple features with basic state)
This is a chat interface with message management, model configuration, and persistent conversation history - more than a single-purpose tool but not requiring complex multi-view navigation or advanced state orchestration.

## Essential Features

### Message Input & Sending
- **Functionality**: Multi-line text input with send button and keyboard shortcut support
- **Purpose**: Primary user interaction for communicating with AI models
- **Trigger**: User types in the input field and presses Enter (or Shift+Enter for new line) or clicks send button
- **Progression**: User types message → Presses Enter/Send → Message appears in chat → Loading state shown → AI response streams in → Input clears and refocuses
- **Success criteria**: Messages send reliably, input handles multi-line text, keyboard shortcuts work intuitively

### Conversation Display
- **Functionality**: Scrollable message thread showing user and AI messages with distinct styling
- **Purpose**: Display the ongoing conversation with clear visual distinction between participants
- **Trigger**: New messages are sent or received
- **Progression**: Message received → Rendered with appropriate styling → Auto-scroll to bottom → Message becomes part of conversation history
- **Success criteria**: Messages are clearly attributed, readable, and maintain chronological order

### Model Configuration
- **Functionality**: Interface to select/configure API endpoint, model name, API key, and provider-specific authentication methods (OAuth for GitHub Copilot, API keys for OpenAI/z.ai, no auth for localhost)
- **Purpose**: Allow connection to different LLM providers with appropriate authentication method for each provider
- **Trigger**: User opens settings/config panel
- **Progression**: User clicks config button → Modal opens → User selects provider preset or custom → If OAuth provider, user clicks "Connect with GitHub" button → OAuth flow initiated → User authenticates → Token stored → Optionally enters/modifies endpoint URL, model name → Saves configuration → Settings persist for future sessions
- **Success criteria**: Settings save reliably, OAuth flow completes successfully, API keys securely stored, support various API formats, provide validation feedback, preset providers auto-configure endpoints and auth methods

### Conversation Management
- **Functionality**: Start new conversations, view/switch between conversation history
- **Purpose**: Organize multiple chat threads and maintain context separation
- **Trigger**: User clicks "New Chat" or selects a previous conversation
- **Progression**: User initiates action → Current conversation saves → New/selected conversation loads → Chat area updates with appropriate messages
- **Success criteria**: Conversations persist, switching is instant, no message loss

### Streaming Responses
- **Functionality**: Display AI responses token-by-token as they arrive
- **Purpose**: Provide immediate feedback and reduce perceived latency
- **Trigger**: API response begins streaming
- **Progression**: First token arrives → Message container appears → Tokens append in real-time → Stream completes → Final message rendered
- **Success criteria**: Smooth streaming with no flickering, handles interruptions gracefully

### Markdown Formatting
- **Functionality**: Render markdown syntax in messages including code blocks, lists, headers, links, and text formatting
- **Purpose**: Enable rich formatting for technical content, structured information, and code snippets
- **Trigger**: Messages containing markdown syntax are automatically rendered
- **Progression**: Message received → Markdown parsed → Rendered with proper styling → Displayed in message bubble
- **Success criteria**: All common markdown elements render correctly, code blocks have syntax highlighting-ready styling, maintains readability

## Edge Case Handling

- **Empty Messages** - Disable send button when input is empty or only whitespace
- **API Errors** - Display clear error messages inline in chat (authentication failures, network issues, invalid endpoints)
- **Long Messages** - Support very long user inputs and AI responses with proper text wrapping and scrolling
- **Connection Loss** - Show connection status and allow retry of failed messages
- **Invalid Configuration** - Validate API settings before allowing messages to be sent, provide helpful error hints, check OAuth token expiry and refresh if needed
- **Rapid Sending** - Prevent duplicate sends while a message is processing
- **Conversation Limits** - Handle storage limits gracefully, potentially archiving old conversations
- **Localhost Connections** - Automatically skip API key requirement for localhost provider, handle CORS and connection errors gracefully
- **Provider Switching** - Preserve API keys and OAuth tokens when switching between providers, warn if switching mid-conversation
- **OAuth Flow Interruption** - Handle cases where OAuth window is closed or authorization denied, provide clear error messages and retry options
- **Token Expiration** - Automatically refresh OAuth tokens before expiration when refresh token is available, detect expired tokens and prompt re-authentication if auto-refresh fails, display token expiration status in settings
- **Token Auto-Refresh** - Background process monitors token expiration and automatically refreshes 5 minutes before expiry, preserves user session without interruption

## Design Direction

The design should evoke focus, clarity, and intelligence - a space that feels purpose-built for deep thinking and conversation. It should be modern and polished without feeling sterile, with subtle warmth that makes extended sessions comfortable.

## Color Selection

A refined, sophisticated palette centered around deep charcoal and intelligent blues that feels both technical and approachable.

- **Primary Color**: Deep Sapphire Blue `oklch(0.45 0.15 250)` - Conveys intelligence, trust, and technical sophistication for primary actions and accent elements
- **Secondary Colors**: 
  - Soft Slate `oklch(0.35 0.02 250)` - For secondary UI elements and message backgrounds
  - Warm Graphite `oklch(0.25 0.01 250)` - Sidebar and secondary surfaces
- **Accent Color**: Electric Cyan `oklch(0.75 0.12 200)` - High-contrast highlight for active states, new message indicators, and CTAs
- **Foreground/Background Pairings**: 
  - Background (Deep Charcoal `oklch(0.15 0.01 250)`): Light Gray text `oklch(0.95 0 0)` - Ratio 11.2:1 ✓
  - Primary (Deep Sapphire `oklch(0.45 0.15 250)`): White text `oklch(1 0 0)` - Ratio 6.8:1 ✓
  - Accent (Electric Cyan `oklch(0.75 0.12 200)`): Deep Charcoal text `oklch(0.15 0.01 250)` - Ratio 8.9:1 ✓
  - User Message (Soft Slate `oklch(0.35 0.02 250)`): Light Gray text `oklch(0.95 0 0)` - Ratio 5.2:1 ✓

## Font Selection

Typography should balance technical clarity with conversational warmth, using a contemporary sans-serif that excels at both UI elements and extended reading.

- **Typographic Hierarchy**:
  - H1 (App Title/Settings Headers): Space Grotesk Bold/24px/tight letter-spacing (-0.02em)
  - H2 (Conversation Titles): Space Grotesk Medium/18px/normal letter-spacing
  - Body (Messages): Inter Regular/15px/relaxed line-height (1.6)/normal letter-spacing
  - Small (Timestamps/Metadata): Inter Regular/13px/normal line-height (1.4)/slight letter-spacing (0.01em)
  - Code Blocks: JetBrains Mono Regular/14px/normal line-height (1.5)

## Animations

Animations should enhance the feeling of intelligence and responsiveness - particularly the streaming text effect and smooth transitions between states. Keep animations subtle and functional: message fade-ins (150ms), smooth scrolling during streaming, gentle hover states on interactive elements (100ms), and fluid panel/modal transitions (250ms). The streaming text should feel like natural typing without mechanical stutter.

## Component Selection

- **Components**:
  - `Textarea` with auto-resize for message input
  - `Button` (primary variant) for send action, (ghost variant) for secondary actions
  - `ScrollArea` for message display and conversation list
  - `Dialog` or `Sheet` for settings/configuration panel
  - `Card` for message containers with variant styling for user vs AI
  - `Separator` for visual breaks between UI sections
  - `Tooltip` for icon buttons and truncated conversation titles
  - `Dropdown Menu` for model selection quick-switch
  - `Badge` for status indicators (connected, error, streaming)
  - `Avatar` for user and AI message attribution
  
- **Customizations**:
  - Custom message components with markdown rendering using `marked` library
  - Styled markdown elements: code blocks with dark backgrounds, proper heading hierarchy, formatted lists and tables
  - Streaming text component with cursor animation
  - Sidebar conversation list with hover actions (rename, delete)
  - Settings panel with tabbed sections for different providers
  
- **States**:
  - Send button: disabled (empty input), active (ready), loading (sending)
  - Input: focused (accent border glow), disabled (during streaming)
  - Messages: streaming (animated cursor), complete (static), error (red accent border)
  - Sidebar items: hover (background highlight), active (accent left border), default
  
- **Icon Selection**:
  - `PaperPlaneRight` for send message
  - `Plus` for new conversation
  - `Gear` for settings/configuration
  - `Robot` for AI avatar
  - `User` for user avatar
  - `List` for conversation history toggle
  - `TrashSimple` for delete conversation
  - `PencilSimple` for rename conversation
  - `CaretDown` for dropdown indicators
  - `Lightning` for model quick-switch
  
- **Spacing**:
  - Container padding: `p-4` (16px) mobile, `p-6` (24px) desktop
  - Message gaps: `gap-4` (16px) between messages
  - Input area padding: `p-3` (12px)
  - Sidebar padding: `p-3` (12px) for items
  - Section spacing: `gap-6` (24px) between major sections
  
- **Mobile**:
  - Collapsible sidebar that overlays on mobile (drawer pattern)
  - Full-width message input with floating send button
  - Sticky header with hamburger menu for sidebar access
  - Reduced padding (`p-3` instead of `p-6`)
  - Touch-optimized button sizes (min 44px)
  - Settings panel uses full-screen sheet on mobile instead of dialog
