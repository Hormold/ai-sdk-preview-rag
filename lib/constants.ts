import { openai } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { SDKName, SDKSource } from "./changelog/sdk-changelog";

export const EMBEDDING_MODEL = openai.embedding("text-embedding-ada-002")
export const SUB_AGENT_MODEL = openai("gpt-5-nano")
export const SMALL_AGENT_MODEL = openai("gpt-5-mini")
export const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

export const BIG_AGENT_MODEL = xai('grok-4')//openai("gpt-5")


export const SDK_SOURCES: Record<SDKName, SDKSource> = {
  [SDKName.JS_SDK]: {
    url: "https://raw.githubusercontent.com/livekit/client-sdk-js/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.REACT]: {
    url: "https://raw.githubusercontent.com/livekit/components-js/main/packages/react/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.REACT_NATIVE]: {
    url: "https://github.com/livekit/client-sdk-react-native/releases.atom",
    type: 'releases_atom'
  },
  [SDKName.SWIFT_IOS]: {
    url: "https://raw.githubusercontent.com/livekit/client-sdk-swift/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.ANDROID]: {
    url: "https://raw.githubusercontent.com/livekit/client-sdk-android/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.FLUTTER]: {
    url: "https://raw.githubusercontent.com/livekit/client-sdk-flutter/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.RUST]: {
    url: "https://raw.githubusercontent.com/livekit/rust-sdks/main/livekit/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.UNITY]: {
    url: "https://github.com/livekit/client-sdk-unity/releases.atom",
    type: 'releases_atom'
  },
  [SDKName.PYTHON_AGENTS]: {
    url: "https://github.com/livekit/agents/releases.atom",
    type: 'releases_atom'
  },
  [SDKName.SERVER_SDK_NODE]: {
    url: "https://raw.githubusercontent.com/livekit/node-sdks/main/packages/livekit-server-sdk/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.SERVER_SDK_GO]: {
    url: "https://github.com/livekit/server-sdk-go/releases.atom",
    type: 'releases_atom'
  },
  [SDKName.SERVER_SDK_PYTHON]: {
    url: "https://github.com/livekit/python-sdks/releases.atom",
    type: 'releases_atom'
  },
  [SDKName.SERVER_SDK_RUBY]: {
    url: "https://raw.githubusercontent.com/livekit/server-sdk-ruby/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.SERVER_SDK_KOTLIN]: {
    url: "https://raw.githubusercontent.com/livekit/server-sdk-kotlin/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.COMPONENTS_ANDROID]: {
    url: "https://raw.githubusercontent.com/livekit/components-android/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.COMPONENTS_FLUTTER]: {
    url: "https://raw.githubusercontent.com/livekit/components-flutter/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.TRACK_PROCESSORS_JS]: {
    url: "https://raw.githubusercontent.com/livekit/track-processors-js/main/CHANGELOG.md",
    type: 'changelog'
  },
  [SDKName.LIVEKIT_SERVER]: {
    url: "https://github.com/livekit/livekit/releases.atom",
    type: 'releases_atom'
  },
  [SDKName.PROTOCOL]: {
    url: "https://github.com/livekit/protocol/releases.atom",
    type: 'releases_atom'
  },
};