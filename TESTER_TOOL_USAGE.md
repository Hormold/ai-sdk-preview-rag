# LiveKit Tester Tool Usage

## How to use the Tester popup in agent responses

The agent can now show a "Open Connection Tester" button that opens a popup.

### Example message structure from the agent:

```json
{
  "role": "assistant",
  "parts": [
    {
      "type": "text",
      "text": "I can help you test your LiveKit connection. Click the button below to open the connection tester.",
      "state": "done"
    },
    {
      "type": "tool-openTester",
      "state": "output-available",
      "output": {
        "description": "Open Connection Tester"
      }
    }
  ]
}
```

### What happens:

1. Agent responds with text explaining the tester
2. A button "Open Connection Tester" appears below the text
3. User clicks the button
4. Popup modal opens with LiveKit connection tester UI
5. User can input LiveKit URL and Room Token
6. Shows connection status (currently mock data)

### Button appearance:

- Cyan background (#1FD5F9) matching brand colors
- Lightning bolt icon
- Text: "Open Connection Tester" (customizable via `description` field)
- Arrow icon on the right

### Popup features:

- Full-screen backdrop with blur
- Centered modal
- LiveKit branding with cyan accent
- Form inputs for URL and Token
- Status display area showing connection steps
- "Test Connection" button at the bottom
- Close button (X) in top right

### To test it:

You can manually test by adding a message to the chat history with the structure above, or configure the agent to return `tool-openTester` type when appropriate.
