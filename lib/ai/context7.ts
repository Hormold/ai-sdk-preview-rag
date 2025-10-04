export const libs = {
	"LiveKit Website ": "/websites/livekit_io",
	"Swift SDK (iOS/macOS)": "/livekit/client-sdk-swift",
	"LLMs Full": "/llmstxt/livekit_io-llms-full.txt",
	"LiveKit Server": "/livekit/livekit",
	"Android SDK (Kotlin)": "/livekit/client-sdk-android",
	"SIP Server": "/livekit/sip-server",
	"Python SDK": "/livekit/python-sdks",
	"Rust SDK": "/livekit/rust-sdks",
	"Node.js SDK": "/livekit/node-sdks",
	"Client JS SDK": "/livekit/client-sdk-js",
	"PHP SDK": "/agence104/livekit-server-sdk-php",
	"Python Agents SDK": "/livekit/agents",
	"Node.js Agents SDK": "/livekit/agents-js",
	"SIP Agent Example": "/livekit-examples/livekit-sip-agent-example",
	"Agent Deployment": "/livekit-examples/agent-deployment",
	"Agent Starter Kit": "/livekit-examples/agent-starter-python",
	"Agent Python Example": "/livekit-examples/python-agents-examples",
	"Outbound Call Example": "/livekit-examples/outbound-caller-python",
	"React Components": "/livekit/components-js",
	"Flutter Components": "/livekit/components-flutter",
	"React Native SDK": "/livekit/client-sdk-react-native",
}

const validLibs = Object.keys(libs);
const validUrls = Object.values(libs);

export const getLibs = async (libName: string, question: string, tokens: number = 5000) => {
	console.log("Getting libs for", {libName, question, tokens, validUrls, validLibs});
	// Check if url is present in validUrls
	if (!validLibs.includes(libName)) {
		throw new Error(`Url ${libName} is not valid, check available libs: ${validLibs.join(", ")}`);
	}

	if (!process.env.CONTEXT7_API_KEY) {
		throw new Error("CONTEXT7_API_KEY is not set");
	}

	const response = await fetch(`https://context7.com/api/v1/${libName}?type=txt&topic=${question}&tokens=${tokens}`, {
		headers: {
			"Authorization": `Bearer ${process.env.CONTEXT7_API_KEY}`,
		},
	});
	return response.text();
}