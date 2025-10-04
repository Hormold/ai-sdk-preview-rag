import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';

const randomId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export async function POST(request: NextRequest) {
  try {
    const { name, pageUrl } = await request.json();


    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials not configured');
      return NextResponse.json(
        { error: 'LiveKit credentials not configured' },
        { status: 500 }
      );
    }

    const roomName = `livekit-demo-${randomId()}`;
    const userIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: randomId(),
      name: name || randomId(),
      metadata: JSON.stringify({ userIp, pageUrl }),
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    at.roomConfig = new RoomConfiguration({
      name: roomName,
      agents: [
        new RoomAgentDispatch({
          agentName: 'livekit-demo', 
          metadata: JSON.stringify({ pageUrl }),
        }),
      ],
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
